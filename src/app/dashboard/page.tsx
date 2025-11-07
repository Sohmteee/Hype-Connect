"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  DollarSign,
  Loader2,
  MapPin,
  PowerOff,
  Sparkles,
} from "lucide-react";

import {
  getHypemanDashboardDataAction,
  markHypeAsHypedAction,
  deactivateEventAction,
  getAiSuggestionsAction,
  validateHypemanAccessAction,
  createProfileAction,
} from "./actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { CreateEventDialog } from "@/components/dialogs/CreateEventDialog";
import Wallet from "@/components/Wallet";

interface Hype {
  id: string;
  eventId: string;
  senderName: string;
  message: string;
  amount: number;
  status: "new" | "hyped" | "confirmed" | "pending";
  timestamp: string;
  userId: string;
}

interface Event {
  id: string;
  name: string;
  location: string;
  hypemanProfileId: string;
  isActive: boolean;
  createdAt: string;
  imageUrl?: string;
}

function AiSuggestions({
  selectedHypes,
  onSuggestion,
}: {
  selectedHypes: Hype[];
  onSuggestion: () => void;
}) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await getAiSuggestionsAction(
        selectedHypes.map((h) => h.message),
        "nightclub event"
      );
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
    setIsLoading(false);
  };

  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Sparkles className="neon-glow" />
          AI Hype Suggestions
        </CardTitle>
        <CardDescription>
          Select messages to get AI-powered shoutout ideas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading || selectedHypes.length === 0}
          className="w-full glowing-accent-btn"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate for ${selectedHypes.length} message(s)`
          )}
        </Button>
        {suggestions && (
          <div className="mt-4 space-y-4 text-sm prose prose-invert prose-p:text-foreground prose-li:text-foreground">
            <h4 className="font-semibold text-base">Here are some ideas:</h4>
            {suggestions.split("\n").map((line, i) => (
              <p key={i} className="text-muted-foreground">
                {line.replace(/^\d+\.\s*/, "")}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [hypes, setHypes] = useState<Hype[]>([]);
  const [selectedHypes, setSelectedHypes] = useState<Hype[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingHyped, setIsMarkingHyped] = useState<string | null>(null);
  const [isEndingEvent, setIsEndingEvent] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleCreateHypemanProfile = async () => {
    if (!user) return;
    setIsCreatingProfile(true);
    try {
      // Create hypeman profile
      const response = await createProfileAction(user.uid, {
        type: "hypeman",
        displayName: user.displayName || "Hypeman",
        visibility: "public",
      });

      if (response.success) {
        toast({
          title: "Success!",
          description: "Hypeman profile created successfully",
        });
        // Reset access denied state
        setAccessDenied(false);
        // Reload page to fetch new data
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create profile error:", error);
      toast({
        title: "Error",
        description: "Failed to create hypeman profile",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Initial page load - validate access and fetch data
  useEffect(() => {
    // If Firebase is still loading the auth state from storage, wait
    if (loading) {
      return;
    }

    // If no user is found after loading is complete, redirect to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const initializePage = async () => {
      setIsLoading(true);
      try {
        console.log("[DashboardPage] Validating hypeman access for user:", user.uid);
        // Validate user is hypeman
        const validationResponse = await validateHypemanAccessAction(user.uid);
        console.log("[DashboardPage] Validation response:", validationResponse);

        if (!validationResponse.success) {
          console.warn("[DashboardPage] Access denied:", validationResponse.error);
          setAccessDenied(true);
          setAccessError(validationResponse.error || "Access denied");
          toast({
            title: "Access Denied",
            description: "Only hypemen can access this dashboard. Please create a hypeman profile.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Fetch dashboard data
        console.log("[DashboardPage] Fetching dashboard data");
        const response = await getHypemanDashboardDataAction(user.uid);
        console.log("[DashboardPage] Dashboard data response:", response);

        if (response.success && response.data) {
          setEvents(response.data.events || []);
          setHypes(response.data.hypes || []);
          setTotalEarnings(response.data.totalEarnings || 0);
        } else {
          console.error("[DashboardPage] Failed to load data:", response.error);
          toast({
            title: "Error",
            description: response.error || "Failed to load dashboard",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [user, loading, router, toast]);

  const handleSelectHype = (hype: Hype, isSelected: boolean) => {
    setSelectedHypes((prev) =>
      isSelected ? [...prev, hype] : prev.filter((h) => h.id !== hype.id)
    );
  };

  const handleEventCreated = (newEvent: any) => {
    setEvents((prev) => [{ ...newEvent, id: newEvent.eventId }, ...prev]);
    toast({
      title: "Event Created",
      description: `${newEvent.name} is now live!`,
    });
  };

  const handleMarkAsHyped = async (hypeId: string, eventId: string) => {
    if (!user) return;
    setIsMarkingHyped(hypeId);
    try {
      const response = await markHypeAsHypedAction(user.uid, eventId, hypeId);
      if (response.success) {
        setHypes((prev) =>
          prev.map((h) =>
            h.id === hypeId ? { ...h, status: "hyped" } : h
          )
        );
        toast({
          title: "Marked as Hyped!",
          description: "The crowd loves you!",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to mark as hyped",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Mark as hyped error:", error);
      toast({
        title: "Error",
        description: "Failed to mark as hyped",
        variant: "destructive",
      });
    } finally {
      setIsMarkingHyped(null);
    }
  };

  const handleEndEvent = async (eventId: string) => {
    if (!user) return;
    setIsEndingEvent(eventId);
    try {
      const response = await deactivateEventAction(user.uid, eventId);
      if (response.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setHypes((prev) => prev.filter((h) => h.eventId !== eventId));
        toast({
          title: "Event Ended",
          description: "The event is no longer active.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to end event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("End event error:", error);
      toast({
        title: "Error",
        description: "Failed to end event",
        variant: "destructive",
      });
    } finally {
      setIsEndingEvent(null);
    }
  };

  // Wait for Firebase to check if there's a stored session
  if (loading) {
    return (
      <>
        <Header />
        <main className="container py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <>
        <Header />
        <main className="container py-12">
          <Card className="max-w-lg mx-auto border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Only hypemen can access this dashboard. You need to create a hypeman profile first.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCreateHypemanProfile}
                  disabled={isCreatingProfile}
                  className="glowing-accent-btn"
                >
                  {isCreatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    "Create Hypeman Profile"
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // Group hypes by event
  const hypesByEvent = hypes.reduce(
    (acc, hype) => {
      if (!acc[hype.eventId]) {
        acc[hype.eventId] = [];
      }
      acc[hype.eventId].push(hype);
      return acc;
    },
    {} as Record<string, Hype[]>
  );

  return (
    <>
      <Header />
      <main className="container py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter font-headline">
            {user.displayName || "Hypeman"}'s Dashboard
          </h1>
          <div className="flex w-full sm:w-auto items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <CreateEventDialog onEventCreated={handleEventCreated} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Events Section */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold">Your Active Events</h2>
                {events.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {events.map((event) => (
                      <Card key={event.id}>
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="rounded-t-lg object-cover h-32 w-full"
                          />
                        )}
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 pt-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleEndEvent(event.id)}
                            disabled={isEndingEvent === event.id}
                          >
                            {isEndingEvent === event.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Ending...
                              </>
                            ) : (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                End Event
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center p-8">
                    <CardDescription>
                      No active events. Create one to start receiving hypes!
                    </CardDescription>
                  </Card>
                )}
              </section>

              <Separator className="my-8" />

              {/* Hypes by Event Section */}
              {events.map((event) => {
                const eventHypes = hypesByEvent[event.id] || [];
                return (
                  <section key={event.id} className="space-y-4">
                    <h2 className="text-xl sm:text-2xl font-semibold">
                      Hypes for {event.name}
                    </h2>
                    {eventHypes.length > 0 ? (
                      <div className="space-y-4">
                        {eventHypes.map((hype) => (
                          <Card
                            key={hype.id}
                            className={`transition-all ${hype.status === "hyped"
                              ? "bg-card/50 opacity-60"
                              : "bg-card"
                              }`}
                          >
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="flex items-center gap-3 text-base sm:text-xl">
                                    <Checkbox
                                      id={`select-${hype.id}`}
                                      onCheckedChange={(checked) =>
                                        handleSelectHype(hype, !!checked)
                                      }
                                      checked={selectedHypes.some(
                                        (h) => h.id === hype.id
                                      )}
                                    />
                                    {hype.senderName}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {formatDistanceToNow(
                                      new Date(hype.timestamp),
                                      { addSuffix: true }
                                    )}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    hype.status === "hyped"
                                      ? "secondary"
                                      : "default"
                                  }
                                  className="text-sm sm:text-base shrink-0"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {(hype.amount || 0).toLocaleString()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-base sm:text-lg">{hype.message}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                              {hype.status === "hyped" ? (
                                <div className="flex items-center text-muted-foreground">
                                  <CheckCheck className="mr-2 h-4 w-4 text-green-400" />
                                  Hyped!
                                </div>
                              ) : (
                                <Button
                                  onClick={() =>
                                    handleMarkAsHyped(hype.id, event.id)
                                  }
                                  disabled={isMarkingHyped === hype.id}
                                >
                                  {isMarkingHyped === hype.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark Hyped
                                    </>
                                  )}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center p-8">
                        <CardDescription>
                          No hypes yet for this event
                        </CardDescription>
                      </Card>
                    )}
                  </section>
                );
              })}

              {events.length === 0 && (
                <Card className="text-center p-12">
                  <CardDescription className="text-base">
                    Create an event to start receiving hypes!
                  </CardDescription>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <Wallet earnings={totalEarnings} />
              <AiSuggestions
                selectedHypes={selectedHypes}
                onSuggestion={() => setSelectedHypes([])}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

