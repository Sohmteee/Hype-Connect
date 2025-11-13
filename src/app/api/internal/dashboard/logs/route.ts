import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";
import { getRecentFailedPayments } from "@/services/firebase/payment-transactions";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const logType = searchParams.get("type"); // failures, duplicates, webhooks, all
    const hoursBack = parseInt(searchParams.get("hoursBack") || "24");

    const db = getAdminFirestore();

    const logs = {
      failedPayments: [] as any[],
      webhookErrors: [] as any[],
      duplicateAttempts: [] as any[],
      rateLimitHits: [] as any[],
    };

    // Fetch failed payments
    if (!logType || logType === "failures" || logType === "all") {
      const failures = await getRecentFailedPayments(hoursBack);
      logs.failedPayments = failures.map((f) => ({
        type: "payment_failed",
        reference: f.reference,
        userId: f.userId,
        reason: f.failureReason,
        timestamp: f.initiatedAt,
      }));
    }

    // Fetch webhook errors
    if (!logType || logType === "webhooks" || logType === "all") {
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const webhookLogs = await db
        .collection("webhook-logs")
        .where("processedAt", ">", cutoff.toISOString())
        .where("status", "==", "error")
        .orderBy("processedAt", "desc")
        .limit(100)
        .get();

      logs.webhookErrors = webhookLogs.docs.map((doc) => ({
        type: "webhook_error",
        event: doc.data().event,
        error: doc.data().error,
        timestamp: doc.data().processedAt,
      }));
    }

    // Fetch duplicate attempts
    if (!logType || logType === "duplicates" || logType === "all") {
      const duplicates = await db
        .collection("webhook-logs")
        .where("status", "==", "skipped")
        .where(
          "processedAt",
          ">",
          new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
        )
        .orderBy("processedAt", "desc")
        .limit(50)
        .get();

      logs.duplicateAttempts = duplicates.docs.map((doc) => ({
        type: "duplicate_webhook",
        event: doc.data().event,
        timestamp: doc.data().processedAt,
      }));
    }

    // Fetch rate limit hits (if tracked)
    if (!logType || logType === "rate-limits" || logType === "all") {
      const rateLimits = await db
        .collection("rate-limit-logs")
        .where(
          "timestamp",
          ">",
          new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
        )
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      logs.rateLimitHits = rateLimits.docs.map((doc) => ({
        type: "rate_limit",
        endpoint: doc.data().endpoint,
        ip: doc.data().ip,
        timestamp: doc.data().timestamp,
      }));
    }

    // Flatten and sort by timestamp
    const allLogs = [
      ...logs.failedPayments,
      ...logs.webhookErrors,
      ...logs.duplicateAttempts,
      ...logs.rateLimitHits,
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      logs: allLogs,
      summary: {
        failedPayments: logs.failedPayments.length,
        webhookErrors: logs.webhookErrors.length,
        duplicateAttempts: logs.duplicateAttempts.length,
        rateLimitHits: logs.rateLimitHits.length,
        total: allLogs.length,
      },
      timeRange: `${hoursBack}h`,
    });
  } catch (error) {
    console.error("[Logs] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
