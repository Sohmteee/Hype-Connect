"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

import { getHypemanBookingsAction } from "../actions";
import { BookingDetailsDialog } from "@/components/dialogs/BookingDetailsDialog";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
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

export default function BookingsPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await getHypemanBookingsAction(user.uid);

        if (response.success && response.data) {
          setBookings(response.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load bookings",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, loading, router, toast]);

  return (
    <>
      <Header />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">All Bookings</h1>
              <p className="text-muted-foreground mt-1">
                Manage all your video bookings
              </p>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading bookings...</p>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{bookings.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Confirmed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-500">
                      {bookings.filter((b) => b.status === "confirmed").length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-500">
                      {bookings.filter((b) => b.status === "pending").length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings list */}
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`${
                      booking.status === "confirmed"
                        ? "border-green-500/50"
                        : booking.status === "failed"
                          ? "border-destructive/50"
                          : "border-amber-500/50"
                    } cursor-pointer hover:bg-accent/50 transition-colors`}
                    onClick={() => {
                      setSelectedBooking(booking);
                      setBookingDialogOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-base sm:text-lg">
                            {booking.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary/20 text-primary mr-2">
                              {booking.occasion}
                            </span>
                            {booking.email}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-400">
                            ₦{booking.hypemanAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {booking.status === "confirmed"
                              ? "✓ Confirmed"
                              : booking.status === "failed"
                                ? "✗ Failed"
                                : "⏳ Pending"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Details:</span>{" "}
                          {booking.videoDetails}
                        </p>
                        <p>
                          <span className="font-medium">Requested:</span>{" "}
                          {formatDistanceToNow(new Date(booking.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                        {booking.status === "confirmed" && booking.confirmedAt && (
                          <p>
                            <span className="font-medium">Confirmed:</span>{" "}
                            {formatDistanceToNow(new Date(booking.confirmedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="text-center p-12">
              <CardDescription className="text-base">
                No video bookings yet. Share your profile and get bookings!
              </CardDescription>
            </Card>
          )}
        </div>
      </main>

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
      />
    </>
  );
}
