"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/firebase";
import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Loader2, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { getSpotlightUserDataAction } from "@/app/dashboard/actions";
import { formatDistanceToNow } from "date-fns";
import { collectionGroup, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

interface Hype {
  id: string;
  message: string;
  amount: number;
  eventId: string;
  eventName: string;
  hypeman: string;
  timestamp: string;
  status: "confirmed" | "pending" | "hyped";
}

interface Profile {
  displayName: string;
  publicBio: string;
  visibility: "public" | "private";
  type: string;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [hypeHistory, setHypeHistory] = useState<Hype[]>([]);
  const [topSupportedEvents, setTopSupportedEvents] = useState<
    Array<{ eventId: string; eventName: string | null; totalGiven: number; count: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile and hype history
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check for booking success
    if (searchParams.get("booking") === "success") {
      toast({
        title: "Booking Confirmed!",
        description: "Your video booking has been confirmed. The hypeman will send your video soon!",
      });
    }

    const loadUserData = async () => {
      try {
        console.log("[UserDashboard] Loading spotlight user data for:", user.uid);
        // Get spotlight user data if user is a spotlight user
        const response = await getSpotlightUserDataAction(user.uid);

        console.log("[UserDashboard] Response:", response);

        if (!response.success) {
          console.log("[UserDashboard] Not a spotlight user, redirecting to hypeman dashboard");
          // If not a spotlight user, redirect to hypeman dashboard
          toast({
            title: "Access Denied",
            description: "This page is for spotlight users only.",
            variant: "destructive",
          });
          setIsLoading(false);
          router.push("/dashboard");
          return;
        }

        if (response.data) {
          console.log("[UserDashboard] Setting profile data:", response.data);
          setProfile(response.data.profile);
          setHypeHistory(response.data.hypes || []);
          setTopSupportedEvents(response.data.topSupportedEvents || []);
          setIsLoading(false);
        } else {
          console.log("[UserDashboard] No data returned");
          toast({
            title: "No Data",
            description: "Could not load your profile data.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[UserDashboard] Load user data error:", error);
        toast({
          title: "Error",
          description: "Failed to load data: " + (error instanceof Error ? error.message : String(error)),
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, router, toast, searchParams]);

  // Set up real-time listener for hype updates
  useEffect(() => {
    if (!user || !profile || profile.type !== "spotlight") {
      return;
    }

    try {
      const q = query(
        collectionGroup(firestore, "hypes"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const updatedHypes = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: data.messageId || doc.id,
              message: data.message,
              amount: data.amount,
              eventId: data.eventId,
              eventName: data.eventName || null,
              hypeman: data.senderName || "Anonymous",
              timestamp: data.timestamp,
              status: data.status,
            };
          });

          setHypeHistory(updatedHypes);
        },
        (error) => {
          console.error("[UserDashboard] Real-time listener error:", error);
          // Don't show toast for permission errors, just log
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("[UserDashboard] Failed to set up real-time listener:", error);
    }
  }, [user, profile]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="container py-12">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          </div>

          <Card className="text-center p-12">
            <CardDescription>
              You don't have a Spotlight profile yet. Spotlight profiles are for receiving hypes and tips.
              {' '}
              <Link href="/dashboard" className="text-primary hover:underline">
                Go to your dashboard
              </Link>
              {' '}
              to manage your Hypeman account and events.
            </CardDescription>
          </Card>
        </main>
      </>
    );
  }

  const totalHyped = hypeHistory.filter((h) => h.status === "confirmed" || h.status === "hyped").length;
  const totalEarned = hypeHistory
    .filter((h) => h.status === "confirmed" || h.status === "hyped")
    .reduce((sum, h) => sum + h.amount, 0);

  // For spotlight users we show totals for how much they HAVE GIVEN (supported)
  const totalGiven = topSupportedEvents.reduce((sum, e) => sum + (e.totalGiven || 0), 0);
  const totalSentCount = topSupportedEvents.reduce((sum, e) => sum + (e.count || 0), 0);

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Profile Header */}
        <Card className="mb-6 glow-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {profile.displayName}
                </CardTitle>
                <CardDescription className="mt-2">
                  {profile.publicBio || "Spotlight Member"}
                </CardDescription>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary">
                {profile.visibility === "public" ? "🌐 Public" : "🔒 Private"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {profile.type === "spotlight" ? (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{totalSentCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Hypes Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">₦{totalGiven.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Given</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{hypeHistory.length + totalSentCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Messages</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{totalHyped}</p>
                    <p className="text-xs text-muted-foreground mt-1">Hypes Received</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">₦{totalEarned.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{hypeHistory.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Messages</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hype History */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Hype History</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {hypeHistory.length > 0 ? (
              hypeHistory.map((hype) => (
                <Card key={hype.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{hype.message}</CardTitle>
                        {/* Sender is not shown per request */}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400">
                          ₦{hype.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hype.status === "hyped" ? "✓✓ Hyped" : hype.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {hype.eventName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(hype.timestamp), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center p-12">
                <CardDescription>
                  <Heart className="h-8 w-8 mx-auto mb-4 text-muted-foreground/50" />
                  No hypes yet. Share your profile and get hypes from supporters!
                </CardDescription>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Hypes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{hypeHistory.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalHyped} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Given</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400">
                    ₦{totalEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    From confirmed hypes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average Hype</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ₦{totalHyped > 0 ? Math.round(totalEarned / totalHyped).toLocaleString() : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Per hype received
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {profile.visibility === "public" ? "🌐" : "🔒"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {profile.visibility === "public" ? "Discoverable" : "Private"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Supporters */}
            {hypeHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Supported Events</CardTitle>
                  <CardDescription>
                    Events you supported the most (total given)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topSupportedEvents.length > 0 ? (
                      topSupportedEvents.slice(0, 5).map((evt, idx) => (
                        <div
                          key={evt.eventId}
                          className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="font-semibold">
                              {idx + 1}. {evt.eventName || evt.eventId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {evt.count} support{evt.count > 1 ? "s" : ""}
                            </p>
                          </div>
                          <p className="font-bold text-green-400">
                            ₦{evt.totalGiven.toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">You haven't supported any events yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
