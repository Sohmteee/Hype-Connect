import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";
import {
  getFraudAlerts,
  resolveFraudAlert,
} from "@/services/firebase/payment-validator";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // unreviewed, reviewed
    const severity = searchParams.get("severity"); // critical, high, medium

    const db = getAdminFirestore();
    let query = db.collection("fraud-alerts").orderBy("timestamp", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    if (severity) {
      query = query.where("severity", "==", severity);
    }

    const snapshot = await query.limit(limit).get();

    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error("[FraudAlerts] Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch fraud alerts" },
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
    const { alertId, resolution } = body;

    if (!alertId || !resolution) {
      return NextResponse.json(
        { error: "Missing alertId or resolution" },
        { status: 400 }
      );
    }

    await resolveFraudAlert(alertId, resolution);

    return NextResponse.json({
      success: true,
      message: "Fraud alert resolved",
    });
  } catch (error) {
    console.error("[FraudAlerts] Error resolving alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve fraud alert" },
      { status: 500 }
    );
  }
}
