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
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = getAdminFirestore();
    const query = db.collection("events").orderBy("createdAt", "desc");

    const snapshot = await query.limit(limit).get();

    // Calculate hypes and earnings for each event
    const events = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const eventData = doc.data();

        // Check if event has actually ended based on endDateTime
        const endDateTime = eventData.endDateTime
          ? new Date(eventData.endDateTime)
          : null;
        const now = new Date();
        const hasEnded = endDateTime && endDateTime < now;

        // isActive should be true only if:
        // 1. The isActive flag is true AND
        // 2. The end date hasn't passed yet
        const computedIsActive = eventData.isActive && !hasEnded;

        // Get hypes count and total amount
        const hypesSnapshot = await db
          .collection("events")
          .doc(doc.id)
          .collection("hypes")
          .where("status", "in", ["confirmed", "hyped"])
          .get();

        let totalHyped = 0;
        hypesSnapshot.docs.forEach((hypeDoc) => {
          totalHyped += hypeDoc.data().amount || 0;
        });

        return {
          id: doc.id,
          title: eventData.name, // Map name to title for display
          startDateTime: eventData.startDateTime,
          endDateTime: eventData.endDateTime,
          isActive: computedIsActive, // Use computed active status
          location: eventData.location,
          hypemanName: eventData.hypemanName,
          hypemanProfileId: eventData.hypemanProfileId,
          imageUrl: eventData.imageUrl,
          createdAt: eventData.createdAt,
          hypesCount: hypesSnapshot.size,
          totalHyped,
          hypesEarnings: Math.round(totalHyped * 0.2), // 20% platform cut
        };
      })
    );

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("[Events] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
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
    const { action, eventId, reason } = body;

    const db = getAdminFirestore();

    if (action === "deactivate") {
      await db.collection("events").doc(eventId).update({
        isActive: false,
        deactivatedBy: auth.userId,
        deactivationReason: reason,
        deactivatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Event deactivated",
      });
    }

    if (action === "reactivate") {
      await db.collection("events").doc(eventId).update({
        isActive: true,
        reactivatedBy: auth.userId,
        reactivatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Event reactivated",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Events] Error processing:", error);
    return NextResponse.json(
      { error: "Failed to process event action" },
      { status: 500 }
    );
  }
}
