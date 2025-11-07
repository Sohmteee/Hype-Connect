import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "No payment reference provided" },
        { status: 400 }
      );
    }

    // Verify payment using the Paystack service (server-side with secret key)
    const verification = await PaystackService.verifyPayment(reference);

    return NextResponse.json(verification);
  } catch (error) {
    console.error("Payment verification API error:", error);
    return NextResponse.json(
      {
        status: false,
        error:
          error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
