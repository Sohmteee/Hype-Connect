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
    const status = searchParams.get("status"); // pending, confirmed, completed, failed
    const hypemanId = searchParams.get("hypemanId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getAdminFirestore();
    let query = db.collection("bookings").orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    if (hypemanId) {
      query = query.where("hypemanUserId", "==", hypemanId);
    }

    const snapshot = await query.limit(limit).get();

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        status: data.status || "pending",
        amount: data.amount || 25000,
      };
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("[Bookings] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
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
    const { action, bookingId, status } = body;

    const db = getAdminFirestore();

    if (action === "update-status") {
      await db.collection("bookings").doc(bookingId).update({
        status,
        updatedBy: auth.userId,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Booking updated",
      });
    }

    if (action === "cancel") {
      await db.collection("bookings").doc(bookingId).update({
        status: "cancelled",
        cancelledBy: auth.userId,
        cancelledAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Booking cancelled",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Bookings] Error processing:", error);
    return NextResponse.json(
      { error: "Failed to process booking action" },
      { status: 500 }
    );
  }
}
