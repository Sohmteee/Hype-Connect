import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";
import { updateHypeStatus } from "@/services/firestore/hypes";

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

    // Handle different event types
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;

      // Update hype message status to confirmed
      if (metadata?.eventId && reference) {
        await updateHypeStatus(metadata.eventId, reference, "confirmed");
      }

      return NextResponse.json({ success: true, message: "Payment confirmed" });
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
