export interface DateResolvableEntry {
  date?: string | number | Date;
  timestamp?: string | number;
  year?: string | number;
}

const MONTH_INDEX_MAP: Record<string, number> = {
  JAN: 0,
  JANUARY: 0,
  FEB: 1,
  FEBRUARY: 1,
  MAR: 2,
  MARCH: 2,
  APR: 3,
  APRIL: 3,
  MAY: 4,
  JUN: 5,
  JUNE: 5,
  JUL: 6,
  JULY: 6,
  AUG: 7,
  AUGUST: 7,
  SEP: 8,
  SEPT: 8,
  SEPTEMBER: 8,
  OCT: 9,
  OCTOBER: 9,
  NOV: 10,
  NOVEMBER: 10,
  DEC: 11,
  DECEMBER: 11,
};

const DAILY_HEADERS = new Set([
  '[[daily_journal]]',
  "today’s highlight",
  "today's highlight",
  'grateful for',
  "today’s challenge",
  "today's challenge",
  "tomorrow’s intention",
  "tomorrow's intention",
]);

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const getDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const parseTimestamp = (timestamp?: string | number | Date): Date | null => {
  if (timestamp === undefined || timestamp === null || timestamp === '') {
    return null;
  }

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  let parsed: Date;
  if (typeof timestamp === 'number') {
    parsed = new Date(timestamp);
  } else if (/^\d+$/.test(timestamp.trim())) {
    parsed = new Date(Number(timestamp.trim()));
  } else {
    parsed = new Date(timestamp);
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Resolves a journal entry to its local YYYY-MM-DD calendar date key.
 * Handles ISO dates, timestamps (number/string/Date), and formatted headers like "WEDNESDAY, NOV 11".
 */
export const getEntryDateKey = (entry: DateResolvableEntry): string => {
  if (entry.date instanceof Date) {
    return Number.isNaN(entry.date.getTime()) ? '' : getDateKey(entry.date);
  }

  if (typeof entry.date === 'number') {
    const parsedNum = parseTimestamp(entry.date);
    return parsedNum ? getDateKey(parsedNum) : '';
  }

  const rawDate = (entry.date || '').trim();

  // 1. Explicit YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const isoMatch = rawDate.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }

  const tsDate = parseTimestamp(entry.timestamp);
  const explicitYearMatch = rawDate.match(/\b(19|20)\d{2}\b/);
  const fallbackYear = explicitYearMatch
    ? Number(explicitYearMatch[0])
    : entry.year
      ? Number(entry.year)
      : tsDate
        ? tsDate.getFullYear()
        : new Date().getFullYear();

  // 2. Formatted dates like "WEDNESDAY, NOV 11" or "Nov 2, 2026"
  if (rawDate) {
    const monthDayMatch = rawDate.match(
      /(?:^|[\s,])(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
    if (monthDayMatch) {
      const monthIdx = MONTH_INDEX_MAP[monthDayMatch[1].toUpperCase()];
      const dayNum = Number(monthDayMatch[2]);
      if (monthIdx !== undefined && dayNum >= 1 && dayNum <= 31) {
        return `${fallbackYear}-${pad2(monthIdx + 1)}-${pad2(dayNum)}`;
      }
    }

    const dayMonthMatch = rawDate.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\.?\b/i
    );
    if (dayMonthMatch) {
      const dayNum = Number(dayMonthMatch[1]);
      const monthIdx = MONTH_INDEX_MAP[dayMonthMatch[2].toUpperCase()];
      if (monthIdx !== undefined && dayNum >= 1 && dayNum <= 31) {
        return `${fallbackYear}-${pad2(monthIdx + 1)}-${pad2(dayNum)}`;
      }
    }

    // 3. Standard date strings with an explicit year
    if (explicitYearMatch) {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) {
        return getDateKey(parsed);
      }
    }
  }

  // 4. Timestamp fallback
  if (tsDate) {
    return getDateKey(tsDate);
  }

  return '';
};

/**
 * Strips Daily Journal structural markers and labels to create a clean readable preview.
 */
export const cleanEntryPreview = (body?: string): string => {
  if (!body) return '';

  if (!body.includes('[[DAILY_JOURNAL]]')) {
    return body.replace(/\s+/g, ' ').trim();
  }

  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !DAILY_HEADERS.has(line.toLowerCase()));

  return lines.join(' · ');
};

/**
 * Computes current and longest consecutive journaling day streaks from journal entries.
 */
export const computeJournalingStreaks = (
  entries: DateResolvableEntry[]
): {
  currentStreak: number;
  longestStreak: number;
  activeDayKeys: Set<string>;
} => {
  const activeDayKeys = new Set<string>();

  for (const entry of entries) {
    const key = getEntryDateKey(entry);
    if (key) {
      activeDayKeys.add(key);
    }
  }

  if (activeDayKeys.size === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDayKeys };
  }

  // Current streak: counts backwards from today (or yesterday if not yet journaled today)
  const today = new Date();
  const todayKey = getDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  let currentStreak = 0;
  let cursor: Date | null = null;

  if (activeDayKeys.has(todayKey)) {
    cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  } else if (activeDayKeys.has(yesterdayKey)) {
    cursor = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
  }

  while (cursor && activeDayKeys.has(getDateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan sorted unique dates
  const sortedKeys = Array.from(activeDayKeys).sort();
  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < sortedKeys.length; i += 1) {
    const prevDate = new Date(`${sortedKeys[i - 1]}T12:00:00`);
    prevDate.setDate(prevDate.getDate() + 1);
    if (getDateKey(prevDate) === sortedKeys[i]) {
      run += 1;
      if (run > longestStreak) {
        longestStreak = run;
      }
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak, activeDayKeys };
};

