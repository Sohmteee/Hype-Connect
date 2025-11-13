import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type EventStatus = "upcoming" | "live" | "ended";

/**
 * Determines the status of an event based on current time and event datetimes
 * @param startDateTime - ISO datetime string when the event starts
 * @param endDateTime - ISO datetime string when the event ends (optional)
 * @returns 'upcoming', 'live', or 'ended'
 */
export function getEventStatus(
  startDateTime: string,
  endDateTime?: string | null
): EventStatus {
  if (!startDateTime) return "upcoming";

  const now = new Date();
  const start = new Date(startDateTime);
  const end = endDateTime ? new Date(endDateTime) : null;

  if (now < start) {
    return "upcoming";
  }

  if (end && now > end) {
    return "ended";
  }

  return "live";
}

/**
 * Determines if an event is currently live
 */
export function isEventLive(
  startDateTime: string,
  endDateTime?: string | null
): boolean {
  return getEventStatus(startDateTime, endDateTime) === "live";
}

/**
 * Formats a datetime string to a readable format with date and time
 * @param dateTime - ISO datetime string
 * @returns Formatted string like "Dec 15, 2025 - 8:30 PM"
 */
export function formatEventDateTime(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTime;
  }
}

/**
 * Formats a datetime range for display
 * @param startDateTime - ISO datetime string
 * @param endDateTime - ISO datetime string (optional)
 * @returns Formatted string like "Dec 15, 2025 - 8:30 PM to 11:00 PM" or "Dec 15, 2025 - 8:30 PM to Dec 16, 2025 - 2:30 PM"
 */
export function formatEventDateTimeRange(
  startDateTime: string,
  endDateTime?: string | null
): string {
  const startFormatted = formatEventDateTime(startDateTime);
  if (!endDateTime) return startFormatted;

  try {
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Check if same day
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (isSameDay) {
      // Same day - just show end time
      const endTime = endDate.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${startFormatted} to ${endTime}`;
    } else {
      // Different days - show full date and time for end
      const endFormatted = formatEventDateTime(endDateTime);
      return `${startFormatted} to ${endFormatted}`;
    }
  } catch {
    return startFormatted;
  }
}
