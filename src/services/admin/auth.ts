import { getAdminAuth, getAdminFirestore } from "@/services/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify admin access for internal dashboard routes
 * Checks: 1) User is authenticated 2) User has admin role in Firestore
 */
export async function verifyAdminAccess(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Get auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "Missing authorization header" };
    }

    const token = authHeader.slice(7);
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user has admin role
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { valid: false, error: "User not found" };
    }

    const userData = userDoc.data();
    const isAdmin = userData?.role === "admin" || userData?.isAdmin === true;

    if (!isAdmin) {
      console.warn(`[AdminAuth] Unauthorized access attempt by user ${userId}`);
      return { valid: false, error: "User does not have admin privileges" };
    }

    console.log(`[AdminAuth] Admin access verified for user ${userId}`);
    return { valid: true, userId };
  } catch (error) {
    console.error("[AdminAuth] Error verifying admin access:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Middleware wrapper for admin endpoints
 */
export async function withAdminAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await verifyAdminAccess(request);

    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, auth.userId!);
  };
}
