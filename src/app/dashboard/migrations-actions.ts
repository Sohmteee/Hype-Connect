"use server";

import { getAdminFirestore } from "@/services/firebase-admin";

/**
 * Backfill totalEarned from confirmed/hyped hypes for a specific hypeman
 * This ensures future earnings lookups are fast (no need to scan all events)
 */
export async function backfillEarningsAction(
  userId: string,
  profileId: string
) {
  try {
    const db = getAdminFirestore();

    // Calculate total from all confirmed/hyped hypes
    const eventsSnapshot = await db
      .collection("events")
      .where("hypemanProfileId", "==", userId)
      .get();

    let totalEarnings = 0;

    for (const event of eventsSnapshot.docs) {
      // Get confirmed hypes
      const confirmedSnapshot = await db
        .collection("events")
        .doc(event.id)
        .collection("hypes")
        .where("status", "==", "confirmed")
        .get();

      confirmedSnapshot.docs.forEach((doc: any) => {
        totalEarnings += doc.data().amount || 0;
      });

      // Get hyped hypes
      const hypedSnapshot = await db
        .collection("events")
        .doc(event.id)
        .collection("hypes")
        .where("status", "==", "hyped")
        .get();

      hypedSnapshot.docs.forEach((doc: any) => {
        totalEarnings += doc.data().amount || 0;
      });
    }

    // Update profile with calculated earnings
    await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId)
      .update({
        "stats.totalEarned": totalEarnings,
        "stats.totalWithdrawn": 0,
        "stats.lastBackfill": new Date().toISOString(),
      });

    return {
      success: true,
      data: {
        totalEarned: totalEarnings,
        message: `Backfilled ₦${totalEarnings.toLocaleString()} in earnings`,
      },
    };
  } catch (error) {
    console.error("Backfill earnings error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to backfill earnings",
    };
  }
}
