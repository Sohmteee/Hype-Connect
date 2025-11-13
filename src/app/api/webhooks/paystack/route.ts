import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";
import { getAdminFirestore } from "@/services/firebase-admin";
import {
  validatePaymentAmount,
  validateWebhookMetadata,
  isBookingAlreadyPaid,
} from "@/services/firebase/payment-validator";
import {
  markPaymentVerified,
  markPaymentCompleted,
  markPaymentRejected,
} from "@/services/firebase/payment-transactions";
import { v4 as uuidv4 } from "uuid";

/**
 * Webhook idempotency: Prevent duplicate processing if Paystack retries the webhook
 * Paystack can deliver the same webhook multiple times - we must handle this safely
 */
async function isWebhookAlreadyProcessed(
  db: FirebaseFirestore.Firestore,
  webhookId: string
): Promise<boolean> {
  const logRef = db.collection("webhook-logs").doc(webhookId);
  const doc = await logRef.get();
  return doc.exists;
}

async function markWebhookProcessed(
  db: FirebaseFirestore.Firestore,
  webhookId: string,
  event: string,
  status: string,
  error?: string
): Promise<void> {
  await db.collection("webhook-logs").doc(webhookId).set({
    event,
    status,
    processedAt: new Date().toISOString(),
    error,
    environment: process.env.NODE_ENV,
  });
}

export async function POST(request: NextRequest) {
  let webhookId = "";
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 401 }
      );
    }

    // Validate webhook signature
    const isValid = PaystackService.validateWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const db = getAdminFirestore();

    // Generate a unique webhook ID based on event type and data
    // Paystack provides an ID in their webhook events
    webhookId = event.id || `${event.event}-${event.data?.reference}`;

    // CRITICAL: Check if this webhook has already been processed
    const alreadyProcessed = await isWebhookAlreadyProcessed(db, webhookId);
    if (alreadyProcessed) {
      console.log(
        `Webhook ${webhookId} already processed, skipping to prevent duplicates`
      );
      return NextResponse.json({
        success: true,
        message: "Webhook already processed (idempotent)",
      });
    }

    // Handle charge success - create hype message or confirm booking
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const amount = event.data.amount / 100; // Paystack returns amount in kobo

      // SECURITY: Validate amount against original payment request
      console.log(
        `[Webhook] Validating payment amount for reference: ${reference}`
      );
      const amountValidation = await validatePaymentAmount(reference, amount);

      if (!amountValidation.valid) {
        console.error(
          `[Webhook] Amount validation FAILED: expected ₦${amountValidation.expectedAmount}, received ₦${amount}`
        );
        // Reject this webhook - don't process payment
        await markWebhookProcessed(
          db,
          webhookId,
          event.event,
          "rejected",
          `Amount mismatch: expected ₦${amountValidation.expectedAmount}, received ₦${amount}`
        );
        await markPaymentRejected(
          reference,
          `Amount tampering detected: expected ₦${amountValidation.expectedAmount}, received ₦${amount}`
        );
        return NextResponse.json(
          { error: "Payment validation failed", details: "Amount mismatch" },
          { status: 400 }
        );
      }

      // SECURITY: Validate metadata hasn't been tampered with
      console.log(`[Webhook] Validating metadata for reference: ${reference}`);
      const metadataValidation = await validateWebhookMetadata(
        reference,
        metadata
      );

      if (!metadataValidation.valid) {
        console.error(
          `[Webhook] Metadata validation FAILED for reference: ${reference}`
        );
        // Reject this webhook
        await markWebhookProcessed(
          db,
          webhookId,
          event.event,
          "rejected",
          "Metadata tampering detected"
        );
        await markPaymentRejected(reference, "Metadata tampering detected");
        return NextResponse.json(
          {
            error: "Payment validation failed",
            details: "Metadata tampering detected",
          },
          { status: 400 }
        );
      }

      // Mark payment as verified in transaction log
      await markPaymentVerified(reference, event.data);

      // Handle hype message (event tips)
      if (metadata?.eventId && metadata?.userId && metadata?.message) {
        const hypeId = uuidv4();

        // Create hype message on successful payment
        await db
          .collection("events")
          .doc(metadata.eventId)
          .collection("hypes")
          .doc(hypeId)
          .set({
            messageId: hypeId,
            userId: metadata.userId,
            profileId: metadata.userId,
            eventId: metadata.eventId,
            message: metadata.message,
            amount,
            senderName: metadata.senderName || "Anonymous",
            paystackReference: reference,
            status: "confirmed",
            timestamp: new Date().toISOString(),
          });

        console.log(`Hype message created for event ${metadata.eventId}`);
      }

      // Handle booking payment
      if (metadata?.bookingId && metadata?.hypemanId) {
        const platformFee = Math.round(amount * 0.2); // 20%
        const hypemanAmount = amount - platformFee; // 80%

        // SECURITY: Check if booking is already paid (prevent double-charge)
        const alreadyPaid = await isBookingAlreadyPaid(metadata.bookingId);
        if (alreadyPaid) {
          console.error(
            `[Webhook] Booking ${metadata.bookingId} already paid, rejecting duplicate payment`
          );
          // Mark webhook as processed but don't duplicate charges
          await markWebhookProcessed(
            db,
            webhookId,
            event.event,
            "skipped",
            "Booking already paid (duplicate prevention)"
          );
          return NextResponse.json({
            success: true,
            message: "Booking already confirmed - duplicate webhook ignored",
          });
        }

        // Update booking status
        const bookingRef = db.collection("bookings").doc(metadata.bookingId);
        await bookingRef.update({
          status: "confirmed",
          paystackReference: reference,
          confirmedAt: new Date().toISOString(),
        });

        // Use transaction to update wallets atomically
        await db.runTransaction(async (transaction) => {
          // Credit hypeman's wallet
          const hypemanWalletRef = db
            .collection("wallets")
            .doc(metadata.hypemanId);
          const hypemanWalletDoc = await transaction.get(hypemanWalletRef);
          const currentBalance = hypemanWalletDoc.exists
            ? hypemanWalletDoc.data()?.balance || 0
            : 0;
          const currentEarned = hypemanWalletDoc.exists
            ? hypemanWalletDoc.data()?.totalEarned || 0
            : 0;

          transaction.set(
            hypemanWalletRef,
            {
              balance: currentBalance + hypemanAmount,
              totalEarned: currentEarned + hypemanAmount,
              lastUpdated: new Date().toISOString(),
            },
            { merge: true }
          );

          // Credit platform's wallet
          const platformWalletRef = db
            .collection("platform-earnings")
            .doc("main");
          const platformWalletDoc = await transaction.get(platformWalletRef);
          const platformBalance = platformWalletDoc.exists
            ? platformWalletDoc.data()?.bookingFees || 0
            : 0;
          const platformTotal = platformWalletDoc.exists
            ? platformWalletDoc.data()?.totalEarned || 0
            : 0;

          transaction.set(
            platformWalletRef,
            {
              bookingFees: platformBalance + platformFee,
              totalEarned: platformTotal + platformFee,
              lastUpdated: new Date().toISOString(),
            },
            { merge: true }
          );
        });

        console.log(
          `Booking ${metadata.bookingId} confirmed. Hypeman: ₦${hypemanAmount}, Platform: ₦${platformFee}`
        );
      }

      // Mark this webhook as successfully processed (idempotency)
      await markWebhookProcessed(db, webhookId, event.event, "success");

      return NextResponse.json({
        success: true,
        message: "Payment confirmed and processed",
      });
    }

    // Handle charge failure
    if (event.event === "charge.failure") {
      console.log("Payment failed:", event.data.reference);

      // Mark this webhook as processed
      await markWebhookProcessed(db, webhookId, event.event, "failure");

      return NextResponse.json({
        success: true,
        message: "Payment failure recorded",
      });
    }

    return NextResponse.json({ success: true, message: "Event processed" });
  } catch (error) {
    // Mark webhook as failed to process
    const db = getAdminFirestore();
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (webhookId) {
      await markWebhookProcessed(
        db,
        webhookId,
        "unknown",
        "error",
        errorMessage
      ).catch((e) => console.error("Failed to log webhook error:", e));
    }

    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
