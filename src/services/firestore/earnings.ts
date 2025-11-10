import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

function getDb() {
  return getAdminFirestore();
}

/**
 * Get earnings breakdown for a hypeman
 * Returns: balance (withdrawable), totalEarned, totalWithdrawn from wallet doc
 */
export async function getEarnings(userId: string) {
  try {
    const db = getDb();

    // Get the wallet document
    const walletDoc = await db.collection("wallets").doc(userId).get();

    if (!walletDoc.exists) {
      // Return default empty wallet if not found
      return {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      };
    }

    const walletData = walletDoc.data();
    return {
      balance: walletData?.balance || 0,
      totalEarned: walletData?.totalEarned || 0,
      totalWithdrawn: walletData?.totalWithdrawn || 0,
    };
  } catch (error) {
    console.error("[getEarnings] Error fetching wallet:", error);
    throw error;
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
  withdrawalData: WithdrawalData
) {
  try {
    const db = getDb();
    const withdrawalId = uuidv4();

    // Check if user has sufficient balance
    const earnings = await getEarnings(userId);
    if (earnings.balance < withdrawalData.amount) {
      throw new Error("Insufficient balance");
    }

    // Calculate amounts: user gets 80%, platform takes 20%
    const platformFee = withdrawalData.amount * PLATFORM_FEE_PERCENTAGE;
    const userReceivesAmount = withdrawalData.amount - platformFee;

    const withdrawal = {
      withdrawalId,
      userId,
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

    // Deduct from wallet balance
    const walletRef = db.collection("wallets").doc(userId);
    const walletDoc = await walletRef.get();
    const currentBalance = walletDoc.exists
      ? walletDoc.data()?.balance || 0
      : 0;
    const currentWithdrawn = walletDoc.exists
      ? walletDoc.data()?.totalWithdrawn || 0
      : 0;

    await walletRef.update({
      balance: currentBalance - withdrawalData.amount,
      totalWithdrawn: currentWithdrawn + withdrawalData.amount,
    });

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
