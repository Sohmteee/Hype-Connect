"use server";

import { createUser, createProfile, getUser, updateUser } from "@/services/firestore/users";

export async function registerAction(formData: unknown) {
  try {
    // Parse incoming data - just needs uid, email, displayName
    const data = formData as { uid: string; email: string; displayName: string };

    if (!data.uid || !data.email || !data.displayName) {
      return { success: false, error: "Missing required fields" };
    }

    // Create user document in Firestore
    await createUser(data.uid, {
      email: data.email,
      displayName: data.displayName,
      roles: ["spotlight"],
    });

    // Create default profile
    await createProfile(data.uid, {
      type: "spotlight",
      displayName: data.displayName,
      visibility: "public",
    });

    return {
      success: true,
      message: "Profile created successfully",
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
