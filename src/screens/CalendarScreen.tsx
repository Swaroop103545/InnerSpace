import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CalendarJournalEntry = {
  id: string;
  date: string;
  timestamp?: string | number;
  year?: string | number;
  title: string;
  titleEmoji?: string;
  body?: string;
  mood?: string;
  weather?: string;
  tags?: string[];
  isFavorite?: boolean;
  backgroundColor?: string;
};

type CalendarScreenProps = {
  entries: CalendarJournalEntry[];
  onOpenEntry?: (entry: CalendarJournalEntry) => void;
  onAddEntry?: (dateKey?: string) => void;
};

export const CALENDAR_SCREEN_BG = '#E6ECF8';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  peaceful: '😌',
  excited: '🤩',
  inspired: '✨',
  grateful: '🙏',
  productive: '💪',
  reflective: '🌙',
  tired: '😴',
  melancholy: '🌧️',
};

const WEATHER_EMOJIS: Record<string, string> = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  windy: '💨',
};

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

const pad2 = (n: number) => String(n).padStart(2, '0');

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const parseTimestamp = (timestamp?: string | number): Date | null => {
  if (timestamp === undefined || timestamp === null || timestamp === '') {
    return null;
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
 * Handles ISO dates, timestamps (number or string), and formatted headers like "WEDNESDAY, NOV 11".
 */
const getEntryDateKey = (
  entry: Pick<CalendarJournalEntry, 'date' | 'timestamp' | 'year'>
): string => {
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

const formatEntryTime = (timestamp?: string | number) => {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const cleanEntryPreview = (body?: string) => {
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

const resolveAccentColor = (bg?: string) => {
  if (!bg) return '#7E6BC4';
  const normalized = bg.trim().toUpperCase();
  if (
    normalized === '#FFFFFF' ||
    normalized === '#FAFAFA' ||
    normalized === '#FAF7FB' ||
    normalized === '#F8F6F0'
  ) {
    return '#7E6BC4';
  }
  return bg;
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({
  entries = [],
  onOpenEntry,
  onAddEntry,
}) => {
  const today = new Date();
  const todayKey = getDateKey(today);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Group all entries by YYYY-MM-DD and sort newest first within each day
  const { entriesByDate, latestEntryDateKey } = useMemo(() => {
    const grouped: Record<string, CalendarJournalEntry[]> = {};
    let latestKey = '';

    entries.forEach((entry) => {
      const key = getEntryDateKey(entry);
      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);

      if (!latestKey || key > latestKey) {
        latestKey = key;
      }
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const tsA = parseTimestamp(a.timestamp)?.getTime() || 0;
        const tsB = parseTimestamp(b.timestamp)?.getTime() || 0;
        return tsB - tsA;
      });
    });

    return { entriesByDate: grouped, latestEntryDateKey: latestKey };
  }, [entries]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Convert Sunday-first JavaScript weekday to Monday-first.
    const leadingDays = (firstDay.getDay() + 6) % 7;

    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - leadingDays + 1;

      if (dayNumber < 1 || dayNumber > totalDays) {
        return null;
      }

      const date = new Date(year, month, dayNumber);

      return {
        day: dayNumber,
        date,
        key: getDateKey(date),
      };
    });
  }, [year, month]);

  const selectedEntries = entriesByDate[selectedDate] || [];

  const { monthEntriesCount, monthActiveDaysCount } = useMemo(() => {
    const monthPrefix = `${year}-${pad2(month + 1)}`;
    let count = 0;
    let activeDays = 0;

    Object.entries(entriesByDate).forEach(([key, dayEntries]) => {
      if (key.startsWith(monthPrefix) && dayEntries.length > 0) {
        count += dayEntries.length;
        activeDays += 1;
      }
    });

    return { monthEntriesCount: count, monthActiveDaysCount: activeDays };
  }, [entriesByDate, year, month]);

  const changeMonth = (direction: number) => {
    const nextMonth = new Date(year, month + direction, 1);
    const nextMonthPrefix = `${nextMonth.getFullYear()}-${pad2(nextMonth.getMonth() + 1)}`;

    setVisibleMonth(nextMonth);

    // If next month contains today, select today; otherwise pick first day in month with an entry or the 1st
    if (todayKey.startsWith(nextMonthPrefix)) {
      setSelectedDate(todayKey);
    } else {
      const firstEntryDay = Object.keys(entriesByDate)
        .filter((k) => k.startsWith(nextMonthPrefix))
        .sort()[0];
      setSelectedDate(firstEntryDay || getDateKey(nextMonth));
    }
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  const jumpToLatestEntry = () => {
    if (!latestEntryDateKey) return;
    const [y, m] = latestEntryDateKey.split('-').map(Number);
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      setVisibleMonth(new Date(y, m - 1, 1));
      setSelectedDate(latestEntryDateKey);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR JOURNAL</Text>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>
            Every day holds a story worth remembering.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={goToToday}
          activeOpacity={0.8}
        >
          <Ionicons name="today-outline" size={16} color="#5648A2" />
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="book-outline" size={21} color="#5648A2" />
        </View>

        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>MONTHLY ARCHIVE</Text>
          <Text style={styles.summaryValue}>
            {monthEntriesCount === 0
              ? 'No memories recorded this month'
              : `${monthEntriesCount} ${monthEntriesCount === 1 ? 'memory' : 'memories'} across ${monthActiveDaysCount} ${monthActiveDaysCount === 1 ? 'day' : 'days'}`}
          </Text>

          {monthEntriesCount === 0 && latestEntryDateKey ? (
            <TouchableOpacity
              style={styles.jumpLatestBtn}
              onPress={jumpToLatestEntry}
              activeOpacity={0.75}
            >
              <Text style={styles.jumpLatestText}>
                Jump to latest entry ({latestEntryDateKey})
              </Text>
              <Ionicons name="arrow-forward" size={12} color="#5648A2" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.summaryDecoration}>
          <Ionicons name="sparkles-outline" size={22} color="#8D9AD0" />
        </View>
      </View>

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <View>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Text style={styles.monthCaption}>
              Select a day to revisit your memories
            </Text>
          </View>

          <View style={styles.monthActions}>
            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => changeMonth(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={19} color="#4A5173" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => changeMonth(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={19} color="#4A5173" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekday Labels */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{weekday}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((item, index) => {
            if (!item) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dayEntries = entriesByDate[item.key] || [];
            const hasEntries = dayEntries.length > 0;
            const isSelected = selectedDate === item.key;
            const isToday = todayKey === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.dayCell}
                onPress={() => setSelectedDate(item.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayNumberContainer,
                    hasEntries && !isSelected && !isToday && styles.hasEntryDay,
                    isToday && !isSelected && styles.todayDay,
                    isSelected && styles.selectedDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      hasEntries && !isSelected && !isToday && styles.hasEntryDayText,
                      isToday && !isSelected && styles.todayDayText,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>

                <View style={styles.dayIndicator}>
                  {hasEntries &&
                    dayEntries.slice(0, 3).map((e, dotIdx) => (
                      <View
                        key={`${item.key}-dot-${e.id || dotIdx}`}
                        style={[
                          styles.entryDot,
                          isSelected && styles.selectedEntryDot,
                        ]}
                      />
                    ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calendar Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendToday} />
            <Text style={styles.legendText}>Today</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={styles.legendEntry} />
            <Text style={styles.legendText}>Journal entry</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={styles.legendSelected} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>
      </View>

      {/* Selected Date Entries */}
      <View style={styles.entriesSection}>
        <View style={styles.entriesHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.entriesEyebrow}>YOUR MEMORIES</Text>
            <Text style={styles.entriesTitle}>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                'en-US',
                {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </Text>
          </View>

          <View style={styles.entriesHeaderActions}>
            {onAddEntry ? (
              <TouchableOpacity
                style={styles.quickAddBtn}
                onPress={() => onAddEntry(selectedDate)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color="#5648A2" />
                <Text style={styles.quickAddText}>Write</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.entryCountBadge}>
              <Text style={styles.entryCountText}>
                {selectedEntries.length}
              </Text>
            </View>
          </View>
        </View>

        {selectedEntries.length > 0 ? (
          <View style={styles.entryList}>
            {selectedEntries.map((entry) => {
              const previewText = cleanEntryPreview(entry.body);
              const accentColor = resolveAccentColor(entry.backgroundColor);
              const moodEmoji = entry.mood
                ? MOOD_EMOJIS[entry.mood.toLowerCase()] || ''
                : '';
              const weatherEmoji = entry.weather
                ? WEATHER_EMOJIS[entry.weather.toLowerCase()] || ''
                : '';

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  activeOpacity={0.8}
                  onPress={() => onOpenEntry?.(entry)}
                  disabled={!onOpenEntry}
                >
                  <View
                    style={[
                      styles.entryAccent,
                      { backgroundColor: accentColor },
                    ]}
                  />

                  <View style={styles.entryCardContent}>
                    <View style={styles.entryTopRow}>
                      <Text style={styles.entryTime}>
                        {formatEntryTime(entry.timestamp) || entry.date || 'Journal entry'}
                      </Text>

                      <View style={styles.entryMetaRow}>
                        {moodEmoji ? (
                          <Text style={styles.entryMood}>{moodEmoji}</Text>
                        ) : null}
                        {weatherEmoji ? (
                          <Text style={styles.entryMood}>{weatherEmoji}</Text>
                        ) : null}
                        {entry.isFavorite ? (
                          <Ionicons name="star" size={14} color="#D49B38" />
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.entryTitle} numberOfLines={2}>
                      {entry.titleEmoji &&
                      !entry.title?.startsWith(entry.titleEmoji)
                        ? `${entry.titleEmoji} ${entry.title || 'Untitled memory'}`
                        : entry.title || 'Untitled memory'}
                    </Text>

                    {previewText ? (
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {previewText}
                      </Text>
                    ) : null}

                    {Array.isArray(entry.tags) && entry.tags.length > 0 ? (
                      <View style={styles.tagsRow}>
                        {entry.tags.slice(0, 3).map((tag) => (
                          <View key={tag} style={styles.tagPill}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {onOpenEntry ? (
                      <View style={styles.openEntryRow}>
                        <Text style={styles.openEntryText}>Open memory</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color="#5648A2"
                        />
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="leaf-outline" size={27} color="#6652B8" />
            </View>

            <Text style={styles.emptyTitle}>A blank page awaits</Text>
            <Text style={styles.emptyDescription}>
              No journal entries for this day. Make room for a new memory
              whenever you&apos;re ready.
            </Text>

            {onAddEntry ? (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() => onAddEntry(selectedDate)}
              >
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Write a Reflection</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="sparkles-outline" size={15} color="#6E789C" />
        <Text style={styles.footerText}>
          Your story, one day at a time.
        </Text>
      </View>
    </ScrollView>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALENDAR_SCREEN_BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    color: '#687194',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 7,
  },
  title: {
    color: '#1F243D',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#5F6682',
    fontSize: 12,
    marginTop: 6,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3DCF0',
  },
  todayButtonText: {
    color: '#5648A2',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#D9E2F5',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CBD6EE',
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
    marginLeft: 13,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#5E678C',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232845',
  },
  jumpLatestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  jumpLatestText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5648A2',
  },
  summaryDecoration: {
    width: 35,
    alignItems: 'center',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 17,
    borderWidth: 1,
    borderColor: '#D5DFF2',
    shadowColor: '#1E2A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#232845',
  },
  monthCaption: {
    fontSize: 10,
    color: '#737B99',
    marginTop: 5,
  },
  monthActions: {
    flexDirection: 'row',
    gap: 8,
  },
  monthArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#EEF2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 9,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    color: '#7C85A6',
    fontSize: 10,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3E4460',
  },
  hasEntryDay: {
    backgroundColor: '#EFF2FC',
  },
  hasEntryDayText: {
    color: '#463A8A',
    fontWeight: '700',
  },
  selectedDay: {
    backgroundColor: '#6652B8',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDay: {
    backgroundColor: '#EAE6FA',
    borderWidth: 1,
    borderColor: '#C8BEEE',
  },
  todayDayText: {
    color: '#5B48AD',
    fontWeight: '700',
  },
  dayIndicator: {
    height: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7A68C4',
  },
  selectedEntryDot: {
    backgroundColor: '#6652B8',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F8',
    paddingTop: 15,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendToday: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#EAE6FA',
    borderWidth: 1,
    borderColor: '#C8BEEE',
  },
  legendEntry: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7A68C4',
  },
  legendSelected: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#6652B8',
  },
  legendText: {
    color: '#737B99',
    fontSize: 9,
    fontWeight: '600',
  },
  entriesSection: {
    marginTop: 27,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  entriesEyebrow: {
    fontSize: 9,
    color: '#687194',
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  entriesTitle: {
    color: '#1F243D',
    fontSize: 19,
    fontWeight: '700',
  },
  entriesHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D3DCF0',
  },
  quickAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5648A2',
  },
  entryCountBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#D9E2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCountText: {
    color: '#463A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  entryList: {
    gap: 11,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5DFF2',
    shadowColor: '#1E2A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  entryAccent: {
    width: 5,
    backgroundColor: '#7E6BC4',
  },
  entryCardContent: {
    flex: 1,
    padding: 15,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  entryTime: {
    color: '#737B99',
    fontSize: 10,
    fontWeight: '600',
  },
  entryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryMood: {
    fontSize: 15,
  },
  entryTitle: {
    color: '#232845',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  entryPreview: {
    color: '#636B87',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  tagPill: {
    backgroundColor: '#EFF3FB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5648A2',
  },
  openEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  openEntryText: {
    color: '#5648A2',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DFF2',
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EEF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: {
    color: '#232845',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDescription: {
    color: '#6B7394',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6652B8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#6652B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 27,
  },
  footerText: {
    color: '#6E789C',
    fontSize: 10,
    fontWeight: '500',
  },
});
