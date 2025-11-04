import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getDb() {
  if (getApps().length === 0) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    initializeApp({
      credential: cert(serviceAccount as any),
    });
  }

  return getFirestore();
}

function getAuthService() {
  if (getApps().length === 0) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    initializeApp({
      credential: cert(serviceAccount as any),
    });
  }

  return getAuth();
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
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("profiles")
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  } catch (error) {
    console.error("Get user profiles error:", error);
    throw new Error("Failed to get user profiles");
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
