import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/services/admin/auth";
import { getAdminFirestore } from "@/services/firebase-admin";

/**
 * Serialize Firestore data for JSON response (converts Timestamps to ISO strings)
 */
function serializeFirestoreData(data: any): any {
  if (!data) return data;
  
  if (typeof data !== 'object') return data;
  
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }
  
  const serialized: any = {};
  for (const key in data) {
    serialized[key] = serializeFirestoreData(data[key]);
  }
  return serialized;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status"); // confirmed, hyped, new
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = getAdminFirestore();

    // If eventId is provided, use the old behavior for backward compatibility
    if (eventId) {
      let query = db
        .collection("events")
        .doc(eventId)
        .collection("hypes")
        .orderBy("timestamp", "desc");

      if (status) {
        query = query.where("status", "==", status);
      }

      const snapshot = await query.limit(limit).get();

      const hypes = snapshot.docs.map((doc) =>
        serializeFirestoreData({
          id: doc.id,
          ...doc.data(),
        })
      );

      return NextResponse.json({ success: true, hypes });
    }

    // If no eventId, return all events with their hypes
    const eventsSnapshot = await db
      .collection("events")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const eventsWithHypes = await Promise.all(
      eventsSnapshot.docs.map(async (eventDoc) => {
        let hypesQuery = eventDoc.ref
          .collection("hypes")
          .orderBy("timestamp", "desc");

        if (status) {
          hypesQuery = hypesQuery.where("status", "==", status);
        }

        const hypesSnapshot = await hypesQuery.get();
        const hypes = hypesSnapshot.docs.map((doc) => 
          serializeFirestoreData({
            id: doc.id,
            ...doc.data(),
          })
        );

        return {
          event: serializeFirestoreData({
            id: eventDoc.id,
            ...eventDoc.data(),
          }),
          hypes,
        };
      })
    );

    // Filter out events with no hypes
    const filteredEvents = eventsWithHypes.filter((e) => e.hypes.length > 0);

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length,
    });
  } catch (error) {
    console.error("[Hypes] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch hypes" },
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
    const { action, eventId, hypeId, reason } = body;

    const db = getAdminFirestore();

    if (action === "delete") {
      await db
        .collection("events")
        .doc(eventId)
        .collection("hypes")
        .doc(hypeId)
        .delete();

      return NextResponse.json({
        success: true,
        message: "Hype deleted",
      });
    }

    if (action === "flag") {
      await db
        .collection("events")
        .doc(eventId)
        .collection("hypes")
        .doc(hypeId)
        .update({
          flagged: true,
          flagReason: reason,
          flaggedBy: auth.userId,
          flaggedAt: new Date().toISOString(),
        });

      return NextResponse.json({
        success: true,
        message: "Hype flagged for review",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Hypes] Error processing:", error);
    return NextResponse.json(
      { error: "Failed to process hype action" },
      { status: 500 }
    );
  }
}
