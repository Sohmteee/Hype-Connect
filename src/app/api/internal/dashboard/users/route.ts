import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore, getAdminAuth } from "@/services/firebase-admin";
import { getUserPaymentTransactions } from "@/services/firebase/payment-transactions";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q"); // email or userId
    const type = searchParams.get("type"); // hypeman, spotlight
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getAdminFirestore();
    let query = db.collection("users").orderBy("createdAt", "desc");

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.limit(limit).get();
    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.email.toLowerCase().includes(searchLower) ||
          u.displayName.toLowerCase().includes(searchLower) ||
          u.uid.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[Users] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
    const { action, userId } = body;

    const db = getAdminFirestore();
    const adminAuth = getAdminAuth();

    if (action === "suspend") {
      // Disable user in Firebase Auth
      await adminAuth.updateUser(userId, { disabled: true });

      // Mark in Firestore
      await db.collection("users").doc(userId).update({
        suspended: true,
        suspendedAt: new Date().toISOString(),
        suspendedBy: auth.userId,
      });

      return NextResponse.json({
        success: true,
        message: "User suspended",
      });
    }

    if (action === "unsuspend") {
      await adminAuth.updateUser(userId, { disabled: false });

      await db.collection("users").doc(userId).update({
        suspended: false,
        unsuspendedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "User unsuspended",
      });
    }

    if (action === "payment-history") {
      const history = await getUserPaymentTransactions(userId, 100);
      return NextResponse.json({ success: true, data: history });
    }

    if (action === "make-admin") {
      await db.collection("users").doc(userId).update({
        role: "admin",
        isAdmin: true,
      });

      return NextResponse.json({
        success: true,
        message: "User promoted to admin",
      });
    }

    if (action === "remove-admin") {
      await db.collection("users").doc(userId).update({
        role: undefined,
        isAdmin: false,
      });

      return NextResponse.json({
        success: true,
        message: "Admin privileges removed",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Users] Error processing:", error);
    return NextResponse.json(
      { error: "Failed to process user action" },
      { status: 500 }
    );
  }
}
