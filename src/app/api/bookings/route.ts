import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/services/firebase-admin";
import { PaystackService } from "@/services/payment/paystack";
import { recordPaymentInitialized } from "@/services/firebase/payment-transactions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, hypemanId, occasion, videoDetails } = body;

    if (!email || !hypemanId || !name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Create a booking document
    const bookingAmount = 25000;
    const platformFee = Math.round(bookingAmount * 0.2); // 20%
    const hypemanAmount = bookingAmount - platformFee; // 80%

    const bookingRef = await db.collection("bookings").add({
      name,
      email,
      hypemanUserId: hypemanId,
      occasion,
      videoDetails,
      amount: bookingAmount,
      platformFee,
      hypemanAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const bookingId = bookingRef.id;

    // Initialize Paystack payment (use headers to reconstruct domain)
    const headers = request.headers;

    const paymentInit = await PaystackService.initializePayment(
      bookingAmount,
      email,
      {
        bookingId,
        hypemanId,
        name,
      },
      headers
    );

    if (!paymentInit || !paymentInit.status) {
      // Mark booking as failed
      await bookingRef.update({
        status: "failed",
        error: paymentInit?.message || "Payment init failed",
      });
      return NextResponse.json(
        { success: false, error: "Failed to initialize payment" },
        { status: 500 }
      );
    }

    // SECURITY: Record payment transaction for validation
    // This creates the source of truth for amount/metadata validation later
    await recordPaymentInitialized(
      paymentInit.data.reference,
      hypemanId, // Store the user requesting this payment
      email,
      bookingAmount,
      {
        bookingId,
        hypemanId,
        name,
      }
    );

    // Update booking with payment reference
    await bookingRef.update({
      paymentReference: paymentInit.data.reference,
      paymentUrl: paymentInit.data.authorization_url,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentInit.data.authorization_url,
        reference: paymentInit.data.reference,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
