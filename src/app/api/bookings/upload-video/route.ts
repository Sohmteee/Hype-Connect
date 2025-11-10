import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/services/firebase-admin";
import admin from "firebase-admin";

// Configure this to use Firebase Storage
const getAdminStorage = () => {
  try {
    return admin.storage();
  } catch (error) {
    console.error("Error getting admin storage:", error);
    throw new Error("Storage not available");
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bookingId = formData.get("bookingId") as string;

    if (!file || !bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing file or bookingId" },
        { status: 400 }
      );
    }

    // Validate file is a video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const storage = getAdminStorage();

    // Get booking to verify it exists
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `bookings/${bookingId}/video_${timestamp}`;
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Get download URL
    const [downloadUrl] = await fileRef.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    // Update booking with video URL
    await db.collection("bookings").doc(bookingId).update({
      videoUrl: downloadUrl,
      videoFileName: fileName,
      videoUploadedAt: new Date().toISOString(),
      status: "completed", // Mark as completed after video upload
    });

    return NextResponse.json({
      success: true,
      videoUrl: downloadUrl,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
