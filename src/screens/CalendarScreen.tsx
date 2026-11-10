
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CalendarJournalEntry = {
  id: string;
  date: string;
  timestamp?: string | number;
  title: string;
  body?: string;
  mood?: string;
  backgroundColor?: string;
};

type CalendarScreenProps = {
  entries: CalendarJournalEntry[];
  onOpenEntry?: (entry: CalendarJournalEntry) => void;
  onAddEntry?: (dateKey?: string) => void;
};

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

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getEntryDateKey = (date: string) => {
  // Journal dates are expected to use YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.substring(0, 10);
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return getDateKey(parsed);
};

const formatEntryTime = (timestamp?: string | number) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({
  entries = [],
  onOpenEntry,
  onAddEntry,
}) => {
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(getDateKey(today));

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, CalendarJournalEntry[]> = {};

    entries.forEach((entry) => {
      const key = getEntryDateKey(entry.date);

      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(entry);
    });

    return grouped;
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

  const monthEntriesCount = useMemo(() => {
    return entries.filter((entry) => {
      const key = getEntryDateKey(entry.date);
      return key.startsWith(
        `${year}-${String(month + 1).padStart(2, '0')}`,
      );
    }).length;
  }, [entries, year, month]);

  const changeMonth = (direction: number) => {
    const nextMonth = new Date(year, month + direction, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(getDateKey(nextMonth));
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(getDateKey(today));
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
          <Ionicons name="today-outline" size={16} color="#6652A3" />
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="book-outline" size={21} color="#725CB2" />
        </View>

        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>MONTHLY ARCHIVE</Text>
          <Text style={styles.summaryValue}>
            {monthEntriesCount === 0
              ? 'No memories recorded this month'
              : `${monthEntriesCount} ${monthEntriesCount === 1 ? 'memory' : 'memories'} recorded`}
          </Text>
        </View>

        <View style={styles.summaryDecoration}>
          <Ionicons name="sparkles-outline" size={24} color="#B7A8DC" />
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
              <Ionicons
                name="chevron-back"
                size={19}
                color="#5E5670"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => changeMonth(1)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={19}
                color="#5E5670"
              />
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

            const hasEntries = Boolean(entriesByDate[item.key]?.length);
            const isSelected = selectedDate === item.key;
            const isToday = getDateKey(today) === item.key;

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
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayDayText,
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>

                <View style={styles.dayIndicator}>
                  {hasEntries && (
                    <View
                      style={[
                        styles.entryDot,
                        isSelected && styles.selectedEntryDot,
                      ]}
                    />
                  )}
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
          <View>
            <Text style={styles.entriesEyebrow}>YOUR MEMORIES</Text>
            <Text style={styles.entriesTitle}>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                'en-US',
                {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                },
              )}
            </Text>
          </View>

          <View style={styles.entryCountBadge}>
            <Text style={styles.entryCountText}>
              {selectedEntries.length}
            </Text>
          </View>
        </View>

        {selectedEntries.length > 0 ? (
          <View style={styles.entryList}>
            {selectedEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                activeOpacity={0.8}
                onPress={() => onOpenEntry?.(entry)}
                disabled={!onOpenEntry}
              >
                <View style={styles.entryAccent} />

                <View style={styles.entryCardContent}>
                  <View style={styles.entryTopRow}>
                    <Text style={styles.entryTime}>
                      {formatEntryTime(entry.timestamp) || 'Journal entry'}
                    </Text>

                    {entry.mood ? (
                      <Text style={styles.entryMood}>
                        {MOOD_EMOJIS[entry.mood.toLowerCase()] || '✨'}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.entryTitle} numberOfLines={2}>
                    {entry.title || 'Untitled memory'}
                  </Text>

                  {entry.body ? (
                    <Text style={styles.entryPreview} numberOfLines={2}>
                      {entry.body}
                    </Text>
                  ) : null}

                  {onOpenEntry ? (
                    <View style={styles.openEntryRow}>
                      <Text style={styles.openEntryText}>
                        Open memory
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#7864B5"
                      />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="leaf-outline"
                size={27}
                color="#9585BD"
              />
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
        <Ionicons name="sparkles-outline" size={15} color="#A69ABF" />
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
    backgroundColor: '#F7F6FA',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    color: '#9388A8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 7,
  },
  title: {
    color: '#29243A',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#898394',
    fontSize: 12,
    marginTop: 6,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEEAF7',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#6652A3',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#EEEBF7',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    color: '#9285B0',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#403653',
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
    borderColor: '#EFEDF3',
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
    color: '#302B40',
  },
  monthCaption: {
    fontSize: 10,
    color: '#9A94A5',
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
    backgroundColor: '#F5F3F8',
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
    color: '#A29BAF',
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
    color: '#514B5E',
  },
  selectedDay: {
    backgroundColor: '#7661B3',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDay: {
    backgroundColor: '#EEEAF7',
    borderWidth: 1,
    borderColor: '#D8D0EA',
  },
  todayDayText: {
    color: '#705BAA',
    fontWeight: '700',
  },
  dayIndicator: {
    height: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A18BCF',
  },
  selectedEntryDot: {
    backgroundColor: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1EFF4',
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
    backgroundColor: '#EEEAF7',
    borderWidth: 1,
    borderColor: '#D8D0EA',
  },
  legendEntry: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#A18BCF',
  },
  legendSelected: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#7661B3',
  },
  legendText: {
    color: '#928B9D',
    fontSize: 9,
  },
  entriesSection: {
    marginTop: 27,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  entriesEyebrow: {
    fontSize: 9,
    color: '#9A90AD',
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  entriesTitle: {
    color: '#302B40',
    fontSize: 19,
    fontWeight: '700',
  },
  entryCountBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#EEEAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCountText: {
    color: '#705BAA',
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
    borderColor: '#EFEDF3',
  },
  entryAccent: {
    width: 4,
    backgroundColor: '#A18BCF',
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
    color: '#9A93A5',
    fontSize: 10,
    fontWeight: '600',
  },
  entryMood: {
    fontSize: 16,
  },
  entryTitle: {
    color: '#383247',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  entryPreview: {
    color: '#918B9B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  openEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  openEntryText: {
    color: '#7864B5',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEDF3',
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F1EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: {
    color: '#423B51',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDescription: {
    color: '#9992A2',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7864B5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#7864B5',
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
    color: '#A39BAD',
    fontSize: 10,
    fontWeight: '500',
  },
});