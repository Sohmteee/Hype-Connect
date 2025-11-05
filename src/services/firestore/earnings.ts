import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

function getDb() {
  return getAdminFirestore();
}

export async function getEarnings(userId: string, profileId: string) {
  try {
    const db = getDb();

    // Get the profile
    const profileDoc = await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId)
      .get();

    if (!profileDoc.exists) {
      throw new Error("Profile not found");
    }

    const earnings = profileDoc.data()?.stats?.earnings || 0;
    return earnings;
  } catch (error) {
    console.error("Get earnings error:", error);
    throw new Error("Failed to get earnings");
  }
}

export async function updateEarnings(
  userId: string,
  profileId: string,
  amount: number
) {
  try {
    const db = getDb();
    const profileRef = db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId);

    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      throw new Error("Profile not found");
    }

    const currentEarnings = profileDoc.data()?.stats?.earnings || 0;
    const newEarnings = currentEarnings + amount;

    await profileRef.update({
      "stats.earnings": newEarnings,
    });

    return newEarnings;
  } catch (error) {
    console.error("Update earnings error:", error);
    throw new Error("Failed to update earnings");
  }
}

interface WithdrawalData {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export async function createWithdrawal(
  userId: string,
  profileId: string,
  withdrawalData: WithdrawalData
) {
  try {
    const db = getDb();
    const withdrawalId = uuidv4();

    // Check if user has sufficient balance
    const earnings = await getEarnings(userId, profileId);
    if (earnings < withdrawalData.amount) {
      throw new Error("Insufficient balance");
    }

    const withdrawal = {
      withdrawalId,
      userId,
      profileId,
      amount: withdrawalData.amount,
      bankName: withdrawalData.bankName,
      accountNumber: withdrawalData.accountNumber,
      accountName: withdrawalData.accountName,
      status: "pending", // pending -> processing -> completed/failed
      paystackTransferId: null,
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };

    await db.collection("withdrawals").doc(withdrawalId).set(withdrawal);

    // Deduct from earnings
    await updateEarnings(userId, profileId, -withdrawalData.amount);

    return withdrawal;
  } catch (error) {
    console.error("Create withdrawal error:", error);
    throw error;
  }
}

export async function getWithdrawal(withdrawalId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("withdrawals").doc(withdrawalId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error("Get withdrawal error:", error);
    throw new Error("Failed to get withdrawal");
  }
}

export async function getWithdrawalHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("withdrawals")
      .where("userId", "==", userId)
      .orderBy("requestedAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  } catch (error) {
    console.error("Get withdrawal history error:", error);
    throw new Error("Failed to get withdrawal history");
  }
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: "pending" | "processing" | "completed" | "failed",
  paystackTransferId?: string
) {
  try {
    const db = getDb();

    const updates: any = {
      status,
      processedAt: new Date().toISOString(),
    };

    if (paystackTransferId) {
      updates.paystackTransferId = paystackTransferId;
    }

    await db.collection("withdrawals").doc(withdrawalId).update(updates);

    return { success: true };
  } catch (error) {
    console.error("Update withdrawal status error:", error);
    throw new Error("Failed to update withdrawal status");
  }
}
