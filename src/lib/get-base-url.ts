/**
 * Get the base URL dynamically
 * - On client-side: uses window.location.origin
 * - On server-side: tries to reconstruct from headers or uses env variable
 */
export function getBaseUrl(headers?: any): string {
  // If we're in the browser, use window.location.origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side: try to get from headers first
  if (headers) {
    const forwardedProto =
      headers.get?.("x-forwarded-proto") ||
      headers["x-forwarded-proto"] ||
      "https";
    const forwardedHost =
      headers.get?.("x-forwarded-host") || headers["x-forwarded-host"];
    const host = headers.get?.("host") || headers["host"];

    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    if (host) {
      return `${forwardedProto}://${host}`;
    }
  }

  // Server-side: use environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Final fallback
  return "http://localhost:3000";
}
