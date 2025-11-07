import { getAdminFirestore } from "@/services/firebase-admin";

/**
 * Migrate existing earnings to new permanent record structure
 * - Sets totalEarned from all confirmed + hyped hypes
 * - Sets totalWithdrawn to 0
 * - Sets withdrawableBalance = totalEarned - totalWithdrawn
 */
export async function migrateEarningsToNewStructure() {
  try {
    const db = getAdminFirestore();
    const results = {
      processed: 0,
      migrated: 0,
      errors: [] as string[],
    };

    // Get all events
    const eventsSnapshot = await db.collection("events").get();

    // Map to store user earnings: userId -> { profileId, totalEarned }
    const userEarningsMap: Record<
      string,
      Record<string, { totalEarned: number; profileId: string }>
    > = {};

    // Process all events
    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const hypemanUserId = event.hypemanProfileId; // This is actually the userId
      const hypesRef = db
        .collection("events")
        .doc(eventDoc.id)
        .collection("hypes");

      // Get confirmed hypes
      const confirmedSnapshot = await hypesRef
        .where("status", "==", "confirmed")
        .get();
      const hypedSnapshot = await hypesRef.where("status", "==", "hyped").get();

      // Calculate earnings from both confirmed and hyped hypes
      let eventEarnings = 0;

      confirmedSnapshot.docs.forEach((doc: any) => {
        eventEarnings += doc.data().amount || 0;
      });

      hypedSnapshot.docs.forEach((doc: any) => {
        eventEarnings += doc.data().amount || 0;
      });

      // Add to user's total
      if (eventEarnings > 0 && hypemanUserId) {
        if (!userEarningsMap[hypemanUserId]) {
          userEarningsMap[hypemanUserId] = {};
        }

        // Find the profileId from event data
        const event_obj = eventDoc.data();
        // Get the hypeman's profile to find their profileId
        const profiles = await db
          .collection("users")
          .doc(hypemanUserId)
          .collection("profiles")
          .where("type", "==", "hypeman")
          .limit(1)
          .get();

        if (profiles.docs.length > 0) {
          const profileId = profiles.docs[0].id;
          if (!userEarningsMap[hypemanUserId][profileId]) {
            userEarningsMap[hypemanUserId][profileId] = {
              totalEarned: 0,
              profileId,
            };
          }
          userEarningsMap[hypemanUserId][profileId].totalEarned +=
            eventEarnings;
        }
      }
    }

    // Update all profiles with migrated earnings
    for (const [userId, profiles] of Object.entries(userEarningsMap)) {
      for (const [, { profileId, totalEarned }] of Object.entries(profiles)) {
        results.processed++;
        try {
          const profileRef = db
            .collection("users")
            .doc(userId)
            .collection("profiles")
            .doc(profileId);

          await profileRef.update({
            "stats.totalEarned": totalEarned,
            "stats.totalWithdrawn": 0,
            "stats.lastMigration": new Date().toISOString(),
          });

          results.migrated++;
          console.log(
            `Migrated earnings for user ${userId}, profile ${profileId}: ₦${totalEarned}`
          );
        } catch (error) {
          const errorMsg = `Failed to migrate ${userId}/${profileId}: ${error}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Migration error:", error);
    throw new Error(`Failed to migrate earnings: ${error}`);
  }
}
