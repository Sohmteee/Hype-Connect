"use server";

import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { registerSchema, loginSchema } from "@/lib/schemas";
import { createUser, createProfile, getUser } from "@/services/firestore/users";

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

export async function registerAction(formData: unknown) {
  try {
    const validatedData = registerSchema.parse(formData);

    const auth = getAuthService();

    // Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: validatedData.email,
        password: validatedData.password,
        displayName: validatedData.displayName,
      });
    } catch (authError: any) {
      if (authError.code === "auth/email-already-exists") {
        return { success: false, error: "Email already registered" };
      }
      throw authError;
    }

    // Create user document in Firestore
    await createUser(userRecord.uid, {
      email: validatedData.email,
      displayName: validatedData.displayName,
      roles: ["spotlight"],
    });

    // Create default profile
    await createProfile(userRecord.uid, {
      type: "spotlight",
      displayName: validatedData.displayName,
      visibility: "public",
    });

    return {
      success: true,
      message: "Registration successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Registration failed" };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: "hypeman" | "spotlight"
) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const auth = getAuthService();
    const user = await getUser(userId);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update roles
    const newRoles = Array.isArray(user.roles) ? [...user.roles] : [];
    if (!newRoles.includes(role)) {
      newRoles.push(role);
    }

    // Set custom claims for Firebase Auth
    await auth.setCustomUserClaims(userId, { role });

    // Update Firestore
    const db = (await import("firebase-admin/firestore")).getFirestore();
    await db.collection("users").doc(userId).update({ roles: newRoles });

    return {
      success: true,
      message: `User role updated to ${role}`,
    };
  } catch (error) {
    console.error("Update user role error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update user role" };
  }
}
