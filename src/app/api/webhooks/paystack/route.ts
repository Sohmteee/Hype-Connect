import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";
import { getAdminFirestore } from "@/services/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
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

    // Handle charge success - create hype message or confirm booking
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const db = getAdminFirestore();

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
            amount: event.data.amount / 100, // Paystack returns amount in cents
            senderName: metadata.senderName || "Anonymous",
            paystackReference: reference,
            status: "confirmed",
            timestamp: new Date().toISOString(),
          });

        console.log(`Hype message created for event ${metadata.eventId}`);
      }

      // Handle booking payment
      if (metadata?.bookingId && metadata?.hypemanId) {
        const amount = event.data.amount / 100; // Convert from kobo to Naira
        const platformFee = Math.round(amount * 0.2); // 20%
        const hypemanAmount = amount - platformFee; // 80%

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

      return NextResponse.json({
        success: true,
        message: "Payment confirmed and processed",
      });
    }

    // Handle charge failure
    if (event.event === "charge.failure") {
      console.log("Payment failed:", event.data.reference);
      // No hype message created on failure
      return NextResponse.json({
        success: true,
        message: "Payment failure recorded",
      });
    }

    return NextResponse.json({ success: true, message: "Event processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
