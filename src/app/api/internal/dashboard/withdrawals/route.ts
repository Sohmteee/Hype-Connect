import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending_verification, verified, approved, processing, completed
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getAdminFirestore();
    let query = db.collection("withdrawals").orderBy("requestedAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(limit).get();

    const withdrawals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    console.error("[Withdrawals] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, withdrawalId, decision, reason } = body;

    const db = getAdminFirestore();

    if (action === "approve") {
      await db.collection("withdrawals").doc(withdrawalId).update({
        status: "approved",
        approvedBy: auth.userId,
        approvedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Withdrawal approved",
      });
    }

    if (action === "reject") {
      await db.collection("withdrawals").doc(withdrawalId).update({
        status: "rejected",
        rejectedBy: auth.userId,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Withdrawals] Error processing:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
