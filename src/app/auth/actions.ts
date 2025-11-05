"use server";

import { registerSchema, loginSchema } from "@/lib/schemas";
import { createUser, createProfile, getUser } from "@/services/firestore/users";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

// Client-side Firebase Auth for registration (no Admin SDK needed)
function getClientAuth() {
  const app = initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function registerAction(formData: unknown) {
  try {
    const validatedData = registerSchema.parse(formData);

    const auth = getClientAuth();

    // Create Firebase Auth user using client SDK
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        validatedData.email,
        validatedData.password
      );
    } catch (authError: any) {
      if (authError.code === "auth/email-already-in-use") {
        return { success: false, error: "Email already registered" };
      }
      throw authError;
    }

    const user = userCredential.user;

    // Create user document in Firestore
    await createUser(user.uid, {
      email: validatedData.email,
      displayName: validatedData.displayName,
      roles: ["spotlight"],
    });

    // Create default profile
    await createProfile(user.uid, {
      type: "spotlight",
      displayName: validatedData.displayName,
      visibility: "public",
    });

    return {
      success: true,
      message: "Registration successful",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: validatedData.displayName,
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

    const user = await getUser(userId);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update roles in Firestore
    const newRoles = Array.isArray(user.roles) ? [...user.roles] : [];
    if (!newRoles.includes(role)) {
      newRoles.push(role);
    }

    // Use updateUser to persist roles to Firestore
    const { updateUser } = await import("@/services/firestore/users");
    await updateUser(userId, { roles: newRoles });

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
