/**
 * Get the base URL dynamically
 * - On client-side: uses window.location.origin
 * - On server-side: uses NEXT_PUBLIC_APP_URL environment variable or window.location.origin
 */
export function getBaseUrl(): string {
  // If we're in the browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: use environment variable, otherwise fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Final fallback (should rarely be used)
  return 'http://localhost:3000';
}
