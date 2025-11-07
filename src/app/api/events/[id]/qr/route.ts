import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const eventUrl = `${appUrl}/event/${eventId}`;

    // Using external QRServer API instead
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      eventUrl
    )}`;

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeUrl,
        eventUrl,
      },
    });
  } catch (error) {
    console.error("Generate QR code error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
