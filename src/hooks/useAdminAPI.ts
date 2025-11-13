import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { refreshAdminToken } from "@/lib/admin-token";

export function useAdminAPI() {
  const router = useRouter();

  const fetchWithTokenRefresh = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let token = localStorage.getItem("admin_token");

      if (!token) {
        router.push("/dashboard/admin-login");
        throw new Error("No token found");
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      let response = await fetch(url, { ...options, headers });

      // If token expired, refresh and retry once
      if (response.status === 401) {
        token = await refreshAdminToken();
        if (!token) {
          router.push("/dashboard/admin-login");
          throw new Error("Failed to refresh token");
        }

        headers["Authorization"] = `Bearer ${token}`;
        response = await fetch(url, { ...options, headers });
      }

      return response;
    },
    [router]
  );

  return { fetchWithTokenRefresh };
}
