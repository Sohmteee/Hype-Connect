"use server";

import { createUser, getUser, updateUser } from "@/services/firestore/users";

export async function registerAction(formData: unknown) {
  try {
    // Parse incoming data - includes role for determining user type
    const data = formData as {
      uid: string;
      email: string;
      displayName: string;
      role: "hypeman" | "spotlight";
    };

    if (!data.uid || !data.email || !data.displayName || !data.role) {
      return { success: false, error: "Missing required fields" };
    }

    // Create user document in Firestore with type (immutable after signup)
    await createUser(data.uid, {
      email: data.email,
      displayName: data.displayName,
      type: data.role,
    });

    return {
      success: true,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Registration failed" };
  }
}
