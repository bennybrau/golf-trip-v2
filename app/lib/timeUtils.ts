/**
 * Utility functions for handling timezone-aware date operations
 * 
 * Golf trips happen in Eastern Time (Myrtle Beach, SC area),
 * so all tee times are consistently handled in America/New_York timezone.
 */

import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

// Golf course timezone - Eastern Time
const EASTERN_TIMEZONE = 'America/New_York';

/**
 * Converts a datetime-local input value to a proper UTC Date object
 * treating the input as Eastern Time
 */
export function parseDateTimeLocal(dateTimeLocalValue: string): Date {
  // datetime-local gives us "YYYY-MM-DDTHH:mm" format
  // We treat this as Eastern Time and convert to UTC for storage
  return fromZonedTime(dateTimeLocalValue, EASTERN_TIMEZONE);
}

/**
 * Formats a UTC Date object for use in datetime-local input
 * Converts from UTC to Eastern Time for display
 */
export function formatDateTimeLocal(date: Date): string {
  // Convert UTC date to Eastern Time for display in datetime-local input
  const easternDate = toZonedTime(date, EASTERN_TIMEZONE);
  return format(easternDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Formats a tee time for display to users in Eastern Time
 */
export function formatTeeTimeDisplay(teeTime: string | Date): string {
  const date = typeof teeTime === 'string' ? parseISO(teeTime) : teeTime;
  
  // Convert to Eastern Time and format for display
  const easternDate = toZonedTime(date, EASTERN_TIMEZONE);
  const day = format(easternDate, 'eee'); // Mon, Tue, etc.
  const time = formatTz(easternDate, 'h:mm a', { timeZone: EASTERN_TIMEZONE });
  
  return `${day} ${time}`;
}

/**
 * Formats a date for display with timezone indication
 */
export function formatDateWithTimezone(date: Date): {
  date: string;
  time: string;
  timezone: string;
} {
  const easternDate = toZonedTime(date, EASTERN_TIMEZONE);
  
  return {
    date: format(easternDate, 'eee, MMM d'), // Wed, Mar 15
    time: formatTz(easternDate, 'h:mm a', { timeZone: EASTERN_TIMEZONE }), // 2:30 PM
    timezone: 'ET' // Eastern Time
  };
}