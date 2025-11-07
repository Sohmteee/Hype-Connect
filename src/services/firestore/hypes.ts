import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

function getDb() {
  return getAdminFirestore();
}

interface HypeMessageData {
  userId: string;
  profileId: string;
  message: string;
  amount: number;
  senderName?: string;
}

export async function createHypeMessage(
  eventId: string,
  hypeData: HypeMessageData,
  paystackReference: string
) {
  try {
    const db = getDb();
    const hypeId = uuidv4();

    const hypeMessage = {
      messageId: hypeId,
      userId: hypeData.userId,
      profileId: hypeData.profileId,
      eventId,
      message: hypeData.message,
      amount: hypeData.amount,
      senderName: hypeData.senderName || "Anonymous",
      paystackReference,
      status: "pending", // pending -> confirmed after webhook
      timestamp: new Date().toISOString(),
    };

    await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .doc(hypeId)
      .set(hypeMessage);

    return hypeMessage;
  } catch (error) {
    console.error("Create hype message error:", error);
    throw new Error("Failed to create hype message");
  }
}

export async function getHypeMessages(
  eventId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  } catch (error) {
    console.error("Get hype messages error:", error);
    throw new Error("Failed to get hype messages");
  }
}

export async function updateHypeStatus(
  eventId: string,
  hypeId: string,
  status: "new" | "hyped" | "confirmed" | "pending"
) {
  try {
    const db = getDb();

    await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .doc(hypeId)
      .update({ status });

    return { success: true };
  } catch (error) {
    console.error("Update hype status error:", error);
    throw new Error("Failed to update hype status");
  }
}

export async function getLeaderboard(eventId: string, limit: number = 20) {
  try {
    const db = getDb();

    // Get confirmed hypes
    const confirmedSnapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .where("status", "==", "confirmed")
      .orderBy("timestamp", "desc")
      .get();

    // Get hyped hypes (also paid, just acknowledged by hypeman)
    const hypedSnapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .where("status", "==", "hyped")
      .orderBy("timestamp", "desc")
      .get();

    // Group hypes by userId and sum amounts (use first senderName for display)
    const tippers: {
      [key: string]: {
        amount: number;
        senderName: string;
        message: string;
        timestamp: string;
      };
    } = {};

    // Process confirmed hypes
    confirmedSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const userId = data.userId || "anonymous";

      if (!tippers[userId]) {
        tippers[userId] = {
          amount: 0,
          senderName: data.senderName || "Anonymous",
          message: data.message,
          timestamp: data.timestamp,
        };
      }

      tippers[userId].amount += data.amount;
    });

    // Process hyped hypes
    hypedSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const userId = data.userId || "anonymous";

      if (!tippers[userId]) {
        tippers[userId] = {
          amount: 0,
          senderName: data.senderName || "Anonymous",
          message: data.message,
          timestamp: data.timestamp,
        };
      }

      tippers[userId].amount += data.amount;
    });

    // Convert to array and sort by amount descending
    const leaderboard = Object.entries(tippers)
      .map(([userId, data]) => ({
        senderName: data.senderName,
        amount: data.amount,
        message: data.message,
        timestamp: data.timestamp,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);

    return leaderboard;
  } catch (error) {
    console.error("Get leaderboard error:", error);
    throw new Error("Failed to get leaderboard");
  }
}

export async function getHypeByReference(paystackReference: string) {
  try {
    const db = getDb();
    const snapshot = await db
      .collectionGroup("hypes")
      .where("paystackReference", "==", paystackReference)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Get hype by reference error:", error);
    throw new Error("Failed to get hype by reference");
  }
}
