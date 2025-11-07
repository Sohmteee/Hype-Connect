import { firestore } from "@/firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface ClientHypeMessage {
  userId: string;
  message: string;
  amount: number;
  senderName?: string;
  paystackReference: string;
}

/**
 * Create a hype message (client-side, respects Firestore security rules)
 */
export async function createHypeMessageClient(
  eventId: string,
  hypeData: ClientHypeMessage
) {
  const hypeId = uuidv4();

  const hypeMessage = {
    messageId: hypeId,
    userId: hypeData.userId,
    profileId: hypeData.userId,
    eventId,
    message: hypeData.message,
    amount: hypeData.amount,
    senderName: hypeData.senderName || "Anonymous",
    paystackReference: hypeData.paystackReference,
    status: "pending",
    timestamp: new Date().toISOString(),
  };

  await setDoc(doc(firestore, "events", eventId, "hypes", hypeId), hypeMessage);

  return hypeMessage;
}

/**
 * Update hype status (Admin only via server)
 */
export async function updateHypeStatusClient(
  eventId: string,
  hypeId: string,
  status: "confirmed" | "declined"
) {
  await updateDoc(doc(firestore, "events", eventId, "hypes", hypeId), {
    status,
  });
}
