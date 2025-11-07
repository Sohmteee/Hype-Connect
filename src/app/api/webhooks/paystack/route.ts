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

    // Handle charge success - create hype message
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;

      if (metadata?.eventId && metadata?.userId && metadata?.message) {
        const db = getAdminFirestore();
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

      return NextResponse.json({
        success: true,
        message: "Payment confirmed and hype message created",
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
