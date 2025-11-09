"use server";

import { headers } from "next/headers";
import { generateHypemanContentSuggestions } from "@/ai/flows/hypeman-content-suggestions";
import {
  createEventSchema,
  updateProfileSchema,
  createHypeMessageSchema,
  withdrawalSchema,
  createProfileSchema,
} from "@/lib/schemas";
import {
  createEvent,
  getEvent,
  getActiveEvents,
  updateEvent,
  deactivateEvent,
} from "@/services/firestore/events";
import {
  createProfile,
  getProfile,
  getUserProfiles,
  updateProfile,
} from "@/services/firestore/users";
import {
  createHypeMessage,
  getHypeMessages,
  updateHypeStatus,
  getLeaderboard,
} from "@/services/firestore/hypes";
import {
  getEarnings,
  createWithdrawal,
  getWithdrawalHistory,
  updateWithdrawalStatus,
  getWithdrawal,
} from "@/services/firestore/earnings";
import { PaystackService } from "@/services/payment/paystack";
import { getAdminFirestore } from "@/services/firebase-admin";

// ==================== Auth/Validation Actions ====================

export async function validateHypemanAccessAction(userId: string) {
  try {
    // Check if user has a hypeman profile
    const profiles = await getUserProfiles(userId);
    console.log(
      `[validateHypemanAccessAction] userId: ${userId}, profiles:`,
      profiles
    );

    const isHypeman =
      profiles &&
      Array.isArray(profiles) &&
      profiles.some((p: any) => p.type === "hypeman");

    if (!isHypeman) {
      return {
        success: false,
        error: "Only hypemen can access this dashboard",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Validate hypeman error:", error);
    return { success: false, error: "Failed to validate access" };
  }
}

// ==================== AI Actions ====================

export async function getAiSuggestionsAction(
  messages: string[],
  currentActivity: string
) {
  if (messages.length === 0) {
    return { success: false, error: "No messages selected." };
  }

  try {
    const response = await generateHypemanContentSuggestions({
      messages: messages.join("\n- "),
      currentActivity: currentActivity,
    });
    return { success: true, suggestions: response.suggestions };
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return {
      success: false,
      error: "Failed to generate suggestions. Please try again.",
    };
  }
}

// ==================== Event Actions ====================

export async function createEventAction(userId: string, formData: unknown) {
  try {
    const validatedData = createEventSchema.parse(formData);

    // Fetch the hypeman's profile to get their name
    const profiles = await getUserProfiles(userId);
    const hypemanProfile = profiles?.[0]; // Get the first profile (usually the hypeman profile)
    const hypemanName = hypemanProfile?.name || "Hypeman";

    const eventData = {
      ...validatedData,
      hypemanProfileId: userId,
      hypemanName: hypemanName,
    };
    const event = await createEvent(userId, eventData);
    return { success: true, data: event };
  } catch (error) {
    console.error("Create event error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create event" };
  }
}

export async function getEventsAction(limit: number = 20, offset: number = 0) {
  try {
    console.log(
      "[getEventsAction] Fetching active events, limit:",
      limit,
      "offset:",
      offset
    );
    const events = await getActiveEvents(limit, offset);
    console.log("[getEventsAction] Found events:", events.length, "events");
    if (events.length > 0) {
      console.log("[getEventsAction] First event:", events[0]);
    }
    return { success: true, data: events };
  } catch (error) {
    console.error("Get events error:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function getEventAction(eventId: string) {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }
    return { success: true, data: event };
  } catch (error) {
    console.error("Get event error:", error);
    return { success: false, error: "Failed to fetch event" };
  }
}

export async function updateEventAction(
  userId: string,
  eventId: string,
  formData: unknown
) {
  try {
    const updates = formData as Record<string, any>;
    const event = await updateEvent(eventId, userId, updates);
    return { success: true, data: event };
  } catch (error) {
    console.error("Update event error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update event" };
  }
}

export async function deactivateEventAction(userId: string, eventId: string) {
  try {
    const event = await deactivateEvent(eventId, userId);
    return { success: true, data: event };
  } catch (error) {
    console.error("Deactivate event error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to deactivate event" };
  }
}

// ==================== Profile Actions ====================

export async function createProfileAction(userId: string, formData: unknown) {
  try {
    const validatedData = createProfileSchema.parse(formData);
    const profile = await createProfile(userId, validatedData);
    return { success: true, data: profile };
  } catch (error) {
    console.error("Create profile error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create profile" };
  }
}

export async function getProfilesAction(userId: string) {
  try {
    const profiles = await getUserProfiles(userId);
    return { success: true, data: profiles };
  } catch (error) {
    console.error("Get profiles error:", error);
    return { success: false, error: "Failed to fetch profiles" };
  }
}

export async function getProfileAction(userId: string, profileId: string) {
  try {
    const profile = await getProfile(userId, profileId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }
    return { success: true, data: profile };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateProfileAction(
  userId: string,
  profileId: string,
  formData: unknown
) {
  try {
    const validatedData = updateProfileSchema.parse(formData);
    await updateProfile(userId, profileId, validatedData as any);
    return { success: true, message: "Profile updated" };
  } catch (error) {
    console.error("Update profile error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update profile" };
  }
}

// ==================== Hype Message Actions ====================

export async function submitHypeAction(
  userId: string,
  eventId: string,
  formData: unknown
) {
  try {
    const validatedData = createHypeMessageSchema.parse(formData);

    // Initialize Paystack payment
    const email = formData instanceof Object ? (formData as any).email : "";
    if (!email) {
      return { success: false, error: "Email is required for payment" };
    }

    // Get request headers for URL reconstruction
    const requestHeaders = headers();

    const paymentInit = await PaystackService.initializePayment(
      validatedData.amount,
      email,
      {
        eventId,
        userId,
        message: validatedData.message,
        senderName: validatedData.senderName,
      },
      requestHeaders
    );

    if (!paymentInit.status) {
      return { success: false, error: "Failed to initialize payment" };
    }

    // Return payment URL - client will create the hype message after payment confirmation
    return {
      success: true,
      data: {
        paymentUrl: paymentInit.data.authorization_url,
        reference: paymentInit.data.reference,
      },
    };
  } catch (error) {
    console.error("Submit hype error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to submit hype" };
  }
}

export async function submitHypeConfirmedAction(
  userId: string,
  eventId: string,
  hypeData: any
) {
  try {
    // Create the hype message with confirmed status
    const hypeMessage = await createHypeMessage(
      eventId,
      {
        userId,
        profileId: hypeData.profileId || userId,
        message: hypeData.message,
        amount: hypeData.amount,
        senderName: hypeData.senderName,
      },
      hypeData.paystackReference
    );

    // Update status to confirmed since payment was successful
    const db = getAdminFirestore();
    await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .doc(hypeMessage.messageId)
      .update({ status: "confirmed" });

    console.log(
      "[submitHypeConfirmedAction] Created confirmed hype:",
      hypeMessage.messageId
    );

    return { success: true, data: hypeMessage };
  } catch (error) {
    console.error("Submit confirmed hype error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create hype" };
  }
}

export async function getHypesAction(
  eventId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const hypes = await getHypeMessages(eventId, limit, offset);
    return { success: true, data: hypes };
  } catch (error) {
    console.error("Get hypes error:", error);
    return { success: false, error: "Failed to fetch hypes" };
  }
}

export async function markHypeAsHypedAction(
  userId: string,
  eventId: string,
  hypeId: string
) {
  try {
    // Verify user owns the event before allowing status update
    const event = await getEvent(eventId);
    if (!event || event.hypemanProfileId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await updateHypeStatus(eventId, hypeId, "hyped");
    return { success: true, message: "Hype marked as hyped" };
  } catch (error) {
    console.error("Mark hype error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update hype" };
  }
}

export async function getLeaderboardAction(
  eventId: string,
  limit: number = 20
) {
  try {
    const leaderboard = await getLeaderboard(eventId, limit);
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

// ==================== Earnings & Withdrawal Actions ====================

export async function getEarningsAction(userId: string, profileId: string) {
  try {
    // Get earnings from the profile document (permanent record + withdrawable balance)
    const earnings = await getEarnings(userId, profileId);
    return { success: true, data: earnings };
  } catch (error) {
    console.error("Get earnings error:", error);
    return { success: false, error: "Failed to fetch earnings" };
  }
}

export async function requestWithdrawalAction(
  userId: string,
  profileId: string,
  formData: unknown
) {
  try {
    const validatedData = withdrawalSchema.parse(formData);
    const withdrawal = await createWithdrawal(userId, profileId, validatedData);
    return { success: true, data: withdrawal };
  } catch (error) {
    console.error("Request withdrawal error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to request withdrawal" };
  }
}

export async function getWithdrawalHistoryAction(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const history = await getWithdrawalHistory(userId, limit, offset);
    return { success: true, data: history };
  } catch (error) {
    console.error("Get withdrawal history error:", error);
    return { success: false, error: "Failed to fetch withdrawal history" };
  }
}

export async function processWithdrawalAction(withdrawalId: string) {
  try {
    // Get the withdrawal details
    const withdrawal = await getWithdrawal(withdrawalId);
    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    const {
      userId,
      profileId,
      userReceivesAmount,
      accountNumber,
      accountName,
      bankCode,
    } = withdrawal;

    // Step 1: Create transfer recipient
    console.log(
      `[processWithdrawalAction] Creating transfer recipient for ${accountName}`
    );
    const recipientResponse = await PaystackService.createTransferRecipient(
      "nuban",
      accountNumber,
      bankCode,
      accountName
    );

    if (!recipientResponse.status) {
      throw new Error(
        recipientResponse.message || "Failed to create recipient"
      );
    }

    const recipientCode = recipientResponse.data.recipient_code;
    console.log(
      `[processWithdrawalAction] Recipient created: ${recipientCode}`
    );

    // Step 2: Update withdrawal status to processing
    await updateWithdrawalStatus(withdrawalId, "processing");

    // Step 3: Initiate the transfer
    console.log(
      `[processWithdrawalAction] Initiating transfer for ₦${userReceivesAmount} to ${recipientCode}`
    );
    const transferResponse = await PaystackService.initiateTransfer(
      "balance",
      recipientCode,
      userReceivesAmount,
      withdrawalId,
      `Withdrawal for ${accountName}`
    );

    if (!transferResponse.status) {
      throw new Error(
        transferResponse.message || "Failed to initiate transfer"
      );
    }

    const transferCode = transferResponse.data.transfer_code;
    console.log(
      `[processWithdrawalAction] Transfer initiated: ${transferCode}`
    );

    // Step 4: Update withdrawal with transfer code
    await updateWithdrawalStatus(withdrawalId, "processing", transferCode);

    return {
      success: true,
      data: {
        withdrawalId,
        transferCode,
        status: "processing",
        message: "Transfer initiated successfully",
      },
    };
  } catch (error) {
    console.error("Process withdrawal error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to process withdrawal" };
  }
}

// ==================== Dashboard Data Actions ====================

export async function getHypemanDashboardDataAction(userId: string) {
  try {
    // First, get the user's hypeman profile ID
    const profiles = await getUserProfiles(userId);
    const hypemanProfile = profiles?.find((p: any) => p.type === "hypeman");

    if (!hypemanProfile) {
      return {
        success: false,
        error: "No hypeman profile found for this user",
      };
    }

    console.log(
      `[getHypemanDashboardDataAction] userId: ${userId}, profileId: ${hypemanProfile.profileId}`
    );

    // Get all events for this hypeman user (including ended/inactive events for earnings calculation)
    const db = getAdminFirestore();
    const allEventsSnapshot = await db
      .collection("events")
      .where("hypemanProfileId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    // Separate active and ended events
    const events = allEventsSnapshot.docs
      .filter((doc: any) => doc.data().isActive === true)
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

    console.log(
      `[getHypemanDashboardDataAction] Found ${events.length} active events and ${allEventsSnapshot.docs.length} total events`
    );

    // Get all hypes for ALL user's events (both active and ended - for earnings calculation)
    const allHypes: any[] = [];
    for (const eventDoc of allEventsSnapshot.docs) {
      const event = eventDoc.data();
      // Get confirmed hypes
      const confirmedSnapshot = await db
        .collection("events")
        .doc(eventDoc.id)
        .collection("hypes")
        .where("status", "==", "confirmed")
        .orderBy("timestamp", "desc")
        .get();

      const confirmedHypes = confirmedSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        eventId: eventDoc.id,
        ...doc.data(),
      }));

      // Get hyped hypes (marked as acknowledged by hypeman)
      const hypedSnapshot = await db
        .collection("events")
        .doc(eventDoc.id)
        .collection("hypes")
        .where("status", "==", "hyped")
        .orderBy("timestamp", "desc")
        .get();

      const hypedHypes = hypedSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        eventId: eventDoc.id,
        ...doc.data(),
      }));

      allHypes.push(...confirmedHypes, ...hypedHypes);
    }

    console.log(
      `[getHypemanDashboardDataAction] Found ${allHypes.length} hypes total (from all events)`
    );

    // Calculate total earnings from confirmed and hyped hypes across ALL events
    const totalEarnings = allHypes.reduce(
      (sum, hype) => sum + (hype.amount || 0),
      0
    );

    console.log(
      `[getHypemanDashboardDataAction] Total earnings calculated: ₦${totalEarnings}`
    );

    return {
      success: true,
      data: {
        events, // Only active events for display
        hypes: allHypes, // All hypes for display (from all events)
        totalEarnings, // Calculated from all events (active + ended)
      },
    };
  } catch (error) {
    console.error("Get dashboard data error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

export async function getHypesForEventAction(eventId: string) {
  try {
    const db = getAdminFirestore();
    const hypesSnapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("hypes")
      .orderBy("timestamp", "desc")
      .get();

    const hypes = hypesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: hypes };
  } catch (error) {
    console.error("Get event hypes error:", error);
    return { success: false, error: "Failed to fetch hypes" };
  }
}

// ==================== Spotlight User Actions ====================

export async function getSpotlightUserDataAction(userId: string) {
  try {
    // Get user profiles
    const profiles = await getUserProfiles(userId);

    if (!profiles || profiles.length === 0) {
      return { success: false, error: "No profiles found" };
    }

    // Find spotlight profile
    const spotlightProfile = profiles.find((p: any) => p.type === "spotlight");
    if (!spotlightProfile) {
      return { success: false, error: "No spotlight profile" };
    }

    // Get hype history using Admin Firestore
    const db = getAdminFirestore();
    const hypesSnapshot = await db
      .collectionGroup("hypes")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    // Map raw hype docs into objects; preserve eventId and any provided eventName
    const rawHypes = hypesSnapshot.docs.map((doc: any) => {
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

    // If some hypes are missing an eventName but have an eventId, fetch those event names in batch
    const missingEventIds = Array.from(
      new Set(
        rawHypes
          .filter((h) => (!h.eventName || h.eventName === "Event") && h.eventId)
          .map((h) => h.eventId)
      )
    );

    const eventNamesMap: Record<string, string> = {};
    if (missingEventIds.length > 0) {
      const eventDocs = await Promise.all(
        missingEventIds.map(async (eid) => {
          try {
            const doc = await db.collection("events").doc(eid).get();
            return {
              id: eid,
              name: doc.exists
                ? doc.data()?.title || doc.data()?.name || null
                : null,
            };
          } catch (err) {
            console.debug(
              `[getSpotlightUserDataAction] failed to fetch event ${eid}:`,
              err
            );
            return { id: eid, name: null };
          }
        })
      );

      eventDocs.forEach((e) => {
        if (e.name) eventNamesMap[e.id] = e.name;
      });
    }

    // Final hypes array: prefer explicit eventName, else use looked-up name, else fallback to 'Event'
    const hypes = rawHypes.map((h) => ({
      ...h,
      eventName: h.eventName || eventNamesMap[h.eventId] || "Event",
    }));

    // Also compute events where this spotlight user has been a top supporter (i.e. they sent hypes)
    // We don't store sender userId currently, so we attempt to match by senderName using a few likely candidate names.
    const candidateNames = [
      spotlightProfile.displayName,
      // fallback to profileId so if senderName was stored as profile id we match it
      spotlightProfile.profileId,
    ].filter(Boolean) as string[];

    const topSupportedEvents: Array<{
      eventId: string;
      eventName: string | null;
      totalGiven: number;
      count: number;
    }> = [];

    try {
      if (candidateNames.length > 0) {
        // collectionGroup queries can require special indexes (and may fail in some environments).
        // To avoid that, iterate events and query each event's hypes subcollection using an 'in' filter
        // for senderName (candidateNames). This reduces the need for collectionGroup indexes.
        const allEventsSnapshot = await db.collection("events").get();
        const totalsByEvent: Record<string, { total: number; count: number }> =
          {};

        for (const eventDoc of allEventsSnapshot.docs) {
          const eid = eventDoc.id;
          try {
            // Use 'in' operator to match any candidate sender names (Firestore limits 'in' to 10 values)
            const hypesQuery = db
              .collection("events")
              .doc(eid)
              .collection("hypes")
              .where("senderName", "in", candidateNames);

            const hypesSnap = await hypesQuery.get();
            if (hypesSnap.empty) continue;

            hypesSnap.docs.forEach((doc: any) => {
              const data = doc.data();
              if (!totalsByEvent[eid])
                totalsByEvent[eid] = { total: 0, count: 0 };
              totalsByEvent[eid].total += data.amount || 0;
              totalsByEvent[eid].count += 1;
            });
          } catch (err) {
            // Ignore per-event query failures and continue
            console.debug(
              `[getSpotlightUserDataAction] per-event hypes query failed for ${eid}:`,
              err
            );
            continue;
          }
        }

        let supportedEventIds = Object.keys(totalsByEvent);
        const supportedEventNamesMap: Record<string, string | null> = {};
        if (supportedEventIds.length > 0) {
          const fetched = await Promise.all(
            supportedEventIds.map(async (eid) => {
              try {
                const doc = await db.collection("events").doc(eid).get();
                return {
                  id: eid,
                  name: doc.exists
                    ? doc.data()?.title || doc.data()?.name || null
                    : null,
                };
              } catch (err) {
                console.debug(
                  `[getSpotlightUserDataAction] failed to fetch supported event ${eid}:`,
                  err
                );
                return { id: eid, name: null };
              }
            })
          );

          fetched.forEach((e) => {
            supportedEventNamesMap[e.id] = e.name;
          });
        }

        // If we found nothing with the 'in' query, try a safer (but heavier) substring match fallback
        if (supportedEventIds.length === 0 && spotlightProfile.displayName) {
          try {
            const displayLower = String(
              spotlightProfile.displayName
            ).toLowerCase();
            for (const eventDoc of allEventsSnapshot.docs) {
              const eid = eventDoc.id;
              try {
                const allHypesSnap = await db
                  .collection("events")
                  .doc(eid)
                  .collection("hypes")
                  .orderBy("timestamp", "desc")
                  .limit(200)
                  .get();

                allHypesSnap.docs.forEach((doc: any) => {
                  const data = doc.data();
                  const sender = String(data.senderName || "").toLowerCase();
                  if (!sender) return;
                  if (sender.includes(displayLower)) {
                    if (!totalsByEvent[eid])
                      totalsByEvent[eid] = { total: 0, count: 0 };
                    totalsByEvent[eid].total += data.amount || 0;
                    totalsByEvent[eid].count += 1;
                  }
                });
              } catch (err) {
                continue;
              }
            }
          } catch (err) {
            console.debug("fallback substring scanning failed:", err);
          }
        }

        supportedEventIds = Object.keys(totalsByEvent);

        for (const eid of supportedEventIds) {
          topSupportedEvents.push({
            eventId: eid,
            eventName: supportedEventNamesMap[eid] || "Event",
            totalGiven: totalsByEvent[eid].total,
            count: totalsByEvent[eid].count,
          });
        }

        // sort desc by totalGiven
        topSupportedEvents.sort((a, b) => b.totalGiven - a.totalGiven);
      }
    } catch (err) {
      console.error("Error computing supported events:", err);
    }

    return {
      success: true,
      data: {
        profile: spotlightProfile,
        hypes: hypes,
        topSupportedEvents,
      },
    };
  } catch (error) {
    console.error("Get spotlight user data error:", error);
    return { success: false, error: "Failed to load user data" };
  }
}
