"use server";

import { PaystackService } from "@/services/payment/paystack";
import { updateHypeStatus } from "@/services/firestore/hypes";
import { headers } from "next/headers";

export async function handlePaystackWebhook(body: string) {
  try {
    const headersList = await headers();
    const signature = headersList.get("x-paystack-signature");

    if (!signature) {
      return { success: false, error: "No signature provided" };
    }

    // Validate webhook signature
    const isValid = PaystackService.validateWebhookSignature(body, signature);
    if (!isValid) {
      return { success: false, error: "Invalid signature" };
    }

    const event = JSON.parse(body);

    // Handle different event types
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;

      // Update hype message status to confirmed
      if (metadata?.eventId && reference) {
        await updateHypeStatus(metadata.eventId, reference, "confirmed");
      }

      return { success: true, message: "Payment confirmed" };
    }

    return { success: true, message: "Event processed" };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { success: false, error: "Failed to process webhook" };
  }
}
