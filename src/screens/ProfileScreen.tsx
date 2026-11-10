
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ProfileJournalEntry = {
  id?: string;
  date?: string | number | Date;
};

type ProfileStats = {
  totalEntries: number;
  totalPolaroids: number;
};

type ProfileScreenProps = {
  userName: string;
  userEmail?: string;
  userSubtitle?: string;
  userStreakDays: number;
  stats: ProfileStats;
  entries: ProfileJournalEntry[];
  fontsLoaded?: boolean;

  onEditName: (name: string) => void;
  onResetData: () => void;
  onSyncAllToFirebase?: () => void;
  onLogout: () => void;
  onReturnToJournal: () => void;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName,
  userEmail,
  userSubtitle,
  userStreakDays,
  stats,
  entries = [],
  fontsLoaded = false,
  onEditName,
  onResetData,
  onSyncAllToFirebase,
  onLogout,
  onReturnToJournal,
}) => {
  // Weekly analytics
  const weeklyActivity = useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const today = new Date();

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));

      const count = safeEntries.filter((entry) => {
        // const entryDate = new Date(entry.date);
        const entryDate = entry.date ? new Date(entry.date) : new Date(NaN);

        return (
          !Number.isNaN(entryDate.getTime()) &&
          entryDate.getFullYear() === date.getFullYear() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getDate() === date.getDate()
        );
      }).length;

      return {
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
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

  const handleEditName = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Edit Name',
        'Enter your preferred name:',
        (text) => {
          if (text?.trim()) {
            onEditName(text.trim());
          }
        },
        'plain-text',
        userName
      );
    } else {
      Alert.alert(
        'Edit Name',
        'Name editing through the quick prompt is available on iOS.'
      );
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data?',
      'This will reset all sections and entries to the initial demo entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
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

        <View style={styles.headerIcon}>
          <Feather name="user" size={21} color="#7655C9" />
        </View>
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
            onPress={handleEditName}
          >
            <Feather name="edit-2" size={16} color="#7655C9" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.quote}>
          &ldquo;{userSubtitle || 'Every page holds a piece of your story.'}&rdquo;
        </Text>

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
              {userStreakDays}
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
              Entries created over the last 7 days
            </Text>
          </View>

          <View style={styles.weeklyBadge}>
            <Text style={styles.weeklyValue}>
              {weeklyActivity.total}
            </Text>
            <Text style={styles.weeklyLabel}>THIS WEEK</Text>
          </View>
        </View>

        <View style={styles.chart}>
          {weeklyActivity.days.map((day, index) => {
            const barHeight = Math.max(
              (day.count / weeklyActivity.max) * 100,
              day.count > 0 ? 12 : 4
            );

            return (
              <View key={`${day.label}-${index}`} style={styles.chartColumn}>
                <Text style={styles.chartValue}>
                  {day.count > 0 ? day.count : ''}
                </Text>

                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: day.isToday
                          ? '#7655C9'
                          : day.count > 0
                            ? '#B8A4E9'
                            : '#EEEAF5',
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.chartDay,
                    day.isToday && styles.todayLabel,
                  ]}
                >
                  {day.label}
                </Text>
              </View>
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
          value={stats.totalEntries}
          label="Total entries"
          description="Your written memories"
          iconStyle={styles.purpleIcon}
        />

        <MetricCard
          icon="zap"
          value={userStreakDays}
          label="Current streak"
          description="Consecutive journaling days"
          iconStyle={styles.orangeIcon}
        />

        <MetricCard
          icon="camera"
          value={stats.totalPolaroids}
          label="Captured moments"
          description="Photos in your journal"
          iconStyle={styles.greenIcon}
        />

        <MetricCard
          icon="calendar"
          value={`${weeklyActivity.activeDays}/7`}
          label="Active days"
          description="This week's consistency"
          iconStyle={styles.blueIcon}
        />
      </View>

      {/* Consistency */}
      <View style={styles.consistencyCard}>
        <View style={styles.consistencyHeader}>
          <View>
            <Text style={styles.consistencyTitle}>
              Your consistency
            </Text>
            <Text style={styles.consistencySubtitle}>
              Days you journaled this week
            </Text>
          </View>

          <Text style={styles.percentage}>
            {Math.round((weeklyActivity.activeDays / 7) * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(weeklyActivity.activeDays / 7) * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.consistencyFooter}>
          {weeklyActivity.activeDays === 7
            ? 'Amazing! You showed up every day this week.'
            : weeklyActivity.activeDays > 0
              ? `You've journaled on ${weeklyActivity.activeDays} of the last 7 days. Keep going!`
              : 'A fresh page is waiting. Start with a few words today.'}
        </Text>
      </View>

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
          title="Display name"
          description={userName}
          iconStyle={styles.purpleIcon}
          onPress={handleEditName}
        />

        {onSyncAllToFirebase ? (
          <>
            <View style={styles.settingDivider} />
            <SettingRow
              icon="cloud"
              title="Sync to Firebase"
              description="Store all journal entries in the cloud"
              iconStyle={styles.blueIcon}
              onPress={onSyncAllToFirebase}
            />
          </>
        ) : null}

        <View style={styles.settingDivider} />

        <SettingRow
          icon="refresh-cw"
          title="Reset demo data"
          description="Restore the initial journal entries"
          iconStyle={styles.orangeIcon}
          onPress={handleResetData}
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
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  description,
  iconStyle,
}) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, iconStyle]}>
      <Feather name={icon} size={18} color="#7655C9" />
    </View>

    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricDescription}>{description}</Text>
  </View>
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
  chart: {
    height: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
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
    minHeight: 4,
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
    marginBottom: 30,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: 20,
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
  settingsHeader: {
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
});
