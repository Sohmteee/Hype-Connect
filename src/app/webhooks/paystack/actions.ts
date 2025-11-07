"use server";

import { PaystackService } from "@/services/payment/paystack";
import {
  updateHypeStatus,
  getHypeByReference,
} from "@/services/firestore/hypes";
import {
  addEarnings,
  updateWithdrawalStatus,
} from "@/services/firestore/earnings";
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

        // Get the hype message to extract amount and hypeman info
        const hype = await getHypeByReference(reference);
        if (hype && hype.amount && hype.hypemanProfileId) {
          // Add to hypeman's total earnings
          await addEarnings(
            hype.hypemanUserId,
            hype.hypemanProfileId,
            hype.amount
          );
          console.log(
            `[handlePaystackWebhook] Added ₦${hype.amount} earnings for ${hype.hypemanUserId}`
          );
        }
      }

      return { success: true, message: "Payment confirmed" };
    }

    // Handle transfer events
    if (event.event === "transfer.success") {
      const { reference, transfer_code, amount, metadata, recipient } =
        event.data;

      if (reference && transfer_code) {
        // Extract withdrawalId from metadata or reference
        const withdrawalId = metadata?.withdrawalId || reference;

        try {
          // Update withdrawal status to completed
          await updateWithdrawalStatus(
            withdrawalId,
            "completed",
            transfer_code
          );
          console.log(
            `[handlePaystackWebhook] Transfer completed: withdrawalId=${withdrawalId}, transferCode=${transfer_code}, amount=₦${amount}`
          );
        } catch (error) {
          console.error(
            `[handlePaystackWebhook] Failed to update withdrawal status:`,
            error
          );
        }
      }

      return { success: true, message: "Transfer confirmed" };
    }

    if (event.event === "transfer.failed") {
      const { reference, metadata } = event.data;

      if (reference) {
        const withdrawalId = metadata?.withdrawalId || reference;

        try {
          // Update withdrawal status to failed
          await updateWithdrawalStatus(withdrawalId, "failed");
          console.log(
            `[handlePaystackWebhook] Transfer failed: withdrawalId=${withdrawalId}`
          );
        } catch (error) {
          console.error(
            `[handlePaystackWebhook] Failed to update withdrawal status:`,
            error
          );
        }
      }

      return { success: true, message: "Transfer failure recorded" };
    }

    return { success: true, message: "Event processed" };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { success: false, error: "Failed to process webhook" };
  }
}
