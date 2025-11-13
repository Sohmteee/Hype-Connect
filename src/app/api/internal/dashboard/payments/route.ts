import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";
import {
  getUserPaymentTransactions,
  getRecentFailedPayments,
} from "@/services/firebase/payment-transactions";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q"); // reference, userId, email
    const status = searchParams.get("status"); // initialized, verified, completed, failed, rejected
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getAdminFirestore();
    let query = db
      .collection("payment-transactions")
      .orderBy("initiatedAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.limit(limit).get();
    let payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side filtering for search (reference, userId, email)
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(
        (p: any) =>
          p.reference.toLowerCase().includes(searchLower) ||
          p.userId.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error("[PaymentsSearch] Error:", error);
    return NextResponse.json(
      { error: "Failed to search payments" },
      { status: 500 }
    );
  }
}

// GET failed payments
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, hoursBack } = body;

    if (action === "failed-recent") {
      const failures = await getRecentFailedPayments(hoursBack || 24);
      return NextResponse.json({ success: true, payments: failures });
    }

    if (action === "user-history") {
      const { userId } = body;
      const history = await getUserPaymentTransactions(userId, 100);
      return NextResponse.json({ success: true, payments: history });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[PaymentsSearch] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment data" },
      { status: 500 }
    );
  }
}
