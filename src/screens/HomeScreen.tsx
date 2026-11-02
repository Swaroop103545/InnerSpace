import React from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';

import { Header } from '../components/Header';
import { EntriesTopBar, MonthSectionHeader } from '../components/EntriesHeader';
import { JournalCard } from '../components/JournalCard';
import { CardDetailModal } from '../components/CardDetailModal';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
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
  expandAllSections,
  collapseAllSections,
  setSearchQuery,
  setSelectedMoodFilter,
  setSelectedTagFilter,
  clearFilters,
  resetToInitialData,
  selectDisplayedSections,
  selectSortDescending,
  selectCollapsedSections,
  selectSearchQuery,
  selectMoodFilter,
  selectTagFilter,
  selectJournalStats,
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
  selectSelectedEntryDetail,
  selectIsSearchBarVisible,
} from '../store/slices/uiSlice';
import {
  updateProfile,
  selectUserName,
  selectUserSubtitle,
  selectUserStreakDays,
} from '../store/slices/userSlice';

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

export const HomeScreen: React.FC = () => {
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
  const selectedEntryDetail = useAppSelector(selectSelectedEntryDetail);
  const sections = useAppSelector((state) => state.journal.sections);

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
  const userSubtitle = useAppSelector(selectUserSubtitle);
  const userStreakDays = useAppSelector(selectUserStreakDays);
  const stats = useAppSelector(selectJournalStats);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Caveat_600SemiBold,
  });

  const animateNext = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  };

  // Single click: open the card completely with full text & details inside
  const handleCardPress = (entry: JournalEntry) => {
    dispatch(setSelectedEntryDetail(entry));
  };

  // Long press: display existing entry action options (Favorite, Edit, Delete)
  const handleCardLongPress = (entry: JournalEntry) => {
    Alert.alert(
      entry.title || 'Journal Entry',
      'Choose an action for this entry:',
      [
        {
          text: entry.isFavorite ? '★ Remove Favorite' : '☆ Mark Favorite',
          onPress: () => {
            animateNext();
            dispatch(toggleFavoriteEntry(entry.id));
          },
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
          onPress: () => {
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
                  },
                },
              ]
            );
          },
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
    } else {
      dispatch(addEntry(savedEntry));
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

  // Render Analytics Tab
  const renderAnalyticsView = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabHeader}>
        <Text
          style={[
            styles.tabTitle,
            fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
          ]}
        >
          Journal Insights
        </Text>
        <Text style={styles.tabSubtitle}>
          A glance at your inner journey & reflections
        </Text>
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: '#F0EAFB' }]}>
          <Feather name="book-open" size={24} color="#6E3DE6" />
          <Text style={styles.metricValue}>{stats.totalEntries}</Text>
          <Text style={styles.metricLabel}>Total Entries</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FFF0F5' }]}>
          <MaterialCommunityIcons name="image-multiple-outline" size={26} color="#E56338" />
          <Text style={styles.metricValue}>{stats.totalPolaroids}</Text>
          <Text style={styles.metricLabel}>Polaroid Photos</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#E8F8F0' }]}>
          <Feather name="zap" size={24} color="#2AB565" />
          <Text style={styles.metricValue}>{userStreakDays} Days</Text>
          <Text style={styles.metricLabel}>Active Streak</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FEF3D6' }]}>
          <Feather name="edit-3" size={24} color="#D97706" />
          <Text style={styles.metricValue}>{stats.totalCharacters}</Text>
          <Text style={styles.metricLabel}>Words & Chars</Text>
        </View>
      </View>

      {/* Mood Breakdown */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionBlockTitle}>Mood Frequency</Text>
        <View style={styles.moodPillsWrap}>
          {Object.entries(stats.moodCounts).length === 0 ? (
            <Text style={styles.emptyNote}>No moods tracked yet.</Text>
          ) : (
            Object.entries(stats.moodCounts).map(([mood, count]) => {
              const moodInfo = QUICK_MOOD_FILTERS.find((m) => m.id === mood);
              return (
                <View key={mood} style={styles.moodCountChip}>
                  <Text style={styles.moodChipEmoji}>{moodInfo?.emoji || '💭'}</Text>
                  <Text style={styles.moodChipLabel}>
                    {moodInfo?.label || mood}:
                  </Text>
                  <Text style={styles.moodChipCount}>{count}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Tags Breakdown */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionBlockTitle}>Top Tags</Text>
        <View style={styles.tagsPillsWrap}>
          {Object.entries(stats.tagCounts).length === 0 ? (
            <Text style={styles.emptyNote}>No tags added yet.</Text>
          ) : (
            Object.entries(stats.tagCounts).map(([tag, count]) => (
              <View key={tag} style={styles.tagCountChip}>
                <Text style={styles.tagCountText}>#{tag}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{count}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => dispatch(setActiveTab('home'))}
      >
        <Text style={styles.backButtonText}>Back to Journal</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render Calendar / Archive Tab
  const renderCalendarView = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabHeader}>
        <Text
          style={[
            styles.tabTitle,
            fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
          ]}
        >
          Timeline Archive
        </Text>
        <Text style={styles.tabSubtitle}>
          {stats.totalSections} chronological chapters recorded
        </Text>
      </View>

      {/* Quick Section Controls */}
      <View style={styles.archiveControlsRow}>
        <TouchableOpacity
          style={styles.archiveActionButton}
          onPress={() => {
            animateNext();
            dispatch(expandAllSections());
          }}
        >
          <Ionicons name="expand-outline" size={16} color="#6E3DE6" />
          <Text style={styles.archiveActionText}>Expand All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.archiveActionButton}
          onPress={() => {
            animateNext();
            dispatch(collapseAllSections());
          }}
        >
          <Ionicons name="contract-outline" size={16} color="#6E3DE6" />
          <Text style={styles.archiveActionText}>Collapse All</Text>
        </TouchableOpacity>
      </View>

      {/* Month Chapters List */}
      <View style={styles.archiveList}>
        {displayedSections.map((section) => {
          const isCollapsed = Boolean(collapsedSections[section.id]);
          return (
            <TouchableOpacity
              key={section.id}
              activeOpacity={0.75}
              onPress={() => {
                toggleSection(section.id);
                dispatch(setActiveTab('home'));
              }}
              style={styles.archiveCard}
            >
              <View style={styles.archiveCardLeft}>
                <Text style={styles.archiveCardMonth}>{section.month}</Text>
                <Text style={styles.archiveCardYear}>{section.year}</Text>
              </View>
              <View style={styles.archiveCardRight}>
                <Text style={styles.archiveCardCount}>
                  {section.totalCount} {section.totalCount === 1 ? 'entry' : 'entries'}
                </Text>
                <Ionicons
                  name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color="#79718A"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => dispatch(setActiveTab('home'))}
      >
        <Text style={styles.backButtonText}>View in Journal Feed</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render Profile Tab
  const renderProfileView = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={styles.tabContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabHeader}>
        <Text
          style={[
            styles.tabTitle,
            fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
          ]}
        >
          Author Profile
        </Text>
        <Text style={styles.tabSubtitle}>Manage your journal persona & preferences</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileAvatarInitial}>
            {userName ? userName[0].toUpperCase() : 'E'}
          </Text>
        </View>

        <Text style={styles.profileName}>{userName}</Text>
        <Text style={styles.profileSubtitle}>{userSubtitle}</Text>

        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{stats.totalEntries}</Text>
            <Text style={styles.profileStatLabel}>Entries</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{userStreakDays}</Text>
            <Text style={styles.profileStatLabel}>Day Streak</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{stats.totalPolaroids}</Text>
            <Text style={styles.profileStatLabel}>Photos</Text>
          </View>
        </View>
      </View>

      {/* Profile Actions */}
      <View style={styles.profileActionsContainer}>
        <TouchableOpacity
          style={styles.profileActionRow}
          activeOpacity={0.7}
          onPress={() => {
            Alert.prompt
              ? Alert.prompt(
                  'Edit Name',
                  'Enter your preferred name:',
                  (text) => {
                    if (text && text.trim()) {
                      dispatch(updateProfile({ name: text.trim() }));
                    }
                  },
                  'plain-text',
                  userName
                )
              : Alert.alert('Profile', `Currently journaling as ${userName}`);
          }}
        >
          <View style={styles.profileActionLeft}>
            <Feather name="user" size={18} color="#6E3DE6" />
            <Text style={styles.profileActionText}>Name: {userName}</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#A098AE" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileActionRow}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              'Reset Demo Data?',
              'This will reset all sections and entries to the initial demo entries.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Data',
                  style: 'destructive',
                  onPress: () => {
                    animateNext();
                    dispatch(resetToInitialData());
                    dispatch(setActiveTab('home'));
                  },
                },
              ]
            );
          }}
        >
          <View style={styles.profileActionLeft}>
            <Feather name="refresh-cw" size={18} color="#E56338" />
            <Text style={[styles.profileActionText, { color: '#E56338' }]}>
              Reset to Demo Entries
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#A098AE" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => dispatch(setActiveTab('home'))}
      >
        <Text style={styles.backButtonText}>Return to Journal</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* Render Active View based on activeTab */}
        {activeTab === 'analytics' && renderAnalyticsView()}
        {activeTab === 'calendar' && renderCalendarView()}
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
              <View>
                {/* Header with Greeting & Avatar */}
                <Header
                  name={userName}
                  subtitle={userSubtitle}
                  avatarUri={require('../../assets/emma-profile.jpg')}
                  fontsLoaded={fontsLoaded}
                  onPressAvatar={() => dispatch(setActiveTab('profile'))}
                />

                {/* All Entries Top Bar with Sort & Search Trigger */}
                <EntriesTopBar
                  title="All Entries"
                  onPressSort={handleSortPress}
                  sortLabel={sortDescending ? 'Newest' : 'Oldest'}
                  onPressSearch={() => {
                    animateNext();
                    dispatch(toggleSearchBar());
                  }}
                  isSearchActive={isSearchBarVisible || hasActiveFilters}
                />

                {/* Search & Filter Expandable Box */}
                {isSearchBarVisible || hasActiveFilters ? (
                  <View style={styles.searchFilterContainer}>
                    {/* Search Input Field */}
                    <View style={styles.searchInputRow}>
                      <Ionicons name="search" size={17} color="#79718A" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search thoughts, memories, tags..."
                        placeholderTextColor="#A098AE"
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
                          <Ionicons name="close-circle" size={18} color="#79718A" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Quick Mood Filter Chips */}
                    <View style={styles.filterMoodsRow}>
                      <Text style={styles.filterSectionTitle}>Filter Mood:</Text>
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
                                  dispatch(
                                    setSelectedMoodFilter(isSelected ? null : m.id)
                                  );
                                }}
                                style={[
                                  styles.quickMoodChip,
                                  isSelected && styles.quickMoodChipSelected,
                                ]}
                              >
                                <Text style={styles.quickMoodEmoji}>{m.emoji}</Text>
                                <Text
                                  style={[
                                    styles.quickMoodText,
                                    isSelected && styles.quickMoodTextSelected,
                                  ]}
                                >
                                  {m.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Active Filter Indicator & Reset */}
                    {hasActiveFilters && (
                      <View style={styles.activeFilterStatusRow}>
                        <Text style={styles.activeFilterStatusText}>
                          Showing {totalMatchingEntries}{' '}
                          {totalMatchingEntries === 1 ? 'match' : 'matches'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            animateNext();
                            dispatch(clearFilters());
                          }}
                          style={styles.clearAllFiltersBtn}
                        >
                          <Text style={styles.clearAllFiltersText}>Clear Filters</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="notebook-outline"
                  size={54}
                  color="#C6BDD2"
                />
                <Text style={styles.emptyTitle}>No Entries Found</Text>
                <Text style={styles.emptyDescription}>
                  {hasActiveFilters
                    ? 'No journal entries match your current search and filters.'
                    : 'Your inner space is ready for your first reflection.'}
                </Text>
                {hasActiveFilters ? (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => {
                      animateNext();
                      dispatch(clearFilters());
                    }}
                  >
                    <Text style={styles.emptyActionText}>Reset Filters</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={handleAddPress}
                  >
                    <Text style={styles.emptyActionText}>+ Write New Entry</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
          <NewEntryScreen
            entryToEdit={editingEntry}
            onClose={() => {
              dispatch(closeNewEntryModal());
            }}
            onSave={handleSaveEntry}
            fontsLoaded={fontsLoaded}
          />
        </Modal>

        {/* Full Card Detail Modal triggered by clicking/tapping any card */}
        <CardDetailModal
          entry={liveViewingEntry}
          visible={Boolean(selectedEntryDetail)}
          onClose={() => {
            dispatch(setSelectedEntryDetail(null));
          }}
          onToggleFavorite={(entry) => {
            animateNext();
            dispatch(toggleFavoriteEntry(entry.id));
          }}
          onEdit={(entry) => {
            dispatch(setSelectedEntryDetail(null));
            dispatch(openEditEntryModal(entry));
          }}
          onDelete={(entry) => {
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
                    dispatch(setSelectedEntryDetail(null));
                  },
                },
              ]
            );
          }}
          fontsLoaded={fontsLoaded}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7FB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7FB',
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
    backgroundColor: '#FAF7FB',
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
    backgroundColor: '#FAF7FB',
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
});
