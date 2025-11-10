import { NextResponse, NextRequest } from "next/server";
import { getAdminFirestore } from "@/services/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    // Query users collection for hypemen with public visibility
    const snapshot = await db
      .collection("users")
      .where("type", "==", "hypeman")
      .where("visibility", "==", "public")
      .limit(100)
      .get();

    const hypemen = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        userId: doc.id,
        displayName: data.displayName || "Hypeman",
        publicBio: data.publicBio || "",
        visibility: data.visibility || "public",
        photoURL: data.photoURL || null,
      };
    });

    return NextResponse.json({ success: true, data: hypemen });
  } catch (error) {
    console.error("Get hypemen error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hypemen" },
      { status: 500 }
    );
  }
}
