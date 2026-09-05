/**
 * Robust date-time parser and sorting utility for E-Kabad Setu
 * Handles various timestamp formats (ISO, 'YYYY-MM-DD hh:mm A', 'YYYY-MM-DD', epoch)
 */

export function parseDateTimeToMs(dateStr?: string | number | null): number {
  if (!dateStr) return 0;
  if (typeof dateStr === 'number') return dateStr;

  const trimmed = String(dateStr).trim();
  if (!trimmed) return 0;

  // 1. Direct standard JS parsing (handles ISO, UTC, standard RFC strings)
  const directParsed = Date.parse(trimmed);
  if (!isNaN(directParsed)) {
    return directParsed;
  }

  // 2. Format: "YYYY-MM-DD hh:mm A" e.g. "2026-09-04 11:20 AM" or "2026-09-02 04:30 PM"
  const match1 = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (match1) {
    const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr, meridiem] = match1;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    let hour = hourStr ? parseInt(hourStr, 10) : 0;
    const min = minStr ? parseInt(minStr, 10) : 0;
    const sec = secStr ? parseInt(secStr, 10) : 0;

    if (meridiem) {
      const merUpper = meridiem.toUpperCase();
      if (merUpper === 'PM' && hour < 12) hour += 12;
      if (merUpper === 'AM' && hour === 12) hour = 0;
    }

    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  // 3. Format: "DD/MM/YYYY hh:mm A" or "DD-MM-YYYY"
  const match2 = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if (match2) {
    const [, dayStr, monthStr, yearStr, hourStr, minStr, meridiem] = match2;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    let hour = hourStr ? parseInt(hourStr, 10) : 0;
    const min = minStr ? parseInt(minStr, 10) : 0;

    if (meridiem) {
      const merUpper = meridiem.toUpperCase();
      if (merUpper === 'PM' && hour < 12) hour += 12;
      if (merUpper === 'AM' && hour === 12) hour = 0;
    }

    const d = new Date(year, month, day, hour, min);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  return 0;
}

/**
 * Sort array by newest first (descending timestamp)
 */
export function sortByNewestFirst<T>(
  items: T[], 
  getTimestamp: (item: T) => string | number | undefined | null
): T[] {
  return [...items].sort((a, b) => {
    const timeA = parseDateTimeToMs(getTimestamp(a));
    const timeB = parseDateTimeToMs(getTimestamp(b));
    return timeB - timeA;
  });
}

/**
 * Sort array by oldest first (ascending timestamp)
 */
export function sortByOldestFirst<T>(
  items: T[], 
  getTimestamp: (item: T) => string | number | undefined | null
): T[] {
  return [...items].sort((a, b) => {
    const timeA = parseDateTimeToMs(getTimestamp(a));
    const timeB = parseDateTimeToMs(getTimestamp(b));
    return timeA - timeB;
  });
}
