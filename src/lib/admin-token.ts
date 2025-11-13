import { getAuth } from "firebase/auth";
import { app } from "@/firebase";

export async function refreshAdminToken(): Promise<string | null> {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    // Force refresh the token
    const token = await user.getIdToken(true);
    localStorage.setItem("admin_token", token);
    return token;
  } catch (error) {
    console.error("Failed to refresh admin token:", error);
    return null;
  }
}

export async function getValidAdminToken(): Promise<string | null> {
  let token = localStorage.getItem("admin_token");

  if (!token) {
    return null;
  }

  try {
    // Try to use the token first
    const response = await fetch("/api/internal/dashboard/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // If token expired, refresh it
    if (response.status === 401) {
      token = await refreshAdminToken();
    }

    return token;
  } catch (error) {
    console.error("Error validating token:", error);
    return null;
  }
}
