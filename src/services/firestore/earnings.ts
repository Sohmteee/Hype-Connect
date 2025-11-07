import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

function getDb() {
  return getAdminFirestore();
}

/**
 * Get earnings breakdown for a hypeman
 * Returns: totalEarned (permanent record), withdrawableBalance, totalWithdrawn
 *
 * For backward compatibility, also includes earnings from confirmed/hyped hypes
 * that haven't been accounted for in stats.totalEarned yet (from ended events)
 */
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

    const profileData = profileDoc.data();
    let totalEarned = profileData?.stats?.totalEarned || 0;
    const totalWithdrawn = profileData?.stats?.totalWithdrawn || 0;

    console.log(`[getEarnings] userId: ${userId}, profileId: ${profileId}`);
    console.log(
      `[getEarnings] stored totalEarned: ${totalEarned}, totalWithdrawn: ${totalWithdrawn}`
    );

    // Also calculate earnings from confirmed/hyped hypes in ALL events (including ended)
    // This ensures backward compatibility with existing confirmed hypes
    const eventsSnapshot = await db
      .collection("events")
      .where("hypemanProfileId", "==", userId)
      .get();

    console.log(`[getEarnings] Found ${eventsSnapshot.docs.length} events`);

    let additionalEarnings = 0;

    for (const event of eventsSnapshot.docs) {
      const eventData = event.data();
      console.log(
        `[getEarnings] Processing event: ${event.id}, isActive: ${eventData.isActive}`
      );

      // Get confirmed hypes
      const confirmedSnapshot = await db
        .collection("events")
        .doc(event.id)
        .collection("hypes")
        .where("status", "==", "confirmed")
        .get();

      confirmedSnapshot.docs.forEach((doc: any) => {
        const amount = doc.data().amount || 0;
        console.log(`[getEarnings] Found confirmed hype: ₦${amount}`);
        additionalEarnings += amount;
      });

      // Get hyped hypes
      const hypedSnapshot = await db
        .collection("events")
        .doc(event.id)
        .collection("hypes")
        .where("status", "==", "hyped")
        .get();

      hypedSnapshot.docs.forEach((doc: any) => {
        const amount = doc.data().amount || 0;
        console.log(`[getEarnings] Found hyped hype: ₦${amount}`);
        additionalEarnings += amount;
      });
    }

    console.log(
      `[getEarnings] additionalEarnings from hypes: ${additionalEarnings}`
    );

    // Use whichever is higher - either the stored totalEarned or calculated from hypes
    // This ensures we never lose earnings and can recover from event deletions
    totalEarned = Math.max(totalEarned, additionalEarnings);

    console.log(`[getEarnings] final totalEarned: ${totalEarned}`);

    const withdrawableBalance = totalEarned - totalWithdrawn;

    return {
      totalEarned,
      withdrawableBalance: Math.max(0, withdrawableBalance),
      totalWithdrawn,
    };
  } catch (error) {
    console.error("Get earnings error:", error);
    throw new Error("Failed to get earnings");
  }
}

/**
 * Add earned amount to hypeman's total earnings
 * Called when a hype is confirmed or marked as hyped
 */
export async function addEarnings(
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

    const currentTotal = profileDoc.data()?.stats?.totalEarned || 0;
    const newTotal = currentTotal + amount;

    await profileRef.update({
      "stats.totalEarned": newTotal,
    });

    return newTotal;
  } catch (error) {
    console.error("Add earnings error:", error);
    throw new Error("Failed to add earnings");
  }
}

/**
 * Deduct withdrawn amount from withdrawable balance
 * Called when a withdrawal is processed
 * Applies 20% platform fee
 */
export async function deductWithdrawnAmount(
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

    const totalWithdrawn = profileDoc.data()?.stats?.totalWithdrawn || 0;
    const newTotalWithdrawn = totalWithdrawn + amount;

    await profileRef.update({
      "stats.totalWithdrawn": newTotalWithdrawn,
    });

    return newTotalWithdrawn;
  } catch (error) {
    console.error("Deduct withdrawn amount error:", error);
    throw new Error("Failed to update withdrawal");
  }
}

interface WithdrawalData {
  amount: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

const PLATFORM_FEE_PERCENTAGE = 0.2; // 20% platform fee

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
    if (earnings.withdrawableBalance < withdrawalData.amount) {
      throw new Error("Insufficient balance");
    }

    // Calculate amounts: user gets 80%, platform takes 20%
    const platformFee = withdrawalData.amount * PLATFORM_FEE_PERCENTAGE;
    const userReceivesAmount = withdrawalData.amount - platformFee;

    const withdrawal = {
      withdrawalId,
      userId,
      profileId,
      requestedAmount: withdrawalData.amount,
      userReceivesAmount,
      platformFee,
      bankName: withdrawalData.bankName,
      bankCode: withdrawalData.bankCode,
      accountNumber: withdrawalData.accountNumber,
      accountName: withdrawalData.accountName,
      status: "pending", // pending -> processing -> completed/failed
      paystackTransferId: null,
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };

    await db.collection("withdrawals").doc(withdrawalId).set(withdrawal);

    // Deduct from withdrawable balance (total amount including fee)
    await deductWithdrawnAmount(userId, profileId, withdrawalData.amount);

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
