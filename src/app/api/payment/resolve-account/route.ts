import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/services/payment/paystack";

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { success: false, error: "Account number and bank code are required" },
        { status: 400 }
      );
    }

    const result = await PaystackService.resolveAccount(
      accountNumber,
      bankCode
    );

    if (result.status) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Failed to resolve account",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Resolve account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to resolve account";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
