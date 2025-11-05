import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

function getDb() {
  return getAdminFirestore();
}

interface EventData {
  name: string;
  location: string;
  hypemanProfileId: string;
}

export async function createEvent(hypemanUserId: string, eventData: EventData) {
  try {
    const db = getDb();
    const eventId = uuidv4();

    const event = {
      eventId,
      hypemanProfileId: hypemanUserId,
      name: eventData.name,
      location: eventData.location,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.collection("events").doc(eventId).set(event);

    return event;
  } catch (error) {
    console.error("Create event error:", error);
    throw new Error("Failed to create event");
  }
}

export async function getEvent(eventId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("events").doc(eventId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error("Get event error:", error);
    throw new Error("Failed to get event");
  }
}

export async function getActiveEvents(limit: number = 20, offset: number = 0) {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("events")
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  } catch (error) {
    console.error("Get active events error:", error);
    throw new Error("Failed to get active events");
  }
}

export async function updateEvent(
  eventId: string,
  userId: string,
  updates: Partial<EventData & { isActive: boolean }>
) {
  try {
    const db = getDb();
    const event = await getEvent(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.hypemanProfileId !== userId) {
      throw new Error("Unauthorized: You are not the event owner");
    }

    await db.collection("events").doc(eventId).update(updates);

    return { ...event, ...updates };
  } catch (error) {
    console.error("Update event error:", error);
    throw error;
  }
}

export async function deactivateEvent(eventId: string, userId: string) {
  try {
    return await updateEvent(eventId, userId, { isActive: false });
  } catch (error) {
    console.error("Deactivate event error:", error);
    throw error;
  }
}
