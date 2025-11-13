import { getAdminFirestore } from "@/services/firebase-admin";

interface PaymentTransaction {
  reference: string;
  userId: string;
  email: string;
  expectedAmount: number;
  metadata: Record<string, any>;
  status: "initialized" | "verified" | "completed" | "failed" | "rejected";
  initiatedAt: string;
  verifiedAt?: string;
  completedAt?: string;
  failureReason?: string;
  paystackResponse?: any;
}

/**
 * Record a payment transaction when it's initialized
 * This creates the source of truth for validation later
 *
 * @param reference - Paystack payment reference
 * @param userId - User initiating the payment
 * @param email - User's email (from Firebase auth)
 * @param expectedAmount - The amount the user agreed to pay (in Naira)
 * @param metadata - Additional data (eventId, bookingId, etc)
 */
export async function recordPaymentInitialized(
  reference: string,
  userId: string,
  email: string,
  expectedAmount: number,
  metadata: Record<string, any>
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db
      .collection("payment-transactions")
      .doc(reference)
      .set({
        reference,
        userId,
        email,
        expectedAmount,
        metadata,
        status: "initialized",
        initiatedAt: new Date().toISOString(),
        initiatedBy: userId,
        environment: process.env.NODE_ENV,
      } as PaymentTransaction);

    console.log(
      `[PaymentTransaction] Recorded initialization: ${reference}, amount: ₦${expectedAmount}, user: ${userId}`
    );
  } catch (error) {
    console.error("[PaymentTransaction] Error recording payment:", error);
    throw new Error("Failed to record payment transaction");
  }
}

/**
 * Update transaction status to verified
 * Called after webhook validates the payment
 *
 * @param reference - Paystack payment reference
 * @param paystackResponse - Response from Paystack API
 */
export async function markPaymentVerified(
  reference: string,
  paystackResponse: any
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("payment-transactions").doc(reference).update({
      status: "verified",
      verifiedAt: new Date().toISOString(),
      paystackResponse,
    });

    console.log(`[PaymentTransaction] Marked as verified: ${reference}`);
  } catch (error) {
    console.error("[PaymentTransaction] Error marking verified:", error);
    throw new Error("Failed to update payment status");
  }
}

/**
 * Update transaction status to completed
 * Called after all wallet updates are done
 *
 * @param reference - Paystack payment reference
 */
export async function markPaymentCompleted(reference: string): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("payment-transactions").doc(reference).update({
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    console.log(`[PaymentTransaction] Marked as completed: ${reference}`);
  } catch (error) {
    console.error("[PaymentTransaction] Error marking completed:", error);
    throw new Error("Failed to update payment status");
  }
}

/**
 * Update transaction status to failed
 * Called when payment validation fails
 *
 * @param reference - Paystack payment reference
 * @param reason - Why the payment failed validation
 */
export async function markPaymentFailed(
  reference: string,
  reason: string
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("payment-transactions").doc(reference).update({
      status: "failed",
      failureReason: reason,
      failedAt: new Date().toISOString(),
    });

    console.log(
      `[PaymentTransaction] Marked as failed: ${reference}, reason: ${reason}`
    );
  } catch (error) {
    console.error("[PaymentTransaction] Error marking failed:", error);
    throw new Error("Failed to update payment status");
  }
}

/**
 * Update transaction status to rejected
 * Called when payment is rejected for fraud/validation issues
 *
 * @param reference - Paystack payment reference
 * @param reason - Why the payment was rejected
 */
export async function markPaymentRejected(
  reference: string,
  reason: string
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("payment-transactions").doc(reference).update({
      status: "rejected",
      failureReason: reason,
      rejectedAt: new Date().toISOString(),
    });

    console.log(
      `[PaymentTransaction] Marked as rejected: ${reference}, reason: ${reason}`
    );
  } catch (error) {
    console.error("[PaymentTransaction] Error marking rejected:", error);
    throw new Error("Failed to update payment status");
  }
}

/**
 * Get a payment transaction record
 * Used for debugging and audit trails
 *
 * @param reference - Paystack payment reference
 * @returns Transaction record or null if not found
 */
export async function getPaymentTransaction(
  reference: string
): Promise<PaymentTransaction | null> {
  const db = getAdminFirestore();

  try {
    const doc = await db
      .collection("payment-transactions")
      .doc(reference)
      .get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as PaymentTransaction;
  } catch (error) {
    console.error("[PaymentTransaction] Error fetching transaction:", error);
    return null;
  }
}

/**
 * Get all payment transactions for a user
 * Used for payment history
 *
 * @param userId - User ID
 * @param limit - Number of transactions to fetch
 * @returns Array of transactions
 */
export async function getUserPaymentTransactions(
  userId: string,
  limit: number = 50
): Promise<PaymentTransaction[]> {
  const db = getAdminFirestore();

  try {
    const docs = await db
      .collection("payment-transactions")
      .where("userId", "==", userId)
      .orderBy("initiatedAt", "desc")
      .limit(limit)
      .get();

    return docs.docs.map((doc) => doc.data() as PaymentTransaction);
  } catch (error) {
    console.error(
      "[PaymentTransaction] Error fetching user transactions:",
      error
    );
    return [];
  }
}

/**
 * Get transaction statistics
 * Used for analytics and monitoring
 *
 * @returns Object with transaction stats
 */
export async function getPaymentTransactionStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  rejected: number;
  pending: number;
  avgAmount: number;
  totalAmount: number;
}> {
  const db = getAdminFirestore();

  try {
    const docs = await db.collection("payment-transactions").get();

    let total = 0;
    let completed = 0;
    let failed = 0;
    let rejected = 0;
    let pending = 0;
    let totalAmount = 0;

    docs.docs.forEach((doc) => {
      const data = doc.data() as PaymentTransaction;
      total++;
      totalAmount += data.expectedAmount;

      switch (data.status) {
        case "completed":
          completed++;
          break;
        case "failed":
          failed++;
          break;
        case "rejected":
          rejected++;
          break;
        case "initialized":
        case "verified":
          pending++;
          break;
      }
    });

    return {
      total,
      completed,
      failed,
      rejected,
      pending,
      avgAmount: total > 0 ? Math.round(totalAmount / total) : 0,
      totalAmount,
    };
  } catch (error) {
    console.error("[PaymentTransaction] Error fetching stats:", error);
    return {
      total: 0,
      completed: 0,
      failed: 0,
      rejected: 0,
      pending: 0,
      avgAmount: 0,
      totalAmount: 0,
    };
  }
}

/**
 * Get failed payments within a time range
 * Used for monitoring and alerts
 *
 * @param hoursBack - Look back this many hours
 * @returns Array of failed transactions
 */
export async function getRecentFailedPayments(
  hoursBack: number = 24
): Promise<PaymentTransaction[]> {
  const db = getAdminFirestore();

  try {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const docs = await db
      .collection("payment-transactions")
      .where("status", "in", ["failed", "rejected"])
      .where("initiatedAt", ">", cutoffTime.toISOString())
      .orderBy("initiatedAt", "desc")
      .get();

    return docs.docs.map((doc) => doc.data() as PaymentTransaction);
  } catch (error) {
    console.error(
      "[PaymentTransaction] Error fetching recent failures:",
      error
    );
    return [];
  }
}

/**
 * Find duplicate payment attempts
 * Detects if user is trying to pay multiple times
 *
 * @param userId - User ID
 * @param withinMinutes - Look within this many minutes
 * @returns Array of near-duplicate transactions
 */
export async function findDuplicateAttempts(
  userId: string,
  withinMinutes: number = 5
): Promise<PaymentTransaction[]> {
  const db = getAdminFirestore();

  try {
    const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

    const docs = await db
      .collection("payment-transactions")
      .where("userId", "==", userId)
      .where("status", "in", ["initialized", "verified"])
      .where("initiatedAt", ">", cutoffTime.toISOString())
      .orderBy("initiatedAt", "desc")
      .get();

    return docs.docs.map((doc) => doc.data() as PaymentTransaction);
  } catch (error) {
    console.error("[PaymentTransaction] Error finding duplicates:", error);
    return [];
  }
}

/**
 * Reconcile payment transactions with Paystack records
 * Should be run periodically (daily) to detect discrepancies
 *
 * @returns Object with reconciliation results
 */
export async function reconcilePaymentTransactions(): Promise<{
  scanned: number;
  matched: number;
  discrepancies: Array<{ reference: string; issue: string }>;
}> {
  const db = getAdminFirestore();

  try {
    // Get all local transactions
    const localTxs = await db.collection("payment-transactions").get();

    const discrepancies = [];
    let matched = 0;

    // In a real implementation, you'd query Paystack API for each transaction
    // For now, just check local consistency
    for (const doc of localTxs.docs) {
      const tx = doc.data() as PaymentTransaction;

      // Check: status flow is valid (initialized -> verified -> completed)
      const validStatuses =
        tx.status === "initialized" ||
        (tx.status === "verified" && tx.verifiedAt) ||
        (tx.status === "completed" && tx.completedAt) ||
        (tx.status === "failed" && tx.failureReason) ||
        (tx.status === "rejected" && tx.failureReason);

      if (validStatuses) {
        matched++;
      } else {
        discrepancies.push({
          reference: tx.reference,
          issue: `Invalid status flow for ${tx.status}`,
        });
      }

      // Check: required fields are present
      if (!tx.userId || !tx.email || !tx.expectedAmount) {
        discrepancies.push({
          reference: tx.reference,
          issue: "Missing required fields",
        });
      }
    }

    console.log(
      `[Reconciliation] Scanned ${localTxs.size} transactions, matched ${matched}, found ${discrepancies.length} discrepancies`
    );

    return {
      scanned: localTxs.size,
      matched,
      discrepancies,
    };
  } catch (error) {
    console.error("[Reconciliation] Error reconciling transactions:", error);
    return {
      scanned: 0,
      matched: 0,
      discrepancies: [],
    };
  }
}
