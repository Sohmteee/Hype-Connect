import { getAdminFirestore, getAdminAuth } from "@/services/firebase-admin";

function getDb() {
  return getAdminFirestore();
}

function getAuthService() {
  return getAdminAuth();
}

interface UserData {
  email: string;
  displayName: string;
  roles: string[];
}

export async function createUser(userId: string, userData: UserData) {
  try {
    const db = getDb();

    const user = {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      roles: userData.roles,
      defaultProfileId: null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").doc(userId).set(user);

    return user;
  } catch (error) {
    console.error("Create user error:", error);
    throw new Error("Failed to create user");
  }
}

export async function getUser(userId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("users").doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error("Get user error:", error);
    throw new Error("Failed to get user");
  }
}

export async function updateUser(userId: string, updates: Partial<UserData>) {
  try {
    const db = getDb();

    await db.collection("users").doc(userId).update(updates);

    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    throw new Error("Failed to update user");
  }
}

interface ProfileData {
  type: "hypeman" | "spotlight";
  displayName: string;
  publicBio?: string;
  visibility: "public" | "private";
  payoutInfo?: Record<string, any>;
}

export async function createProfile(userId: string, profileData: ProfileData) {
  try {
    const db = getDb();
    const profileId = `${profileData.type}-${Date.now()}`;

    const profile = {
      profileId,
      type: profileData.type,
      displayName: profileData.displayName,
      publicBio: profileData.publicBio || "",
      visibility: profileData.visibility,
      payoutInfo: profileData.payoutInfo || {},
      stats: {
        hypesReceived: 0,
        earnings: 0,
      },
      createdAt: new Date().toISOString(),
    };

    await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId)
      .set(profile);

    // Set as default profile if first one
    const user = await getUser(userId);
    if (!user?.defaultProfileId) {
      await db
        .collection("users")
        .doc(userId)
        .update({ defaultProfileId: profileId });
    }

    return profile;
  } catch (error) {
    console.error("Create profile error:", error);
    throw new Error("Failed to create profile");
  }
}

export async function getProfile(userId: string, profileId: string) {
  try {
    const db = getDb();
    const doc = await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error("Get profile error:", error);
    throw new Error("Failed to get profile");
  }
}

export async function getUserProfiles(userId: string) {
  try {
    const db = getDb();
    console.log("[getUserProfiles] Starting query for userId:", userId);
    console.log("[getUserProfiles] Firestore instance:", db.constructor.name);
    console.log("[getUserProfiles] About to execute Firestore query...");

    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .get();

    console.log(
      "[getUserProfiles] Query successful, found",
      snapshot.docs.length,
      "profiles"
    );
    // IMPORTANT: Include the document ID (profileId) in the returned data
    return snapshot.docs.map((doc: any) => ({
      profileId: doc.id, // Add the Firestore document ID
      ...doc.data(),
    }));
  } catch (error: any) {
    console.error("[getUserProfiles] Full error object:", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      details: error?.details,
      error: String(error),
    });
    throw error;
  }
}

export async function updateProfile(
  userId: string,
  profileId: string,
  updates: Partial<ProfileData>
) {
  try {
    const db = getDb();

    await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .doc(profileId)
      .update(updates);

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    throw new Error("Failed to update profile");
  }
}
