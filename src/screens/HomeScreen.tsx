import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';

import { MonthSectionHeader } from '../components/EntriesHeader';
import { JournalCard } from '../components/JournalCard';
import { CardDetailModal } from '../components/CardDetailModal';
import { BottomNavBar } from '../components/BottomNavBar';
import { JournalEntry, DisplayedJournalSection } from '../types';
import { NewEntryScreen } from './NewEntryScreen';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addEntry,
  updateEntry,
  deleteEntry,
  toggleFavoriteEntry,
  toggleSortDescending,
  toggleSectionCollapse,
  setSearchQuery,
  setSelectedMoodFilter,
  setSelectedTagFilter,
  clearFilters,
  resetToInitialData,
  setEntries,
  selectDisplayedSections,
  selectSortDescending,
  selectCollapsedSections,
  selectSearchQuery,
  selectMoodFilter,
  selectTagFilter,
  selectJournalStats,
  selectIsLoadingEntries,
} from '../store/slices/journalSlice';
import {
  setActiveTab,
  openNewEntryModal,
  openEditEntryModal,
  closeNewEntryModal,
  setSelectedEntryDetail,
  toggleSearchBar,
  selectActiveTab,
  selectIsNewEntryOpen,
  selectEditingEntry,
  selectNewEntryInitialDate,
  selectSelectedEntryDetail,
  selectIsSearchBarVisible,
} from '../store/slices/uiSlice';
import {
  updateProfile,
  setDeviceInfo,
  logout,
  selectUserId,
  selectUserName,
  selectUserEmail,
  selectUserSubtitle,
  selectUserStreakDays,
  selectUserDeviceInfo,
} from '../store/slices/userSlice';
import {
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  toggleFavoriteJournalEntry,
  getJournalEntries,
  resetUserEntriesToDemo,
  storeAllEntriesToFirestore,
} from '../services/journalFirestoreService';
import {
  updateUserProfile,
  updateUserDeviceInfo,
} from '../services/authService';
import { collectUserDeviceInfo } from '../services/deviceInfoService';
import { computeJournalingStreaks } from '../utils/entryDates';
import UsersMapScreen from './UsersMapScreen';
import CalendarScreen, { CALENDAR_SCREEN_BG } from './CalendarScreen';
import ProfileScreen from './ProfileScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QUICK_MOOD_FILTERS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'peaceful', emoji: '😌', label: 'Calm' },
  { id: 'excited', emoji: '🥳', label: 'Excited' },
  { id: 'inspired', emoji: '✨', label: 'Inspired' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful' },
];

export interface HomeScreenProps {
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();

  // Redux state selectors
  const displayedSections = useAppSelector(selectDisplayedSections);
  const sortDescending = useAppSelector(selectSortDescending);
  const collapsedSections = useAppSelector(selectCollapsedSections);
  const searchQuery = useAppSelector(selectSearchQuery);
  const selectedMoodFilter = useAppSelector(selectMoodFilter);
  const selectedTagFilter = useAppSelector(selectTagFilter);
  const activeTab = useAppSelector(selectActiveTab);
  const isNewEntryOpen = useAppSelector(selectIsNewEntryOpen);
  const editingEntry = useAppSelector(selectEditingEntry);
  const newEntryInitialDateKey = useAppSelector(selectNewEntryInitialDate);
  const selectedEntryDetail = useAppSelector(selectSelectedEntryDetail);
  const sections = useAppSelector((state) => state.journal.sections);
  const newEntryInitialDate = React.useMemo(() => {
    if (!newEntryInitialDateKey) return undefined;
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (newEntryInitialDateKey === todayKey) {
      return now;
    }
    const parsed = new Date(`${newEntryInitialDateKey}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [newEntryInitialDateKey]);
  const allCalendarEntries = React.useMemo(() => {
    return sections.flatMap((section) =>
      section.data.map((entry) => ({
        id: entry.id,
        date: entry.date,
        timestamp: entry.timestamp,
        year: section.year,
        title: entry.title,
        titleEmoji: entry.titleEmoji,
        body: entry.body,
        mood: entry.mood,
        weather: entry.weather,
        tags: entry.tags,
        isFavorite: entry.isFavorite,
        backgroundColor: entry.backgroundColor,
      }))
    );
  }, [sections]);

  // Live reference to ensure modal reflects any instant updates/deletions
  const liveViewingEntry = React.useMemo(() => {
    if (!selectedEntryDetail) return null;
    for (const section of sections) {
      const found = section.data.find((e) => e.id === selectedEntryDetail.id);
      if (found) return found;
    }
    return selectedEntryDetail;
  }, [sections, selectedEntryDetail]);
  const isSearchBarVisible = useAppSelector(selectIsSearchBarVisible);
  const userName = useAppSelector(selectUserName);
  const userEmail = useAppSelector(selectUserEmail);
  const userSubtitle = useAppSelector(selectUserSubtitle);
  const userStreakDays = useAppSelector(selectUserStreakDays);
  const deviceInfo = useAppSelector(selectUserDeviceInfo);
  const stats = useAppSelector(selectJournalStats);
  const liveStreakDays = React.useMemo(() => {
    if (allCalendarEntries.length === 0) return userStreakDays;
    return computeJournalingStreaks(allCalendarEntries).currentStreak;
  }, [allCalendarEntries, userStreakDays]);

  // const entryDate = entry.date ? new Date(entry.date) : new Date(NaN);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  const animateNext = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  };

  const userId = useAppSelector(selectUserId);
  const isLoadingEntries = useAppSelector(selectIsLoadingEntries);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single click: open the card completely with full text & details inside
  const handleCardPress = (entry: JournalEntry) => {
    dispatch(setSelectedEntryDetail(entry));
  };

  // Pull-to-refresh: fetches latest entries from Firestore
  const handleRefresh = async () => {
    if (userId && userId !== 'demo-local-user') {
      setIsRefreshing(true);
      try {
        const latest = await getJournalEntries(userId);
        dispatch(setEntries(latest));
      } catch (err) {
        console.warn('Error refreshing entries from Firestore:', err);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Sync / Store all entries to Firebase Firestore
  const handleSyncAllToFirebase = async () => {
    if (!userId || userId === 'demo-local-user') {
      Alert.alert(
        'Cloud Sync Required',
        'Please sign in with your Firebase account to store your entries in the cloud.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsRefreshing(true);
      const allEntries = sections.flatMap((sec) => sec.data);
      const count = await storeAllEntriesToFirestore(userId, allEntries);
      Alert.alert(
        'Firebase Synced!',
        `Successfully stored all ${count} entries to Firebase Firestore.`,
        [{ text: 'Great' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Sync Notice',
        err?.message || 'Unable to store entries to Firebase.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle Favorite: local Redux optimistic update + Firestore sync
  const handleToggleFavorite = (entry: JournalEntry) => {
    animateNext();
    dispatch(toggleFavoriteEntry(entry.id));
    if (userId && userId !== 'demo-local-user') {
      toggleFavoriteJournalEntry(userId, entry.id, !entry.isFavorite).catch(
        (err) => console.warn('Error syncing favorite to Firestore:', err)
      );
    }
  };

  // Delete Entry: confirmation prompt + Redux removal + Firestore deletion
  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry?',
      'Are you sure you want to permanently delete this memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            animateNext();
            dispatch(deleteEntry({ id: entry.id }));
            if (selectedEntryDetail?.id === entry.id) {
              dispatch(setSelectedEntryDetail(null));
            }
            if (userId && userId !== 'demo-local-user') {
              deleteJournalEntry(userId, entry.id).catch((err) =>
                console.warn('Error deleting entry from Firestore:', err)
              );
            }
          },
        },
      ]
    );
  };

  // Long press: display existing entry action options (Favorite, Edit, Delete)
  const handleCardLongPress = (entry: JournalEntry) => {
    Alert.alert(
      entry.title || 'Journal Entry',
      'Choose an action for this entry:',
      [
        {
          text: entry.isFavorite ? '★ Remove Favorite' : '☆ Mark Favorite',
          onPress: () => handleToggleFavorite(entry),
        },
        {
          text: '✎ Edit Entry',
          onPress: () => {
            dispatch(openEditEntryModal(entry));
          },
        },
        {
          text: '🗑 Delete Entry',
          style: 'destructive',
          onPress: () => handleDeleteEntry(entry),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSortPress = () => {
    animateNext();
    dispatch(toggleSortDescending());
  };

  const toggleSection = (sectionId: string) => {
    animateNext();
    dispatch(toggleSectionCollapse(sectionId));
  };

  const handleAddPress = () => {
    dispatch(openNewEntryModal());
  };

  const handleSaveEntry = (savedEntry: JournalEntry) => {
    animateNext();
    if (editingEntry) {
      dispatch(updateEntry(savedEntry));
      if (userId && userId !== 'demo-local-user') {
        updateJournalEntry(userId, savedEntry).catch((err) =>
          console.warn('Error updating entry in Firestore:', err)
        );
      }
    } else {
      dispatch(addEntry(savedEntry));
      if (userId && userId !== 'demo-local-user') {
        addJournalEntry(userId, savedEntry).catch((err) =>
          console.warn('Error adding entry to Firestore:', err)
        );
      }
    }
    dispatch(closeNewEntryModal());
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedMoodFilter || selectedTagFilter
  );

  const totalMatchingEntries = displayedSections.reduce(
    (acc, s) => acc + s.totalCount,
    0
  );

  const handleUpdateProfileDetails = ({
    name,
    subtitle,
  }: {
    name?: string;
    subtitle?: string;
  }) => {
    const updates: { name?: string; subtitle?: string } = {};
    if (name !== undefined) updates.name = name;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    dispatch(updateProfile(updates));
    if (userId && userId !== 'demo-local-user') {
      updateUserProfile(userId, updates).catch((err) =>
        console.warn('Error updating profile in Firestore:', err)
      );
    }
  };

  const handleRefreshDeviceInfo = async (requestCellularPermission = false) => {
    try {
      const info = await collectUserDeviceInfo({ requestCellularPermission });
      dispatch(setDeviceInfo(info));
      if (userId && userId !== 'demo-local-user') {
        await updateUserDeviceInfo(userId, info).catch((err) =>
          console.warn('Error syncing device info to Firestore:', err)
        );
      }
    } catch (err) {
      console.warn('Error refreshing device info:', err);
    }
  };

  const renderProfileView = () => (
    <ProfileScreen
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      userSubtitle={userSubtitle}
      userStreakDays={liveStreakDays}
      deviceInfo={deviceInfo}
      stats={stats}
      entries={allCalendarEntries}
      fontsLoaded={fontsLoaded}
      onEditName={(name) => handleUpdateProfileDetails({ name })}
      onUpdateProfile={({ name, subtitle }) =>
        handleUpdateProfileDetails({ name, subtitle })
      }
      onRefreshDeviceInfo={handleRefreshDeviceInfo}
      onSelectTag={(tag) => {
        animateNext();
        dispatch(clearFilters());
        dispatch(setSelectedTagFilter(tag));
        dispatch(setActiveTab('home'));
      }}
      onOpenEntry={(profileEntry) => {
        if (!profileEntry.id) return;
        const fullEntry = sections
          .flatMap((s) => s.data)
          .find((e) => e.id === profileEntry.id);
        if (fullEntry) {
          dispatch(setSelectedEntryDetail(fullEntry));
        }
      }}
      onResetData={() => {
        animateNext();
        if (userId && userId !== 'demo-local-user') {
          resetUserEntriesToDemo(userId).catch((err) =>
            console.warn('Error resetting entries in Firestore:', err)
          );
        }
        dispatch(resetToInitialData());
        dispatch(setActiveTab('home'));
      }}
      onSyncAllToFirebase={handleSyncAllToFirebase}
      onLogout={() => {
        if (onLogout) {
          onLogout();
        } else {
          dispatch(logout());
        }
      }}
      onReturnToJournal={() => {
        dispatch(setActiveTab('home'));
      }}
    />
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        activeTab === 'calendar' && { backgroundColor: CALENDAR_SCREEN_BG },
        activeTab === 'profile' && { backgroundColor: '#FAF8FC' },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style="dark" />

      <View
        style={[
          styles.container,
          activeTab === 'calendar' && { backgroundColor: CALENDAR_SCREEN_BG },
          activeTab === 'profile' && { backgroundColor: '#FAF8FC' },
        ]}
      >
        {/* Render Active View based on activeTab */}
        {/* {activeTab === 'users' && renderAnalyticsView()} */}
        {activeTab === 'users' && (
          <UsersMapScreen
            onOpenEntry={(entry) => dispatch(setSelectedEntryDetail(entry))}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarScreen
            entries={allCalendarEntries}
            onOpenEntry={(calEntry) => {
              const fullEntry = sections
                .flatMap((s) => s.data)
                .find((e) => e.id === calEntry.id);
              if (fullEntry) {
                dispatch(setSelectedEntryDetail(fullEntry));
              }
            }}
            onAddEntry={(dateKey) => {
              dispatch(openNewEntryModal(dateKey));
            }}
          />
        )}
        {activeTab === 'profile' && renderProfileView()}

        {/* Default Home Journal Feed */}
        {activeTab === 'home' && (
          <SectionList<JournalEntry, DisplayedJournalSection>
            sections={displayedSections}
            keyExtractor={(item) => item.id}
            extraData={collapsedSections}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <JournalCard
                  entry={item}
                  fontsLoaded={fontsLoaded}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleCardLongPress(item)}
                />
              </View>
            )}
            renderSectionHeader={({ section }) => (
              <MonthSectionHeader
                month={section.month}
                year={section.year}
                entryCount={section.totalCount}
                isExpanded={section.isExpanded}
                onToggle={() => toggleSection(section.id)}
              />
            )}
            ListHeaderComponent={
              <View style={styles.dashboardHeader}>
                {/* Premium workspace header */}
                <View style={styles.dashboardTopRow}>
                  <View style={styles.dashboardBrand}>
                    <View style={styles.dashboardBrandMark}>
                      <MaterialCommunityIcons name="book-heart-outline" size={19} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.dashboardBrandName}>INNERSPACE</Text>
                      <Text style={styles.dashboardBrandCaption}>YOUR PERSONAL JOURNAL</Text>
                    </View>
                  </View>

                  <View style={styles.dashboardTopActions}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleSyncAllToFirebase}
                      style={styles.dashboardSyncButton}
                      accessibilityRole="button"
                      accessibilityLabel="Store all entries to Firebase"
                    >
                      <Ionicons name="cloud-upload-outline" size={17} color="#7663A8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => dispatch(setActiveTab('profile'))}
                      style={styles.dashboardAvatarButton}
                      accessibilityRole="button"
                      accessibilityLabel="Open profile"
                    >
                      <Text style={styles.dashboardAvatarText}>
                        {userName ? userName.charAt(0).toUpperCase() : 'W'}
                      </Text>
                      <View style={styles.dashboardOnlineDot} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Welcome panel */}
                <View style={styles.dashboardWelcome}>
                  <View style={styles.dashboardWelcomeCopy}>
                    <Text style={styles.dashboardEyebrow}>YOUR SPACE, YOUR STORY</Text>
                    <Text style={styles.dashboardGreeting}>
                      {userName ? `Welcome back, ${userName}.` : 'Welcome to InnerSpace.'}
                    </Text>
                    <Text style={styles.dashboardSubtitle}>
                      {userSubtitle || 'A quiet sanctuary for your daily reflections.'}
                    </Text>
                  </View>
                  <View style={styles.dashboardStreak}>
                    <Feather name="zap" size={15} color="#B7791F" />
                    <Text style={styles.dashboardStreakValue}>{liveStreakDays}</Text>
                    <Text style={styles.dashboardStreakLabel}>DAY STREAK</Text>
                  </View>
                </View>

                {/* Activity overview */}
                <View style={styles.dashboardMetrics}>
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.dashboardMetricValue}>{stats.totalEntries}</Text>
                    <Text style={styles.dashboardMetricLabel}>ENTRIES</Text>
                  </View>
                  <View style={styles.dashboardMetricDivider} />
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.dashboardMetricValue}>{stats.totalSections}</Text>
                    <Text style={styles.dashboardMetricLabel}>MONTHS</Text>
                  </View>
                  <View style={styles.dashboardMetricDivider} />
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.dashboardMetricValue}>{stats.totalPolaroids}</Text>
                    <Text style={styles.dashboardMetricLabel}>MOMENTS</Text>
                  </View>
                </View>

                {/* Primary action */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleAddPress}
                  style={styles.dashboardComposeButton}
                >
                  <View style={styles.dashboardComposeIcon}>
                    <Feather name="edit-3" size={17} color="#FFFFFF" />
                  </View>
                  <View style={styles.dashboardComposeCopy}>
                    <Text style={styles.dashboardComposeTitle}>Capture a moment</Text>
                    <Text style={styles.dashboardComposeSubtitle}>Write down what&apos;s on your mind</Text>
                  </View>
                  <Feather name="arrow-up-right" size={19} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Journal feed toolbar */}
                {stats.totalEntries > 0 ? (
                  <View style={styles.dashboardFeedHeader}>
                    <View>
                      <Text style={styles.dashboardFeedEyebrow}>YOUR COLLECTION</Text>
                      <Text style={styles.dashboardFeedTitle}>Journal entries</Text>
                      <Text style={styles.dashboardFeedSubtitle}>
                        {totalMatchingEntries} {totalMatchingEntries === 1 ? 'entry' : 'entries'} in your journal
                      </Text>
                    </View>
                    <View style={styles.dashboardFeedActions}>
                      <TouchableOpacity
                        onPress={handleSortPress}
                        activeOpacity={0.7}
                        style={styles.dashboardIconButton}
                        accessibilityRole="button"
                        accessibilityLabel={`Sort entries, currently ${sortDescending ? 'newest first' : 'oldest first'}`}
                      >
                        <Ionicons name="swap-vertical" size={17} color="#344054" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          animateNext();
                          dispatch(toggleSearchBar());
                        }}
                        activeOpacity={0.7}
                        style={[
                          styles.dashboardIconButton,
                          (isSearchBarVisible || hasActiveFilters) && styles.dashboardIconButtonActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Search and filter entries"
                      >
                        <Feather name="search" size={17} color="#344054" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Search and filters */}
                {isSearchBarVisible || hasActiveFilters ? (
                  <View style={styles.dashboardFilterPanel}>
                    <View style={styles.dashboardSearchField}>
                      <Feather name="search" size={16} color="#98A2B3" />
                      <TextInput
                        style={styles.dashboardSearchInput}
                        placeholder="Search thoughts, memories, tags..."
                        placeholderTextColor="#98A2B3"
                        value={searchQuery}
                        onChangeText={(text) => dispatch(setSearchQuery(text))}
                        returnKeyType="search"
                        autoCapitalize="none"
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => dispatch(setSearchQuery(''))}
                          style={styles.clearSearchIcon}
                        >
                          <Feather name="x-circle" size={17} color="#98A2B3" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.dashboardFilterLabel}>FILTER BY MOOD</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.moodChipsList}>
                        {QUICK_MOOD_FILTERS.map((m) => {
                          const isSelected = selectedMoodFilter === m.id;
                          return (
                            <TouchableOpacity
                              key={m.id}
                              activeOpacity={0.75}
                              onPress={() => {
                                animateNext();
                                dispatch(setSelectedMoodFilter(isSelected ? null : m.id));
                              }}
                              style={[
                                styles.dashboardMoodChip,
                                isSelected && styles.dashboardMoodChipSelected,
                              ]}
                            >
                              <Text style={styles.quickMoodEmoji}>{m.emoji}</Text>
                              <Text style={[
                                styles.dashboardMoodText,
                                isSelected && styles.dashboardMoodTextSelected,
                              ]}>
                                {m.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>

                    {hasActiveFilters && (
                      <View style={styles.activeFilterStatusRow}>
                        <Text style={styles.activeFilterStatusText}>
                          {selectedTagFilter ? `#${selectedTagFilter} · ` : ''}
                          Showing {totalMatchingEntries} {totalMatchingEntries === 1 ? 'match' : 'matches'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            animateNext();
                            dispatch(clearFilters());
                          }}
                          style={styles.clearAllFiltersBtn}
                        >
                          <Text style={styles.clearAllFiltersText}>Clear filters</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              isLoadingEntries ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#7663A8" />
                  <Text style={styles.emptyTitle}>Syncing with InnerSpace...</Text>
                  <Text style={styles.emptyDescription}>
                    Loading your reflections and moments from the cloud.
                  </Text>
                </View>
              ) : hasActiveFilters ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.filterEmptyIconBadge}>
                    <Ionicons name="search-outline" size={28} color="#7663A8" />
                  </View>
                  <Text style={styles.emptyTitle}>No Matching Reflections</Text>
                  <Text style={styles.emptyDescription}>
                    No journal reflections match your current search and filters.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => {
                      animateNext();
                      dispatch(clearFilters());
                    }}
                  >
                    <Text style={styles.emptyActionText}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.sereneEmptyCard}>
                  {/* Decorative illustration */}
                  <View style={styles.sereneIllustration}>
                    <View style={styles.sereneCircleOuter} />
                    <View style={styles.sereneCircleInner} />
                    <View style={styles.sereneIconCircle}>
                      <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={38}
                        color="#7663A8"
                      />
                    </View>
                    <View style={styles.sereneSparkleTop}>
                      <Ionicons name="sparkles" size={17} color="#BFA3DC" />
                    </View>
                    <View style={styles.sereneLeafBottom}>
                      <Ionicons name="leaf-outline" size={18} color="#9FC4B0" />
                    </View>
                  </View>

                  <Text style={styles.sereneEyebrow}>YOUR PRIVATE SPACE</Text>
                  <Text style={styles.sereneTitle}>A Blank Page Awaits</Text>
                  <Text style={styles.sereneDescription}>
                    Your journal is quiet and ready. Take a moment to capture what matters today &mdash; a memory, a feeling, or a quiet realization.
                  </Text>

                  {/* Gentle prompts */}
                  <View style={styles.promptsContainer}>
                    <Text style={styles.promptsLabel}>NEED INSPIRATION?</Text>
                    <View style={styles.promptsList}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.promptChip}
                        onPress={handleAddPress}
                      >
                        <Text style={styles.promptChipEmoji}>✨</Text>
                        <Text style={styles.promptChipText}>What made you smile today?</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.promptChip}
                        onPress={handleAddPress}
                      >
                        <Text style={styles.promptChipEmoji}>☕</Text>
                        <Text style={styles.promptChipText}>A quiet moment I loved</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.promptChip}
                        onPress={handleAddPress}
                      >
                        <Text style={styles.promptChipEmoji}>🌿</Text>
                        <Text style={styles.promptChipText}>Something I am grateful for</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Primary CTA Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.serenePrimaryBtn}
                    onPress={handleAddPress}
                  >
                    <Feather name="edit-3" size={17} color="#FFFFFF" />
                    <Text style={styles.serenePrimaryBtnText}>Write Your First Reflection</Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )
            }
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#7663A8"
                colors={['#7663A8']}
              />
            }
          />
        )}

        {/* Floating Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            animateNext();
            dispatch(setActiveTab(tab));
          }}
          onPressAdd={handleAddPress}
        />

        {/* New / Edit Entry Modal triggered by PLUS button or Card Edit */}
        <Modal
          visible={isNewEntryOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            dispatch(closeNewEntryModal());
          }}
        >
          {isNewEntryOpen && (
            <NewEntryScreen
              key={editingEntry?.id || newEntryInitialDateKey || 'new-entry'}
              entryToEdit={editingEntry}
              initialDate={newEntryInitialDate}
              onClose={() => {
                dispatch(closeNewEntryModal());
              }}
              onSave={handleSaveEntry}
              fontsLoaded={fontsLoaded}
            />
          )}
        </Modal>

        {/* Full Card Detail Modal triggered by clicking/tapping any card */}
        <CardDetailModal
          entry={liveViewingEntry}
          visible={Boolean(selectedEntryDetail)}
          onClose={() => {
            dispatch(setSelectedEntryDetail(null));
          }}
          onToggleFavorite={handleToggleFavorite}
          onEdit={(entry) => {
            dispatch(setSelectedEntryDetail(null));
            dispatch(openEditEntryModal(entry));
          }}
          onDelete={handleDeleteEntry}
          fontsLoaded={fontsLoaded}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  searchFilterContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6E1EE',
    height: 42,
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1335',
    height: '100%',
  },
  clearSearchIcon: {
    padding: 4,
  },
  filterMoodsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#79718A',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodChipsList: {
    flexDirection: 'row',
    gap: 6,
  },
  quickMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  quickMoodChipSelected: {
    backgroundColor: '#F3ECFD',
    borderColor: '#6E3DE6',
  },
  quickMoodEmoji: {
    fontSize: 13,
  },
  quickMoodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#554C68',
  },
  quickMoodTextSelected: {
    color: '#6E3DE6',
  },
  activeFilterStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  activeFilterStatusText: {
    fontSize: 12.5,
    color: '#79718A',
    fontWeight: '500',
  },
  clearAllFiltersBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearAllFiltersText: {
    fontSize: 12.5,
    color: '#E56338',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#32234D',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13.5,
    color: '#79718A',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#6E3DE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  filterEmptyIconBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F1ECF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sereneEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 22,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE6F4',
    shadowColor: '#43296B',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sereneIllustration: {
    width: 120,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sereneCircleOuter: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F6F2FA',
  },
  sereneCircleInner: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#ECE3F4',
  },
  sereneIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#53347C',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sereneSparkleTop: {
    position: 'absolute',
    top: 4,
    right: 14,
  },
  sereneLeafBottom: {
    position: 'absolute',
    bottom: 6,
    left: 14,
  },
  sereneEyebrow: {
    color: '#7663A8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 7,
  },
  sereneTitle: {
    color: '#282136',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  sereneDescription: {
    color: '#716A7D',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 295,
    marginBottom: 20,
  },
  promptsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  promptsLabel: {
    color: '#9C94A7',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  promptsList: {
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8F6FB',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#ECE7F3',
    gap: 9,
  },
  promptChipEmoji: {
    fontSize: 15,
  },
  promptChipText: {
    color: '#423B4E',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  serenePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7663A8',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#53347C',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  serenePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabContentScroll: {
    flex: 1,
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  tabHeader: {
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1335',
    letterSpacing: -0.4,
  },
  tabSubtitle: {
    fontSize: 14.5,
    color: '#79718A',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1335',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#655B77',
    marginTop: 2,
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE6F5',
    marginBottom: 16,
  },
  sectionBlockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1335',
    marginBottom: 12,
  },
  moodPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  moodChipEmoji: {
    fontSize: 15,
  },
  moodChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#32234D',
  },
  moodChipCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6E3DE6',
  },
  tagsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 8,
  },
  tagCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B3F63',
  },
  tagBadge: {
    backgroundColor: '#6E3DE6',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyNote: {
    fontSize: 13,
    color: '#958DA5',
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: '#1C1335',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  archiveControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  archiveActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  archiveActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E3DE6',
  },
  archiveList: {
    gap: 10,
    marginBottom: 18,
  },
  archiveCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E1EE',
  },
  archiveCardLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  archiveCardMonth: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1335',
    letterSpacing: 0.5,
  },
  archiveCardYear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#79718A',
  },
  archiveCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveCardCount: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#79718A',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E1EE',
    marginBottom: 20,
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#6E3DE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileAvatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1335',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: '#898392',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#79718A',
    marginTop: 4,
    textAlign: 'center',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0ECF6',
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1335',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#79718A',
    fontWeight: '500',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E6E1EE',
  },
  profileActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6E1EE',
    marginBottom: 20,
  },
  profileActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1FA',
  },
  profileActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileActionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#2F2448',
  },
  usersSearchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A202C',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24, // Extra margin to account for lower offset card
  },
  userCardWrapper: {
    flex: 1,
    paddingHorizontal: 10
  },
  offsetUp: {
    marginTop: 0,
    marginBottom: 20,
  },
  offsetDown: {
    marginTop: 24,
    marginBottom: 0,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cardRelation: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Enterprise dashboard redesign
  dashboardHeader: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dashboardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 27,
  },
  dashboardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashboardBrandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#263B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardBrandName: {
    color: '#1D2939',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  dashboardBrandCaption: {
    color: '#98A2B3',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.15,
    marginTop: 3,
  },
  dashboardTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardSyncButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1ECF8',
    borderWidth: 1,
    borderColor: '#E2D9F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardAvatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8EEE9',
    borderWidth: 1,
    borderColor: '#D5DFD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardAvatarText: {
    color: '#263B35',
    fontSize: 16,
    fontWeight: '800',
  },
  dashboardOnlineDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    right: 0,
    bottom: 1,
    backgroundColor: '#4C9A70',
    borderWidth: 2,
    borderColor: '#FAFBF9',
  },
  dashboardWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  dashboardWelcomeCopy: {
    flex: 1,
    paddingRight: 10,
  },
  dashboardEyebrow: {
    color: '#718078',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.55,
    marginBottom: 8,
  },
  dashboardGreeting: {
    color: '#1D2939',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  dashboardSubtitle: {
    color: '#66736C',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 5,
  },
  dashboardStreak: {
    minWidth: 76,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: '#F4F0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardStreakValue: {
    color: '#624C22',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  dashboardStreakLabel: {
    color: '#927A4B',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  dashboardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    paddingVertical: 15,
    marginBottom: 16,
  },
  dashboardMetric: {
    flex: 1,
    alignItems: 'center',
  },
  dashboardMetricValue: {
    color: '#263B35',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dashboardMetricLabel: {
    color: '#8A968F',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  dashboardMetricDivider: {
    width: 1,
    height: 29,
    backgroundColor: '#E9EDE9',
  },
  dashboardComposeButton: {
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: '#263B35',
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 29,
  },
  dashboardComposeIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dashboardComposeCopy: {
    flex: 1,
  },
  dashboardComposeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dashboardComposeSubtitle: {
    color: '#C6D2CB',
    fontSize: 11,
    marginTop: 4,
  },
  dashboardFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dashboardFeedEyebrow: {
    color: '#87948C',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.45,
    marginBottom: 5,
  },
  dashboardFeedTitle: {
    color: '#1D2939',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.55,
  },
  dashboardFeedSubtitle: {
    color: '#89948D',
    fontSize: 11,
    marginTop: 4,
  },
  dashboardFeedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dashboardIconButton: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardIconButtonActive: {
    backgroundColor: '#EAF0EB',
    borderColor: '#B8C8BC',
  },
  dashboardFilterPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7ECE8',
    borderRadius: 14,
    padding: 13,
    marginBottom: 17,
  },
  dashboardSearchField: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7ECE8',
    borderRadius: 10,
    paddingHorizontal: 11,
    marginBottom: 14,
    backgroundColor: '#FBFCFB',
  },
  dashboardSearchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    color: '#263B35',
    fontSize: 13,
  },
  dashboardFilterLabel: {
    color: '#87948C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 9,
  },
  dashboardMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E7ECE8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
  },
  dashboardMoodChipSelected: {
    backgroundColor: '#EAF0EB',
    borderColor: '#8CA795',
  },
  dashboardMoodText: {
    color: '#58665E',
    fontSize: 11,
    fontWeight: '600',
  },
  dashboardMoodTextSelected: {
    color: '#263B35',
    fontWeight: '800',
  },
});