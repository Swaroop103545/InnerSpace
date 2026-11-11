import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import {
  cleanEntryPreview,
  computeJournalingStreaks,
  getDateKey,
  getEntryDateKey,
} from '../utils/entryDates';

export type ProfileJournalEntry = {
  id?: string;
  date?: string | number | Date;
  timestamp?: string | number;
  year?: string | number;
  title?: string;
  titleEmoji?: string;
  body?: string;
  mood?: string;
  tags?: string[];
  isFavorite?: boolean;
};

type ProfileStats = {
  totalEntries: number;
  totalPolaroids: number;
  totalCharacters?: number;
  moodCounts?: Record<string, number>;
  tagCounts?: Record<string, number>;
};

type ProfileScreenProps = {
  userId?: string | null;
  userName: string;
  userEmail?: string;
  userSubtitle?: string;
  userStreakDays: number;
  stats: ProfileStats;
  entries: ProfileJournalEntry[];
  fontsLoaded?: boolean;

  onEditName: (name: string) => void;
  onUpdateProfile?: (updates: { name: string; subtitle: string }) => void;
  onSelectTag?: (tag: string) => void;
  onOpenEntry?: (entry: ProfileJournalEntry) => void;
  onResetData: () => void;
  onSyncAllToFirebase?: () => void;
  onLogout: () => void;
  onReturnToJournal: () => void;
};

const MOOD_META: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: '#EAB308' },
  peaceful: { emoji: '😌', label: 'Calm', color: '#4EA898' },
  excited: { emoji: '🥳', label: 'Excited', color: '#EC4899' },
  inspired: { emoji: '✨', label: 'Inspired', color: '#8B5CF6' },
  grateful: { emoji: '🙏', label: 'Grateful', color: '#F59E0B' },
  productive: { emoji: '⚡', label: 'Productive', color: '#3B82F6' },
  reflective: { emoji: '💭', label: 'Reflective', color: '#6366F1' },
  tired: { emoji: '😴', label: 'Tired', color: '#94A3B8' },
  melancholy: { emoji: '🌧️', label: 'Melancholy', color: '#64748B' },
};

const BIO_PRESETS = [
  'Tell me about your day today',
  'Every page holds a piece of your story.',
  'Collecting quiet moments, one day at a time.',
  'Writing my way to clarity and gratitude.',
];

const GOAL_OPTIONS = [3, 5, 7] as const;

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId,
  userName,
  userEmail,
  userSubtitle,
  userStreakDays,
  stats,
  entries = [],
  fontsLoaded = false,
  onEditName,
  onUpdateProfile,
  onSelectTag,
  onOpenEntry,
  onResetData,
  onSyncAllToFirebase,
  onLogout,
  onReturnToJournal,
}) => {
  // Interactive UI states
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // default today
  const [weeklyGoal, setWeeklyGoal] = useState<number>(7);

  // Edit Profile modal state (cross-platform iOS / Android / Web)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [draftName, setDraftName] = useState(userName || '');
  const [draftSubtitle, setDraftSubtitle] = useState(
    userSubtitle || 'Every page holds a piece of your story.'
  );

  // Favorites viewer modal state
  const [isFavoritesModalVisible, setIsFavoritesModalVisible] = useState(false);

  const goalStorageKey = `@innerspace_weekly_goal_${userId || 'local'}`;

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(goalStorageKey)
      .then((val) => {
        if (!mounted || !val) return;
        const parsed = Number(val);
        if (parsed === 3 || parsed === 5 || parsed === 7) {
          setWeeklyGoal(parsed);
        }
      })
      .catch((err) => console.warn('Failed to load weekly goal:', err));
    return () => {
      mounted = false;
    };
  }, [goalStorageKey]);

  const handleCycleWeeklyGoal = () => {
    const idx = GOAL_OPTIONS.indexOf(weeklyGoal as 3 | 5 | 7);
    const nextGoal = GOAL_OPTIONS[(idx + 1) % GOAL_OPTIONS.length];
    setWeeklyGoal(nextGoal);
    AsyncStorage.setItem(goalStorageKey, String(nextGoal)).catch((err) =>
      console.warn('Failed to save weekly goal:', err)
    );
  };

  // Accurate streaks computed from entries
  const streaks = useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    return computeJournalingStreaks(safeEntries);
  }, [entries]);

  const effectiveStreak =
    entries.length > 0 ? streaks.currentStreak : userStreakDays;

  // Accurate Weekly Analytics using shared date resolution
  const weeklyActivity = useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const today = new Date();

    const dayCounts: Record<string, number> = {};
    for (const entry of safeEntries) {
      const key = getEntryDateKey(entry);
      if (key) {
        dayCounts[key] = (dayCounts[key] || 0) + 1;
      }
    }

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const key = getDateKey(date);
      const count = dayCounts[key] || 0;

      return {
        key,
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        fullLabel: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        count,
        isToday: index === 6,
      };
    });

    return {
      days,
      total: days.reduce((sum, day) => sum + day.count, 0),
      activeDays: days.filter((day) => day.count > 0).length,
      max: Math.max(...days.map((day) => day.count), 1),
    };
  }, [entries]);

  // Mood distribution
  const topMoods = useMemo(() => {
    const counts: Record<string, number> = { ...(stats.moodCounts || {}) };
    if (Object.keys(counts).length === 0) {
      entries.forEach((entry) => {
        if (entry.mood) {
          counts[entry.mood] = (counts[entry.mood] || 0) + 1;
        }
      });
    }

    const totalWithMood = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([moodId, count]) => {
        const meta = MOOD_META[moodId.toLowerCase()] || {
          emoji: '✨',
          label: moodId.charAt(0).toUpperCase() + moodId.slice(1),
          color: '#7655C9',
        };
        return {
          id: moodId,
          ...meta,
          count,
          percent: totalWithMood > 0 ? Math.round((count / totalWithMood) * 100) : 0,
        };
      });
  }, [stats.moodCounts, entries]);

  // Top themes / tags
  const topTags = useMemo(() => {
    const counts: Record<string, number> = { ...(stats.tagCounts || {}) };
    if (Object.keys(counts).length === 0) {
      entries.forEach((entry) => {
        entry.tags?.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  }, [stats.tagCounts, entries]);

  // Favorites and estimated words
  const favoriteEntries = useMemo(() => {
    return (Array.isArray(entries) ? entries : []).filter((e) => e.isFavorite);
  }, [entries]);

  const totalWords = useMemo(() => {
    let words = 0;
    for (const entry of entries) {
      const cleanedBody = cleanEntryPreview(entry.body);
      const text = `${entry.title || ''} ${cleanedBody}`.trim();
      if (text) {
        words += text.split(/\s+/).length;
      }
    }
    return words;
  }, [entries]);

  const goalPercentage = Math.min(
    100,
    Math.round((weeklyActivity.activeDays / weeklyGoal) * 100)
  );

  // Open Cross-platform Edit Profile Modal
  const openEditProfileModal = () => {
    setDraftName(userName || '');
    setDraftSubtitle(
      userSubtitle || 'Every page holds a piece of your story.'
    );
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    const trimmedName = draftName.trim();
    const trimmedSubtitle = draftSubtitle.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a display name.');
      return;
    }

    const finalSubtitle =
      trimmedSubtitle || 'Every page holds a piece of your story.';

    if (onUpdateProfile) {
      onUpdateProfile({ name: trimmedName, subtitle: finalSubtitle });
    } else {
      onEditName(trimmedName);
    }

    setIsEditModalVisible(false);
  };

  const handleExportJournal = async () => {
    if (!entries || entries.length === 0) {
      Alert.alert(
        'Nothing to Export',
        'Write your first journal reflection before exporting.'
      );
      return;
    }

    const header = `${userName || 'My'}'s InnerSpace Journal (${entries.length} ${
      entries.length === 1 ? 'entry' : 'entries'
    })\n${'='.repeat(40)}\n\n`;

    const formattedEntries = entries
      .map((entry) => {
        const moodEmoji = entry.mood
          ? MOOD_META[entry.mood.toLowerCase()]?.emoji || ''
          : '';
        const dateStr =
          typeof entry.date === 'string' && entry.date
            ? entry.date
            : getEntryDateKey(entry);
        const cleanedBody = cleanEntryPreview(entry.body);
        const tagLine =
          entry.tags && entry.tags.length > 0
            ? `\nTags: ${entry.tags.map((t) => `#${t}`).join(' ')}`
            : '';

        return `[${dateStr}] ${moodEmoji} ${entry.title || 'Untitled'}\n${cleanedBody}${tagLine}`;
      })
      .join('\n\n---\n\n');

    try {
      await Share.share({
        title: `${userName || 'InnerSpace'} Journal Export`,
        message: `${header}${formattedEntries}`,
      });
    } catch (err: any) {
      Alert.alert('Export Notice', err?.message || 'Unable to share journal.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Journal Entries?',
      'This will remove all your entries and reset your journal to a clean slate. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: onResetData,
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of InnerSpace?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const initial = userName?.trim()?.[0]?.toUpperCase() || 'E';
  const selectedDayInfo = weeklyActivity.days[selectedDayIndex] || weeklyActivity.days[6];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.eyebrow,
              fontsLoaded && styles.playfairFont,
            ]}
          >
            YOUR PERSONAL SPACE
          </Text>

          <Text
            style={[
              styles.headerTitle,
              fontsLoaded && styles.playfairFont,
            ]}
          >
            Author Profile
          </Text>

          <Text style={styles.headerSubtitle}>
            Your journey, reflected in moments.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIcon}
          activeOpacity={0.7}
          onPress={openEditProfileModal}
        >
          <Feather name="edit-3" size={19} color="#7655C9" />
        </TouchableOpacity>
      </View>

      {/* Author Card */}
      <View style={styles.authorCard}>
        <View style={styles.authorTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.identity}>
            <Text style={styles.authorName}>
              {userName || 'Journal Author'}
            </Text>

            {!!userEmail && (
              <Text style={styles.email}>{userEmail}</Text>
            )}

            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Personal Journal</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editIcon}
            activeOpacity={0.7}
            onPress={openEditProfileModal}
          >
            <Feather name="edit-2" size={16} color="#7655C9" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity activeOpacity={0.7} onPress={openEditProfileModal}>
          <Text style={styles.quote}>
            &ldquo;{userSubtitle || 'Every page holds a piece of your story.'}&rdquo;
          </Text>
        </TouchableOpacity>

        <View style={styles.authorStats}>
          <View style={styles.authorStat}>
            <Text style={styles.authorStatValue}>
              {stats.totalEntries}
            </Text>
            <Text style={styles.authorStatLabel}>ENTRIES</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.authorStat}>
            <Text style={styles.authorStatValue}>
              {effectiveStreak}
            </Text>
            <Text style={styles.authorStatLabel}>DAY STREAK</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.authorStat}>
            <Text style={styles.authorStatValue}>
              {stats.totalPolaroids}
            </Text>
            <Text style={styles.authorStatLabel}>PHOTOS</Text>
          </View>
        </View>
      </View>

      {/* Analytics Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your Analytics</Text>
          <Text style={styles.sectionSubtitle}>
            A little look at your journaling habits.
          </Text>
        </View>

        <View style={styles.analyticsIcon}>
          <Feather name="activity" size={18} color="#7655C9" />
        </View>
      </View>

      {/* Weekly Activity */}
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <View>
            <Text style={styles.cardTitle}>Weekly activity</Text>
            <Text style={styles.cardSubtitle}>
              Tap any day bar to inspect activity
            </Text>
          </View>

          <View style={styles.weeklyBadge}>
            <Text style={styles.weeklyValue}>
              {weeklyActivity.total}
            </Text>
            <Text style={styles.weeklyLabel}>THIS WEEK</Text>
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyAnalyticsNotice}>
            <Feather name="feather" size={17} color="#7655C9" />
            <Text style={styles.emptyAnalyticsText}>
              No reflections recorded yet. Start writing your thoughts to see your weekly journaling habits build up.
            </Text>
          </View>
        ) : (
          <View style={styles.selectedDayBanner}>
            <Text style={styles.selectedDayBannerText}>
              {selectedDayInfo.fullLabel}:{' '}
              <Text style={styles.selectedDayBannerCount}>
                {selectedDayInfo.count}{' '}
                {selectedDayInfo.count === 1 ? 'memory' : 'memories'}
              </Text>
            </Text>
          </View>
        )}

        <View style={styles.chart}>
          {weeklyActivity.days.map((day, index) => {
            const barHeight = Math.max(
              (day.count / weeklyActivity.max) * 100,
              day.count > 0 ? 14 : 6
            );
            const isSelected = selectedDayIndex === index;

            return (
              <TouchableOpacity
                key={`${day.key}-${index}`}
                style={styles.chartColumn}
                activeOpacity={0.75}
                onPress={() => setSelectedDayIndex(index)}
              >
                <Text style={styles.chartValue}>
                  {day.count > 0 ? day.count : ''}
                </Text>

                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: isSelected
                          ? '#5D3FB8'
                          : day.isToday
                            ? '#7655C9'
                            : day.count > 0
                              ? '#B8A4E9'
                              : '#EEEAF5',
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: '#3E2785',
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.chartDay,
                    (day.isToday || isSelected) && styles.todayLabel,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.chartFooter}>
          <View style={styles.legend}>
            <View style={styles.legendDot} />
            <Text style={styles.footerText}>Journal entries</Text>
          </View>

          <Text style={styles.footerText}>
            {weeklyActivity.activeDays}/7 active days
          </Text>
        </View>
      </View>

      {/* Analytics Metrics */}
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="book-open"
          value={totalWords}
          label="Words written"
          description={`Across ${stats.totalEntries} ${
            stats.totalEntries === 1 ? 'entry' : 'entries'
          }`}
          iconStyle={styles.purpleIcon}
          iconColor="#7655C9"
        />

        <MetricCard
          icon="zap"
          value={effectiveStreak}
          label="Current streak"
          description={`Longest: ${streaks.longestStreak} ${
            streaks.longestStreak === 1 ? 'day' : 'days'
          }`}
          iconStyle={styles.orangeIcon}
          iconColor="#E07A2F"
        />

        <MetricCard
          icon="star"
          value={favoriteEntries.length}
          label="Favorite memories"
          description="Tap to revisit starred stories"
          iconStyle={styles.greenIcon}
          iconColor="#2F855A"
          onPress={() => setIsFavoritesModalVisible(true)}
        />

        <MetricCard
          icon="camera"
          value={stats.totalPolaroids}
          label="Captured moments"
          description="Polaroids in your journal"
          iconStyle={styles.blueIcon}
          iconColor="#3B72C4"
        />
      </View>

      {/* Consistency & Customizable Weekly Goal */}
      <View style={styles.consistencyCard}>
        <View style={styles.consistencyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.consistencyTitle}>Your consistency</Text>
            <Text style={styles.consistencySubtitle}>
              Target: {weeklyGoal} active days per week
            </Text>
          </View>

          <TouchableOpacity
            style={styles.goalPillBtn}
            onPress={handleCycleWeeklyGoal}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={12} color="#D6C4FF" />
            <Text style={styles.goalPillText}>Goal: {weeklyGoal}d</Text>
          </TouchableOpacity>

          <Text style={styles.percentage}>{goalPercentage}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${goalPercentage}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.consistencyFooter}>
          {weeklyActivity.activeDays >= weeklyGoal
            ? `Goal reached! You showed up ${weeklyActivity.activeDays} days this week.`
            : weeklyActivity.activeDays > 0
              ? `You've journaled ${weeklyActivity.activeDays} of ${weeklyGoal} goal days this week. Keep going!`
              : 'A fresh page is waiting. Start with a few words today.'}
        </Text>
      </View>

      {/* Mood Breakdown */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Mood reflections</Text>
            <Text style={styles.cardSubtitle}>
              Emotional patterns across your journal
            </Text>
          </View>
          <Feather name="heart" size={17} color="#7655C9" />
        </View>

        {topMoods.length === 0 ? (
          <Text style={styles.insightEmptyText}>
            Add a mood when writing entries to uncover emotional trends here.
          </Text>
        ) : (
          <View style={styles.moodList}>
            {topMoods.map((m) => (
              <View key={m.id} style={styles.moodRow}>
                <View style={styles.moodRowHeader}>
                  <Text style={styles.moodRowLabel}>
                    {m.emoji} {m.label}
                  </Text>
                  <Text style={styles.moodRowCount}>
                    {m.count} ({m.percent}%)
                  </Text>
                </View>
                <View style={styles.moodBarTrack}>
                  <View
                    style={[
                      styles.moodBarFill,
                      { width: `${m.percent}%`, backgroundColor: m.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Top Tags / Themes */}
      {topTags.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Top themes</Text>
              <Text style={styles.cardSubtitle}>
                Tap a tag to filter matching memories
              </Text>
            </View>
            <Feather name="hash" size={17} color="#7655C9" />
          </View>

          <View style={styles.tagsWrap}>
            {topTags.map(({ tag, count }) => (
              <TouchableOpacity
                key={tag}
                style={styles.themeChip}
                activeOpacity={0.75}
                onPress={() => onSelectTag?.(tag)}
                disabled={!onSelectTag}
              >
                <Text style={styles.themeChipText}>#{tag}</Text>
                <View style={styles.themeCountBadge}>
                  <Text style={styles.themeCountText}>{count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.settingsHeader}>
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <Text style={styles.sectionSubtitle}>
          Manage your personal journal.
        </Text>
      </View>

      <View style={styles.settingsCard}>
        <SettingRow
          icon="user"
          title="Edit profile & bio"
          description={`${userName || 'Author'} · Tap to update name or quote`}
          iconStyle={styles.purpleIcon}
          onPress={openEditProfileModal}
        />

        <View style={styles.settingDivider} />

        <SettingRow
          icon="target"
          title="Weekly writing goal"
          description={`${weeklyGoal} days per week · Tap to switch (3 / 5 / 7)`}
          iconStyle={styles.orangeIcon}
          onPress={handleCycleWeeklyGoal}
        />

        <View style={styles.settingDivider} />

        <SettingRow
          icon="star"
          title="Favorite memories"
          description={
            favoriteEntries.length === 0
              ? 'No starred memories yet'
              : `Revisit ${favoriteEntries.length} starred ${
                  favoriteEntries.length === 1 ? 'entry' : 'entries'
                }`
          }
          iconStyle={styles.greenIcon}
          onPress={() => setIsFavoritesModalVisible(true)}
        />

        <View style={styles.settingDivider} />

        <SettingRow
          icon="share"
          title="Export journal"
          description="Share or back up your entries as readable text"
          iconStyle={styles.blueIcon}
          onPress={handleExportJournal}
        />

        {onSyncAllToFirebase ? (
          <>
            <View style={styles.settingDivider} />
            <SettingRow
              icon="cloud"
              title="Sync to Firebase"
              description={`Store all ${stats.totalEntries} entries safely in the cloud`}
              iconStyle={styles.blueIcon}
              onPress={onSyncAllToFirebase}
            />
          </>
        ) : null}

        <View style={styles.settingDivider} />

        <SettingRow
          icon="trash-2"
          title="Clear all entries"
          description="Clear all journal reflections for a clean slate"
          iconStyle={styles.redIcon}
          danger
          onPress={handleClearData}
        />

        <View style={styles.settingDivider} />

        <SettingRow
          icon="log-out"
          title="Sign out"
          description="Sign out of your journal"
          iconStyle={styles.redIcon}
          danger
          onPress={handleLogout}
        />
      </View>

      {/* Return Button */}
      <TouchableOpacity
        style={styles.returnButton}
        activeOpacity={0.8}
        onPress={onReturnToJournal}
      >
        <Feather name="book-open" size={17} color="#FFFFFF" />
        <Text style={styles.returnButtonText}>Return to Journal</Text>
      </TouchableOpacity>

      <Text style={styles.footerBrand}>
        INNERSPACE · YOUR STORY, YOUR SPACE
      </Text>

      {/* CROSS-PLATFORM EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PERSONALIZE</Text>
                <Text style={styles.modalTitle}>Edit Author Profile</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#667085" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name..."
              placeholderTextColor="#A59BB5"
              autoFocus
            />

            <Text style={styles.inputLabel}>Personal Quote / Subtitle</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              value={draftSubtitle}
              onChangeText={setDraftSubtitle}
              placeholder="A quiet motto for your journal..."
              placeholderTextColor="#A59BB5"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.presetsLabel}>Quick inspirations:</Text>
            <View style={styles.presetsWrap}>
              {BIO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => setDraftSubtitle(preset)}
                >
                  <Text style={styles.presetChipText} numberOfLines={1}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
              >
                <Feather
                  name="check"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAVORITE MEMORIES MODAL */}
      <Modal
        visible={isFavoritesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFavoritesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>STARRED STORIES</Text>
                <Text style={styles.modalTitle}>Favorite Memories</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFavoritesModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#667085" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              {favoriteEntries.length === 0 ? (
                <View style={styles.emptyFavBox}>
                  <Feather name="star" size={28} color="#B8A4E9" />
                  <Text style={styles.emptyFavTitle}>No favorites yet</Text>
                  <Text style={styles.emptyFavSub}>
                    Tap the star icon on any journal card to keep your most treasured memories close here.
                  </Text>
                </View>
              ) : (
                favoriteEntries.map((entry, idx) => {
                  const preview = cleanEntryPreview(entry.body);
                  const moodEmoji = entry.mood
                    ? MOOD_META[entry.mood.toLowerCase()]?.emoji || ''
                    : '';

                  return (
                    <TouchableOpacity
                      key={entry.id || `fav-${idx}`}
                      style={styles.favCard}
                      activeOpacity={0.75}
                      onPress={() => {
                        setIsFavoritesModalVisible(false);
                        onOpenEntry?.(entry);
                      }}
                      disabled={!onOpenEntry}
                    >
                      <View style={styles.favCardTop}>
                        <Text style={styles.favDate}>
                          {typeof entry.date === 'string' && entry.date
                            ? entry.date
                            : getEntryDateKey(entry)}
                        </Text>
                        <Text style={styles.favMood}>{moodEmoji} ★</Text>
                      </View>
                      <Text style={styles.favTitle} numberOfLines={1}>
                        {entry.titleEmoji ? `${entry.titleEmoji} ` : ''}
                        {entry.title || 'Untitled memory'}
                      </Text>
                      {preview ? (
                        <Text style={styles.favPreview} numberOfLines={2}>
                          {preview}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Reusable analytics metric
type MetricCardProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string | number;
  label: string;
  description: string;
  iconStyle: object;
  iconColor?: string;
  onPress?: () => void;
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  description,
  iconStyle,
  iconColor = '#7655C9',
  onPress,
}) => (
  <TouchableOpacity
    style={styles.metricCard}
    activeOpacity={onPress ? 0.75 : 1}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.metricIcon, iconStyle]}>
      <Feather name={icon} size={18} color={iconColor} />
    </View>

    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricDescription}>{description}</Text>
  </TouchableOpacity>
);

// Reusable settings row
type SettingRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
  iconStyle: object;
  danger?: boolean;
  onPress: () => void;
};

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  iconStyle,
  danger,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, iconStyle]}>
      <Feather
        name={icon}
        size={17}
        color={danger ? '#D65B63' : '#7655C9'}
      />
    </View>

    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.dangerText]}>
        {title}
      </Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>

    <Feather name="chevron-right" size={18} color="#A59BB5" />
  </TouchableOpacity>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FC',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#927AB9',
    marginBottom: 7,
    fontWeight: '700',
  },
  playfairFont: {
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  headerTitle: {
    fontSize: 28,
    color: '#292238',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#92899F',
    marginTop: 5,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0ECF5',
    marginBottom: 30,
  },
  authorTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#7655C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  identity: {
    flex: 1,
    marginLeft: 14,
  },
  authorName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#30283E',
  },
  email: {
    fontSize: 12,
    color: '#9990A5',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F2EFF9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 7,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7655C9',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7655C9',
  },
  editIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F4F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECF4',
    marginVertical: 17,
  },
  quote: {
    fontSize: 13,
    color: '#837A91',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  authorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 22,
  },
  authorStat: {
    flex: 1,
    alignItems: 'center',
  },
  authorStatValue: {
    fontSize: 23,
    fontWeight: '700',
    color: '#30283E',
  },
  authorStatLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: '#A49AAD',
    fontWeight: '700',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#EEEAF3',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#30283E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9991A5',
    marginTop: 5,
  },
  analyticsIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1EDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0ECF5',
    marginBottom: 14,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#30283E',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#A098AA',
    marginTop: 5,
  },
  weeklyBadge: {
    backgroundColor: '#F3EFFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7655C9',
  },
  weeklyLabel: {
    fontSize: 8,
    color: '#8E7AB7',
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  selectedDayBanner: {
    marginTop: 12,
    backgroundColor: '#F8F5FD',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  selectedDayBannerText: {
    fontSize: 11,
    color: '#6E6480',
  },
  selectedDayBannerCount: {
    fontWeight: '700',
    color: '#7655C9',
  },
  chart: {
    height: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartValue: {
    height: 18,
    fontSize: 10,
    color: '#8872B6',
    fontWeight: '700',
  },
  chartTrack: {
    height: 105,
    width: 19,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 19,
    borderRadius: 8,
    minHeight: 6,
  },
  chartDay: {
    fontSize: 10,
    color: '#A49BAD',
    marginTop: 9,
  },
  todayLabel: {
    color: '#7655C9',
    fontWeight: '700',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1EDF5',
    paddingTop: 13,
    marginTop: 13,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7655C9',
    marginRight: 7,
  },
  footerText: {
    fontSize: 10,
    color: '#958CA2',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0ECF5',
    padding: 15,
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purpleIcon: {
    backgroundColor: '#F1EDFA',
  },
  orangeIcon: {
    backgroundColor: '#FFF3E8',
  },
  greenIcon: {
    backgroundColor: '#EAF6F0',
  },
  blueIcon: {
    backgroundColor: '#EBF3FC',
  },
  redIcon: {
    backgroundColor: '#FCEDEE',
  },
  metricValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#30283E',
    marginTop: 13,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#51485F',
    marginTop: 4,
  },
  metricDescription: {
    fontSize: 10,
    color: '#A29AAA',
    marginTop: 5,
  },
  consistencyCard: {
    backgroundColor: '#30283E',
    borderRadius: 20,
    padding: 19,
    marginBottom: 16,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  consistencySubtitle: {
    fontSize: 11,
    color: '#BDB3CC',
    marginTop: 5,
  },
  goalPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#483C5C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalPillText: {
    color: '#E6DCFF',
    fontSize: 11,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 25,
    fontWeight: '700',
    color: '#D6C4FF',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#51465F',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 18,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#BDA5F5',
    borderRadius: 10,
  },
  consistencyFooter: {
    fontSize: 11,
    color: '#C7BED4',
    marginTop: 13,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0ECF5',
    marginBottom: 16,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  insightEmptyText: {
    fontSize: 12,
    color: '#9990A5',
    lineHeight: 18,
  },
  moodList: {
    gap: 11,
  },
  moodRow: {
    gap: 5,
  },
  moodRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#30283E',
  },
  moodRowCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B819A',
  },
  moodBarTrack: {
    height: 7,
    backgroundColor: '#F2EEF8',
    borderRadius: 6,
    overflow: 'hidden',
  },
  moodBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F0FA',
    borderRadius: 14,
    paddingLeft: 11,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E47A3',
  },
  themeCountBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7655C9',
  },
  settingsHeader: {
    marginTop: 12,
    marginBottom: 15,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F0ECF5',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 13,
  },
  settingTitle: {
    fontSize: 13,
    color: '#40374D',
    fontWeight: '700',
  },
  dangerText: {
    color: '#D65B63',
  },
  settingDescription: {
    fontSize: 11,
    color: '#A098AA',
    marginTop: 4,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1EDF5',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7655C9',
    borderRadius: 15,
    paddingVertical: 16,
    marginTop: 24,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 9,
  },
  footerBrand: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#B0A8B9',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyAnalyticsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5FD',
    borderWidth: 1,
    borderColor: '#ECE3FA',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
    gap: 10,
  },
  emptyAnalyticsText: {
    flex: 1,
    fontSize: 12,
    color: '#7655C9',
    lineHeight: 18,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 20, 36, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#7655C9',
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#30283E',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F4F0FA',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F465E',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#EAE4F3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#30283E',
  },
  modalTextarea: {
    height: 68,
    textAlignVertical: 'top',
  },
  presetsLabel: {
    fontSize: 11,
    color: '#92899F',
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  presetsWrap: {
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#F5F2FB',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  presetChipText: {
    fontSize: 11,
    color: '#674CB0',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F2EFF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C536D',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#7655C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyFavBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyFavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#30283E',
    marginTop: 10,
  },
  emptyFavSub: {
    fontSize: 12,
    color: '#92899F',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  favCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEBF7',
  },
  favCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  favDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8D82A0',
  },
  favMood: {
    fontSize: 12,
    color: '#D49B38',
  },
  favTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#30283E',
  },
  favPreview: {
    fontSize: 12,
    color: '#736A82',
    marginTop: 4,
    lineHeight: 17,
  },
});
