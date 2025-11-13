import { getAdminFirestore } from "@/services/firebase-admin";

interface PaymentValidation {
  valid: boolean;
  expectedAmount: number;
  actualAmount: number;
  discrepancy: number;
  fraudDetected: boolean;
}

/**
 * Validate payment amount against expected amount
 * Detects amount tampering attempts
 *
 * @param reference - Paystack payment reference
 * @param actualAmount - Amount received from webhook (in Naira)
 * @param maxVariance - Maximum allowed variance in Naira (default 0 = exact match required)
 * @returns Validation result with fraud flag
 */
export async function validatePaymentAmount(
  reference: string,
  actualAmount: number,
  maxVariance: number = 0
): Promise<PaymentValidation> {
  const db = getAdminFirestore();

  try {
    // Fetch the payment transaction record created when payment was initialized
    const txDoc = await db
      .collection("payment-transactions")
      .doc(reference)
      .get();

    if (!txDoc.exists) {
      console.error(
        `[PaymentValidator] Transaction not found for reference: ${reference}`
      );
      // Create fraud alert for unknown transaction
      await createFraudAlert(
        reference,
        "unknown_transaction",
        0,
        actualAmount,
        "Payment received for unknown reference"
      );
      return {
        valid: false,
        expectedAmount: 0,
        actualAmount,
        discrepancy: actualAmount,
        fraudDetected: true,
      };
    }

    const txData = txDoc.data();
    const expectedAmount = txData?.expectedAmount || 0;

    // Calculate discrepancy
    const discrepancy = actualAmount - expectedAmount;
    const fraudDetected = Math.abs(discrepancy) > maxVariance;

    console.log(
      `[PaymentValidator] Reference: ${reference}, Expected: ₦${expectedAmount}, Actual: ₦${actualAmount}, Discrepancy: ₦${discrepancy}, Valid: ${!fraudDetected}`
    );

    // If fraud detected, log fraud alert
    if (fraudDetected) {
      await createFraudAlert(
        reference,
        "amount_mismatch",
        expectedAmount,
        actualAmount,
        `Amount tampering detected: expected ₦${expectedAmount}, received ₦${actualAmount}`
      );
    }

    return {
      valid: !fraudDetected,
      expectedAmount,
      actualAmount,
      discrepancy,
      fraudDetected,
    };
  } catch (error) {
    console.error("[PaymentValidator] Error validating payment:", error);
    // On error, fail open (secure) - don't process payment
    return {
      valid: false,
      expectedAmount: 0,
      actualAmount,
      discrepancy: actualAmount,
      fraudDetected: true,
    };
  }
}

/**
 * Validate webhook metadata against stored transaction data
 * Detects if webhook has been modified/tampered with
 *
 * @param reference - Paystack payment reference
 * @param webhookMetadata - Metadata from the webhook
 * @returns true if metadata matches stored data
 */
export async function validateWebhookMetadata(
  reference: string,
  webhookMetadata: Record<string, any>
): Promise<{ valid: boolean; storedMetadata: Record<string, any> }> {
  const db = getAdminFirestore();

  try {
    const txDoc = await db
      .collection("payment-transactions")
      .doc(reference)
      .get();

    if (!txDoc.exists) {
      console.error(`[PaymentValidator] Transaction not found: ${reference}`);
      return { valid: false, storedMetadata: {} };
    }

    const storedMetadata = txDoc.data()?.metadata || {};

    // Check critical metadata fields haven't changed
    const criticalFields = ["userId", "bookingId", "eventId", "hypemanId"];
    let metadataValid = true;

    for (const field of criticalFields) {
      if (
        storedMetadata[field] &&
        storedMetadata[field] !== webhookMetadata[field]
      ) {
        console.error(
          `[PaymentValidator] Metadata tampering detected for ${field}: expected ${storedMetadata[field]}, got ${webhookMetadata[field]}`
        );
        metadataValid = false;

        // Create fraud alert for metadata tampering
        await createFraudAlert(
          reference,
          "metadata_tampering",
          0,
          0,
          `Metadata field ${field} was tampered with`
        );
      }
    }

    return {
      valid: metadataValid,
      storedMetadata,
    };
  } catch (error) {
    console.error("[PaymentValidator] Error validating metadata:", error);
    return { valid: false, storedMetadata: {} };
  }
}

/**
 * Create a fraud alert in the database
 * Alerts should be reviewed and investigated
 *
 * @param reference - Payment reference
 * @param alertType - Type of fraud detected
 * @param expectedAmount - Expected amount
 * @param actualAmount - Actual amount received
 * @param description - Human-readable description
 */
async function createFraudAlert(
  reference: string,
  alertType: string,
  expectedAmount: number,
  actualAmount: number,
  description: string
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("fraud-alerts").add({
      reference,
      type: alertType,
      expectedAmount,
      actualAmount,
      discrepancy: actualAmount - expectedAmount,
      description,
      timestamp: new Date().toISOString(),
      severity: alertType === "amount_mismatch" ? "critical" : "high",
      status: "unreviewed",
      environment: process.env.NODE_ENV,
    });

    console.warn(`[FraudAlert] ${alertType}: ${description}`);
  } catch (error) {
    console.error("[FraudAlert] Failed to create fraud alert:", error);
  }
}

/**
 * Check if booking has already been paid/confirmed
 * Prevents double-charging the same booking
 *
 * @param bookingId - Booking document ID
 * @returns true if booking is already confirmed
 */
export async function isBookingAlreadyPaid(
  bookingId: string
): Promise<boolean> {
  const db = getAdminFirestore();

  try {
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      console.warn(`[PaymentValidator] Booking not found: ${bookingId}`);
      return false; // Allow processing if booking doesn't exist (will fail later)
    }

    const status = bookingDoc.data()?.status;
    const isAlreadyPaid = status === "confirmed" || status === "completed";

    if (isAlreadyPaid) {
      console.warn(
        `[PaymentValidator] Booking ${bookingId} already ${status}, rejecting duplicate payment`
      );
      await createFraudAlert(
        bookingDoc.data()?.paystackReference || "unknown",
        "double_charge_attempt",
        0,
        0,
        `Attempted to confirm booking ${bookingId} which is already ${status}`
      );
    }

    return isAlreadyPaid;
  } catch (error) {
    console.error("[PaymentValidator] Error checking booking status:", error);
    return false;
  }
}

/**
 * Lock a booking for payment processing
 * Atomically transition from pending to processing
 * Prevents race conditions where same booking paid twice
 *
 * @param bookingId - Booking document ID
 * @returns true if lock acquired, false if already locked
 */
export async function lockBookingForPayment(
  bookingId: string
): Promise<boolean> {
  const db = getAdminFirestore();

  try {
    // Use transaction to atomically check and update
    const result = await db.runTransaction(async (transaction) => {
      const bookingRef = db.collection("bookings").doc(bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists) {
        return false; // Booking doesn't exist
      }

      const currentStatus = bookingDoc.data()?.status;

      // Only lock if status is pending
      if (currentStatus !== "pending") {
        console.warn(
          `[BookingLock] Cannot lock booking ${bookingId}: status is ${currentStatus}, expected pending`
        );
        return false;
      }

      // Update to processing state to lock
      transaction.update(bookingRef, {
        status: "processing",
        processedAt: new Date().toISOString(),
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error("[BookingLock] Error locking booking:", error);
    return false;
  }
}

/**
 * Release booking lock (rollback if payment failed)
 * Only call this if payment verification failed
 *
 * @param bookingId - Booking document ID
 */
export async function unlockBookingForPayment(
  bookingId: string
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("bookings").doc(bookingId).update({
      status: "pending",
      processedAt: null,
    });

    console.log(
      `[BookingLock] Unlocked booking ${bookingId} after payment failure`
    );
  } catch (error) {
    console.error("[BookingLock] Error unlocking booking:", error);
  }
}

/**
 * Get fraud alerts for admin review
 *
 * @param limit - Number of alerts to fetch
 * @returns Array of fraud alerts sorted by timestamp
 */
export async function getFraudAlerts(limit: number = 50): Promise<any[]> {
  const db = getAdminFirestore();

  try {
    const alerts = await db
      .collection("fraud-alerts")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return alerts.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[FraudAlerts] Error fetching fraud alerts:", error);
    return [];
  }
}

/**
 * Mark fraud alert as reviewed
 *
 * @param alertId - Fraud alert document ID
 * @param resolution - How the alert was resolved
 */
export async function resolveFraudAlert(
  alertId: string,
  resolution: "false_positive" | "confirmed_fraud" | "other"
): Promise<void> {
  const db = getAdminFirestore();

  try {
    await db.collection("fraud-alerts").doc(alertId).update({
      status: "reviewed",
      resolution,
      reviewedAt: new Date().toISOString(),
    });

    console.log(
      `[FraudAlert] Alert ${alertId} marked as reviewed: ${resolution}`
    );
  } catch (error) {
    console.error("[FraudAlert] Error resolving fraud alert:", error);
  }
}
