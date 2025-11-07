import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";

export async function GET(request: NextRequest) {
  try {
    const banks = await PaystackService.getBanks();

    return NextResponse.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    console.error("Get banks error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get banks";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
