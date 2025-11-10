"use client";

import React, { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Upload, Video, X, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  name: string;
  email: string;
  hypemanProfileId: string;
  occasion: string;
  videoDetails: string;
  amount: number;
  platformFee: number;
  hypemanAmount: number;
  status: "pending" | "confirmed" | "failed";
  paystackReference?: string;
  createdAt: string;
  confirmedAt?: string;
  videoUrl?: string;
}

interface BookingDetailsDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(
    booking?.videoUrl || null
  );
  const [recordingActive, setRecordingActive] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!booking) return null;

  const statusColor =
    booking.status === "confirmed"
      ? "bg-green-500/20 text-green-600"
      : booking.status === "failed"
        ? "bg-destructive/20 text-destructive"
        : "bg-amber-500/20 text-amber-600";

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingId", booking.id);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      const response = await fetch("/api/bookings/upload-video", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadedVideo(data.videoUrl);

      toast({
        title: "Success!",
        description: "Video uploaded successfully",
      });

      // Reset file input
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRecordVideo = () => {
    setRecordingActive(true);
    toast({
      title: "Coming soon",
      description:
        "Video recording feature will be available soon. For now, please use the upload option.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{booking.name}</DialogTitle>
          <DialogDescription>{booking.occasion}</DialogDescription>
          <div className="flex gap-2 mt-2">
            <Badge className={statusColor}>
              {booking.status === "confirmed"
                ? "✓ Confirmed"
                : booking.status === "failed"
                  ? "✗ Failed"
                  : "⏳ Pending"}
            </Badge>
            <Badge variant="outline">{booking.occasion}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="space-y-4 bg-muted/40 p-4 rounded-lg">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">
                Contact Information
              </h3>
              <p className="text-sm mt-1">{booking.email}</p>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">
                Video Requirements
              </h3>
              <p className="text-sm mt-1">{booking.videoDetails}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Amount
                </h3>
                <p className="text-lg font-bold text-green-400 mt-1">
                  ₦{booking.hypemanAmount.toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Requested
                </h3>
                <p className="text-sm mt-1">
                  {formatDistanceToNow(new Date(booking.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            {booking.status === "confirmed" && booking.confirmedAt && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Confirmed
                </h3>
                <p className="text-sm mt-1">
                  {formatDistanceToNow(new Date(booking.confirmedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          {booking.status === "confirmed" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Upload or Record Video</h3>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Video</TabsTrigger>
                  <TabsTrigger value="record">Record Video</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">
                      Drag and drop your video here or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      MP4, WebM, or other video formats up to 100MB
                    </p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading}
                      variant="outline"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Select Video"
                      )}
                    </Button>

                    {isUploading && uploadProgress > 0 && (
                      <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {uploadedVideo && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Video uploaded successfully!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The customer will receive the video soon
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="record" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">Record Video</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Use your camera to record a video directly
                    </p>
                    <Button
                      onClick={handleRecordVideo}
                      variant="outline"
                      disabled={recordingActive}
                    >
                      {recordingActive ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        "Start Recording"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {booking.status !== "confirmed" && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Video upload will be available once the booking is confirmed.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
