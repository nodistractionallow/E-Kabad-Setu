/**
 * Robust date-time parser and sorting utility for E-Kabad Setu
 * Handles Indian & international timestamp formats (DD/MM/YYYY, ISO, YYYY-MM-DD, epoch)
 */

export function parseDateTimeToMs(dateStr?: string | number | null): number {
  if (!dateStr) return 0;
  if (typeof dateStr === 'number') return dateStr;

  const trimmed = String(dateStr).trim();
  if (!trimmed) return 0;

  // 1. ISO 8601 string with time component (e.g. "2026-09-12T03:50:00.000Z") - parse directly
  if (trimmed.includes('T')) {
    const parsedIso = Date.parse(trimmed);
    if (!isNaN(parsedIso)) return parsedIso;
  }

  // 2. Format: "DD/MM/YYYY hh:mm A" or "DD-MM-YYYY" (Common in India / en-GB, e.g. "08/09/2026 01:08 AM", "09/09/2026, 01:08 AM")
  // MUST precede Date.parse so that 08/09/2026 is parsed as 8th September, NOT 9th August!
  const matchDMY = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (matchDMY) {
    const [, dayStr, monthStr, yearStr, hourStr, minStr, secStr, meridiem] = matchDMY;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed month
    const year = parseInt(yearStr, 10);
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

  // 3. Format: "YYYY-MM-DD hh:mm A" e.g. "2026-09-04 11:20 AM" or "2026-09-02 04:30 PM"
  const matchYMD = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (matchYMD) {
    const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr, meridiem] = matchYMD;
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

  // 4. Direct standard JS parsing (handles standard RFC strings)
  const directParsed = Date.parse(trimmed);
  if (!isNaN(directParsed)) {
    return directParsed;
  }

  return 0;
}

/**
 * Returns a human-readable date string including month name for search and display
 * e.g. "08 Sep 2026 01:08 AM (September 2026)"
 */
export function getSearchableDateString(dateStr?: string | number | null): string {
  if (!dateStr) return '';
  const ms = parseDateTimeToMs(dateStr);
  if (!ms) return String(dateStr);
  const d = new Date(ms);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthFull = monthNames[d.getMonth()] || '';
  const monthShort = shortMonths[d.getMonth()] || '';
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${String(dateStr)} ${day}/${String(d.getMonth() + 1).padStart(2, '0')}/${year} ${day}-${String(d.getMonth() + 1).padStart(2, '0')}-${year} ${monthShort} ${monthFull} ${year}`;
}

/**
 * Formats any date input (ISO string, DD/MM/YYYY, epoch) into a clean, standardized display format
 * e.g. "12 Sep 2026, 03:45 PM"
 */
export function formatDisplayDateTime(dateVal?: string | number | null): string {
  if (!dateVal) return 'N/A';
  const ms = parseDateTimeToMs(dateVal);
  if (!ms) return String(dateVal);
  const d = new Date(ms);
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = shortMonths[d.getMonth()] || '';
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
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
