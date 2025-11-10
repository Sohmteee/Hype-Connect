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
  type: "hypeman" | "spotlight";
}

export async function createUser(userId: string, userData: UserData) {
  try {
    const db = getDb();

    const user = {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      type: userData.type,
      photoURL: null,
      publicBio: "",
      visibility: "public",
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
  displayName: string;
  publicBio?: string;
  visibility: "public" | "private";
  photoURL?: string | null;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<ProfileData>
) {
  try {
    const db = getDb();

    await db
      .collection("users")
      .doc(userId)
      .update(updates as any);

    return { success: true };
  } catch (error) {
    console.error("Update user profile error:", error);
    throw new Error("Failed to update user profile");
  }
}
