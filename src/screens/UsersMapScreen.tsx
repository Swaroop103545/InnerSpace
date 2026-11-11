import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUserId, selectUserName } from '../store/slices/userSlice';
import { openNewEntryModal } from '../store/slices/uiSlice';
import { Header } from '../components/Header';
import { JournalEntry } from '../types';
import {
  scratchPeopleFromEntries,
  ScratchedPerson,
  PersonMentionOccurrence,
} from '../utils/nameExtractor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_PALETTES = [
  { bg: '#EFE7F6', text: '#5D4586' },
  { bg: '#E5EDF9', text: '#3B5F8F' },
  { bg: '#F9EAE1', text: '#8F5736' },
  { bg: '#E7F4EB', text: '#3E7351' },
  { bg: '#FDF3D8', text: '#7D6A28' },
  { bg: '#F5E6EC', text: '#8A3B63' },
  { bg: '#E8F1F5', text: '#396073' },
  { bg: '#F4ECE4', text: '#6D5343' },
];

const RELATION_TAGS = ['All', 'Family', 'Friend', 'Partner', 'Mentor', 'Colleague'] as const;

export interface UsersMapScreenProps {
  onOpenEntry?: (entry: JournalEntry) => void;
}

interface UserPreferences {
  favorites: Record<string, boolean>;
  relations: Record<string, string>;
  notes: Record<string, string>;
  ignoredNames: string[];
  manualPeople: Array<{
    id: string;
    name: string;
    relation: string;
    note?: string;
  }>;
}

const DEFAULT_PREFS: UserPreferences = {
  favorites: {},
  relations: {},
  notes: {},
  ignoredNames: [],
  manualPeople: [],
};

export const UsersMapScreen: React.FC<UsersMapScreenProps> = ({ onOpenEntry }) => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const userName = useAppSelector(selectUserName);
  const sections = useAppSelector((state) => state.journal.sections);

  // UI state
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [selectedRelationTag, setSelectedRelationTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'mentions' | 'alpha' | 'recent'>('mentions');

  // Stored metadata
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Modals state
  const [selectedPerson, setSelectedPerson] = useState<ScratchedPerson | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Manual Add form state
  const [addName, setAddName] = useState('');
  const [addRelation, setAddRelation] = useState<'Family' | 'Friend' | 'Partner' | 'Mentor' | 'Colleague' | 'Other'>('Friend');
  const [addNote, setAddNote] = useState('');

  // Selected node in Map View
  const [activeMapPersonId, setActiveMapPersonId] = useState<string | null>(null);

  const storageKey = `@innerspace_usersmap_prefs_${userId || 'local'}`;

  // Load user preferences from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          setUserPrefs({
            favorites: parsed.favorites || {},
            relations: parsed.relations || {},
            notes: parsed.notes || {},
            ignoredNames: Array.isArray(parsed.ignoredNames) ? parsed.ignoredNames : [],
            manualPeople: Array.isArray(parsed.manualPeople) ? parsed.manualPeople : [],
          });
        }
      } catch (err) {
        console.warn('Error loading UsersMap preferences:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPrefs(false);
        }
      }
    };

    loadPrefs();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Save preferences helper
  const persistPrefs = useCallback(
    async (updater: (prev: UserPreferences) => UserPreferences) => {
      setUserPrefs((prev) => {
        const next = updater(prev);
        AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch((err) => {
          console.warn('Error saving UsersMap preferences:', err);
        });
        return next;
      });
    },
    [storageKey]
  );

  // Flatten all journal entries from Redux sections
  const allEntries = useMemo(() => {
    return sections.flatMap((section) => section.data);
  }, [sections]);

  // Scratch / scrape all people names from journal entries
  const scratchedPeople = useMemo(() => {
    const scraped = scratchPeopleFromEntries(allEntries, userPrefs.ignoredNames);

    // Merge manual people that haven't been scratched yet
    const existingIds = new Set(scraped.map((p) => p.id));
    const mergedList = [...scraped];

    for (const manual of userPrefs.manualPeople) {
      const manualId = manual.id.toLowerCase();
      if (!existingIds.has(manualId) && !userPrefs.ignoredNames.includes(manualId)) {
        mergedList.push({
          id: manualId,
          name: manual.name,
          mentionsCount: 0,
          entriesCount: 0,
          occurrences: [],
          suggestedRelation: (manual.relation as any) || 'Friend',
          associatedMoods: [],
          isCustom: true,
        });
      }
    }

    // Apply user customized relations and favorites
    return mergedList.map((person) => {
      const customRelation = userPrefs.relations[person.id];
      return {
        ...person,
        suggestedRelation: (customRelation || person.suggestedRelation) as any,
        isFavorite: !!userPrefs.favorites[person.id],
        note: userPrefs.notes[person.id] || '',
      };
    });
  }, [allEntries, userPrefs]);

  // Overall Statistics
  const totalMentions = useMemo(() => {
    return scratchedPeople.reduce((sum, p) => sum + p.mentionsCount, 0);
  }, [scratchedPeople]);

  const totalPeopleCount = scratchedPeople.length;

  const entriesWithPeopleCount = useMemo(() => {
    const entryIds = new Set<string>();
    scratchedPeople.forEach((p) => {
      p.occurrences.forEach((occ) => entryIds.add(occ.entryId));
    });
    return entryIds.size;
  }, [scratchedPeople]);

  // Filtered and Sorted list
  const filteredPeople = useMemo(() => {
    let list = [...scratchedPeople];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inRelation = p.suggestedRelation.toLowerCase().includes(q);
        const inSnippet = p.occurrences.some((o) => o.snippet.toLowerCase().includes(q));
        return inName || inRelation || inSnippet;
      });
    }

    // Relation Filter
    if (selectedRelationTag !== 'All') {
      if (selectedRelationTag === 'Favorites') {
        list = list.filter((p) => (p as any).isFavorite);
      } else {
        list = list.filter(
          (p) => p.suggestedRelation.toLowerCase() === selectedRelationTag.toLowerCase()
        );
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'mentions') {
        if (b.mentionsCount !== a.mentionsCount) {
          return b.mentionsCount - a.mentionsCount;
        }
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'recent') {
        const timeA = a.occurrences[0]?.timestamp || 0;
        const timeB = b.occurrences[0]?.timestamp || 0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [scratchedPeople, search, selectedRelationTag, sortBy]);

  // Top Most Mentioned Person
  const featuredPerson = useMemo(() => {
    if (scratchedPeople.length === 0) return null;
    const sorted = [...scratchedPeople].sort((a, b) => b.mentionsCount - a.mentionsCount);
    return sorted[0].mentionsCount > 0 ? sorted[0] : null;
  }, [scratchedPeople]);

  // Helpers for Avatar Color and Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
  };

  const getPalette = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
  };

  // Toggle favorite for a person
  const handleToggleFavorite = (personId: string) => {
    persistPrefs((prev) => ({
      ...prev,
      favorites: {
        ...prev.favorites,
        [personId]: !prev.favorites[personId],
      },
    }));
  };

  // Change relation for a person
  const handleChangeRelation = (personId: string, newRelation: string) => {
    persistPrefs((prev) => ({
      ...prev,
      relations: {
        ...prev.relations,
        [personId]: newRelation,
      },
    }));
    if (selectedPerson && selectedPerson.id === personId) {
      setSelectedPerson((prev) => (prev ? { ...prev, suggestedRelation: newRelation as any } : null));
    }
  };

  // Update note for a person
  const handleSaveNote = (personId: string, noteText: string) => {
    persistPrefs((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [personId]: noteText,
      },
    }));
  };

  // Ignore / remove a name from scratching
  const handleIgnorePerson = (person: ScratchedPerson) => {
    Alert.alert(
      'Hide from Users Map?',
      `Are you sure you want to hide "${person.name}"? InnerSpace will no longer count or show this name.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide Name',
          style: 'destructive',
          onPress: () => {
            persistPrefs((prev) => ({
              ...prev,
              ignoredNames: [...prev.ignoredNames, person.id],
              manualPeople: prev.manualPeople.filter((p) => p.id !== person.id),
            }));
            setIsDetailModalVisible(false);
            setSelectedPerson(null);
          },
        },
      ]
    );
  };

  // Handle manual add person
  const handleManualAddSubmit = () => {
    if (!addName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this person.');
      return;
    }

    const key = addName.trim().toLowerCase();
    const newEntry = {
      id: key,
      name: addName.trim(),
      relation: addRelation,
      note: addNote.trim(),
    };

    persistPrefs((prev) => {
      const filtered = prev.manualPeople.filter((p) => p.id !== key);
      return {
        ...prev,
        manualPeople: [newEntry, ...filtered],
        relations: { ...prev.relations, [key]: addRelation },
        notes: addNote.trim() ? { ...prev.notes, [key]: addNote.trim() } : prev.notes,
        ignoredNames: prev.ignoredNames.filter((n) => n !== key),
      };
    });

    setAddName('');
    setAddRelation('Friend');
    setAddNote('');
    setIsAddModalVisible(false);
  };

  // Handle opening an entry when clicked in detail modal
  const handleOpenEntryOccurrence = (occurrence: PersonMentionOccurrence) => {
    const fullEntry = allEntries.find((e) => e.id === occurrence.entryId);
    if (fullEntry && onOpenEntry) {
      setIsDetailModalVisible(false);
      onOpenEntry(fullEntry);
    }
  };

  const openPersonDetail = (person: ScratchedPerson) => {
    setSelectedPerson(person);
    setIsDetailModalVisible(true);
  };

  // Map Node Coordinates Generator (Constellation circle map)
  const mapLayoutNodes = useMemo(() => {
    const canvasWidth = SCREEN_WIDTH - 80;
    const centerX = canvasWidth / 2;
    const centerY = 170; // map height center
    const nodes = scratchedPeople.slice(0, 14); // Display up to 14 nodes in visual map

    return nodes.map((person, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
      // Stagger radius based on mention count: higher mentions orbit closer to center
      const maxMentions = Math.max(...nodes.map((n) => n.mentionsCount), 1);
      const closenessFactor = 1 - Math.min(person.mentionsCount / maxMentions, 0.7);
      const orbitRadius = 68 + closenessFactor * 52;

      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;

      // Node size scaled by mentions
      const nodeSize = Math.min(48, Math.max(34, 34 + person.mentionsCount * 2));

      return {
        person,
        x,
        y,
        nodeSize,
      };
    });
  }, [scratchedPeople]);

  const activeMapPerson = useMemo(() => {
    if (!activeMapPersonId) return featuredPerson || scratchedPeople[0] || null;
    return scratchedPeople.find((p) => p.id === activeMapPersonId) || null;
  }, [activeMapPersonId, featuredPerson, scratchedPeople]);

  if (isLoadingPrefs) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#7663A8" />
        <Text style={styles.loadingText}>Mapping your circle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <Header
          name={userName || 'Writer'}
          subtitle="The people who illuminate your memories."
        />

        {/* Intro Section */}
        <View style={styles.introHeader}>
          <View style={styles.introTitleRow}>
            <View>
              <Text style={styles.sectionEyebrow}>RELATIONSHIP MAP & MENTIONS</Text>
              <Text style={styles.heading}>Your Circle of{'\n'}Connections</Text>
            </View>

            <TouchableOpacity
              style={styles.headerAddBtn}
              activeOpacity={0.8}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtext}>
            InnerSpace automatically extracts people mentioned in your reflections and maps how frequently they appear in your life journey.
          </Text>

          {/* Metrics Pill Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="people" size={17} color="#7663A8" />
              </View>
              <View>
                <Text style={styles.metricValue}>{totalPeopleCount}</Text>
                <Text style={styles.metricLabel}>PEOPLE</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FDEAEB' }]}>
                <Ionicons name="chatbubbles" size={17} color="#D76161" />
              </View>
              <View>
                <Text style={styles.metricValue}>{totalMentions}</Text>
                <Text style={styles.metricLabel}>MENTIONS</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#E7F4EB' }]}>
                <Feather name="book-open" size={16} color="#3E7351" />
              </View>
              <View>
                <Text style={styles.metricValue}>{entriesWithPeopleCount}</Text>
                <Text style={styles.metricLabel}>STORIES</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State when no mentions exist */}
        {scratchedPeople.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircleOuter} />
              <View style={styles.emptyCircleInner} />
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={38} color="#7663A8" />
              </View>
              <View style={styles.emptySparkle}>
                <Ionicons name="sparkles" size={18} color="#BFA3DC" />
              </View>
            </View>

            <Text style={styles.emptyEyebrow}>AUTOMATIC PEOPLE DETECTION</Text>
            <Text style={styles.emptyTitle}>No People Mentioned Yet</Text>
            <Text style={styles.emptyDescription}>
              As you write reflections, mention your loved ones, friends, or mentors (e.g. &ldquo;Dinner with Sarah&rdquo;, &ldquo;Talked to Mom&rdquo;, or &ldquo;@Alex&rdquo;). InnerSpace will automatically scratch and map them here with their mention counts!
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.emptyPrimaryBtn}
              onPress={() => dispatch(openNewEntryModal())}
            >
              <Feather name="edit-3" size={16} color="#FFFFFF" />
              <Text style={styles.emptyPrimaryBtnText}>Write a Story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.emptySecondaryBtn}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Feather name="user-plus" size={15} color="#7663A8" />
              <Text style={styles.emptySecondaryBtnText}>Add Someone Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* View Mode Toggle Switch (Map View vs List View) */}
            <View style={styles.viewToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'map' && styles.viewToggleButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setViewMode('map')}
              >
                <MaterialCommunityIcons
                  name="orbit"
                  size={16}
                  color={viewMode === 'map' ? '#FFFFFF' : '#7663A8'}
                />
                <Text
                  style={[
                    styles.viewToggleText,
                    viewMode === 'map' && styles.viewToggleTextActive,
                  ]}
                >
                  Constellation Map
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'list' && styles.viewToggleButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setViewMode('list')}
              >
                <Feather
                  name="list"
                  size={15}
                  color={viewMode === 'list' ? '#FFFFFF' : '#7663A8'}
                />
                <Text
                  style={[
                    styles.viewToggleText,
                    viewMode === 'list' && styles.viewToggleTextActive,
                  ]}
                >
                  Directory List
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONSTELLATION MAP VIEW */}
            {viewMode === 'map' && (
              <View style={styles.mapCard}>
                <View style={styles.mapHeaderRow}>
                  <View>
                    <Text style={styles.mapCardEyebrow}>INTERACTIVE MAP</Text>
                    <Text style={styles.mapCardTitle}>Orbit of Connections</Text>
                  </View>
                  <View style={styles.mapLegendBadge}>
                    <Text style={styles.mapLegendText}>Closer = More mentions</Text>
                  </View>
                </View>

                {/* Map Visual Canvas */}
                <View style={styles.mapCanvas}>
                  {/* Orbit concentric guide rings */}
                  <View style={[styles.mapRing, { width: 140, height: 140, borderRadius: 70 }]} />
                  <View style={[styles.mapRing, { width: 200, height: 200, borderRadius: 100 }]} />
                  <View style={[styles.mapRing, { width: 260, height: 260, borderRadius: 130 }]} />

                  {/* Central Node: You */}
                  <View style={styles.centerNode}>
                    <View style={styles.centerNodeInner}>
                      <Text style={styles.centerNodeText}>YOU</Text>
                    </View>
                  </View>

                  {/* Orbiting People Nodes */}
                  {mapLayoutNodes.map(({ person, x, y, nodeSize }) => {
                    const palette = getPalette(person.name);
                    const isSelected = activeMapPerson?.id === person.id;

                    return (
                      <TouchableOpacity
                        key={person.id}
                        activeOpacity={0.8}
                        style={[
                          styles.mapNode,
                          {
                            left: x - nodeSize / 2,
                            top: y - nodeSize / 2,
                            width: nodeSize,
                            height: nodeSize,
                            borderRadius: nodeSize / 2,
                            backgroundColor: palette.bg,
                            borderColor: isSelected ? '#7663A8' : '#FFFFFF',
                            borderWidth: isSelected ? 2.5 : 1.5,
                          },
                        ]}
                        onPress={() => setActiveMapPersonId(person.id)}
                      >
                        <Text
                          style={[
                            styles.mapNodeText,
                            { color: palette.text, fontSize: nodeSize * 0.36 },
                          ]}
                        >
                          {getInitials(person.name)}
                        </Text>

                        {/* Mention count pill on node */}
                        {person.mentionsCount > 0 && (
                          <View style={styles.nodeMentionBadge}>
                            <Text style={styles.nodeMentionBadgeText}>
                              {person.mentionsCount}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Active Person Spotlight Card in Map */}
                {activeMapPerson && (
                  <View style={styles.mapSpotlightCard}>
                    <View style={styles.spotlightTopRow}>
                      <View style={styles.spotlightAvatarRow}>
                        <View
                          style={[
                            styles.spotlightAvatar,
                            { backgroundColor: getPalette(activeMapPerson.name).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.spotlightAvatarText,
                              { color: getPalette(activeMapPerson.name).text },
                            ]}
                          >
                            {getInitials(activeMapPerson.name)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.spotlightName}>{activeMapPerson.name}</Text>
                          <View style={styles.spotlightBadgeRow}>
                            <View style={styles.relationBadge}>
                              <Text style={styles.relationBadgeText}>
                                {activeMapPerson.suggestedRelation}
                              </Text>
                            </View>
                            {(activeMapPerson as any).isFavorite && (
                              <Text style={styles.spotlightHeart}>♥ Saved</Text>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={styles.spotlightCountWrap}>
                        <Text style={styles.spotlightCountNum}>
                          {activeMapPerson.mentionsCount}
                        </Text>
                        <Text style={styles.spotlightCountLabel}>
                          {activeMapPerson.mentionsCount === 1 ? 'mention' : 'mentions'}
                        </Text>
                      </View>
                    </View>

                    {/* Preview snippet from recent entry */}
                    {activeMapPerson.occurrences[0] && (
                      <View style={styles.spotlightSnippetBox}>
                        <Feather name="message-square" size={13} color="#7663A8" style={{ marginTop: 2 }} />
                        <Text style={styles.spotlightSnippetText} numberOfLines={2}>
                          &ldquo;{activeMapPerson.occurrences[0].snippet}&rdquo;
                        </Text>
                      </View>
                    )}

                    <View style={styles.spotlightActions}>
                      <TouchableOpacity
                        style={styles.spotlightFavoriteBtn}
                        onPress={() => handleToggleFavorite(activeMapPerson.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.spotlightFavoriteIcon,
                            (activeMapPerson as any).isFavorite && styles.favoriteActive,
                          ]}
                        >
                          {(activeMapPerson as any).isFavorite ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.spotlightDetailsBtn}
                        onPress={() => openPersonDetail(activeMapPerson)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.spotlightDetailsBtnText}>
                          View All {activeMapPerson.mentionsCount} Mentions
                        </Text>
                        <Feather name="arrow-right" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* DIRECTORY / LIST VIEW */}
            {viewMode === 'list' && (
              <>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Feather name="search" size={18} color="#8D897E" style={styles.searchIcon} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search people by name, relation, or quote..."
                    placeholderTextColor="#AAA69B"
                    style={styles.searchInput}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Feather name="x" size={18} color="#8D897E" style={styles.clearSearch} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Chips Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsContainer}
                >
                  {RELATION_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.filterChip,
                        selectedRelationTag === tag && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedRelationTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedRelationTag === tag && styles.filterChipTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedRelationTag === 'Favorites' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedRelationTag('Favorites')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedRelationTag === 'Favorites' && styles.filterChipTextActive,
                      ]}
                    >
                      ♥ Favorites
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Sort Option Chips */}
                <View style={styles.sortRow}>
                  <Text style={styles.sortLabel}>SORT BY:</Text>
                  <TouchableOpacity
                    onPress={() => setSortBy('mentions')}
                    style={[styles.sortChip, sortBy === 'mentions' && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, sortBy === 'mentions' && styles.sortChipTextActive]}>
                      Mentions
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSortBy('alpha')}
                    style={[styles.sortChip, sortBy === 'alpha' && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, sortBy === 'alpha' && styles.sortChipTextActive]}>
                      A–Z
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSortBy('recent')}
                    style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, sortBy === 'recent' && styles.sortChipTextActive]}>
                      Recent
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Featured / Most Mentioned Card */}
                {featuredPerson && !search && selectedRelationTag === 'All' && (
                  <View style={styles.featuredCard}>
                    <View style={styles.featuredTop}>
                      <View style={styles.featuredBadge}>
                        <Ionicons name="sparkles" size={13} color="#7663A8" />
                        <Text style={styles.featuredLabel}>MOST MENTIONED PERSON</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(featuredPerson.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.favoriteIcon,
                            (featuredPerson as any).isFavorite && styles.favoriteActive,
                          ]}
                        >
                          {(featuredPerson as any).isFavorite ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.featuredContent}>
                      <View
                        style={[
                          styles.featuredAvatar,
                          { backgroundColor: getPalette(featuredPerson.name).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.featuredAvatarText,
                            { color: getPalette(featuredPerson.name).text },
                          ]}
                        >
                          {getInitials(featuredPerson.name)}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.featuredName}>{featuredPerson.name}</Text>
                        <Text style={styles.featuredRelation}>
                          {featuredPerson.suggestedRelation}
                        </Text>
                        <Text style={styles.featuredStats}>
                          Appears in {featuredPerson.entriesCount}{' '}
                          {featuredPerson.entriesCount === 1 ? 'reflection' : 'reflections'}
                        </Text>
                      </View>
                    </View>

                    {featuredPerson.occurrences[0] && (
                      <View style={styles.featuredSnippetBox}>
                        <Text style={styles.featuredSnippetQuote} numberOfLines={2}>
                          &ldquo;{featuredPerson.occurrences[0].snippet}&rdquo;
                        </Text>
                        <Text style={styles.featuredSnippetDate}>
                          {featuredPerson.occurrences[0].entryDate}
                        </Text>
                      </View>
                    )}

                    <View style={styles.featuredFooter}>
                      <View>
                        <Text style={styles.featuredCountNumber}>
                          {featuredPerson.mentionsCount}
                        </Text>
                        <Text style={styles.featuredCountLabel}>
                          {featuredPerson.mentionsCount === 1
                            ? 'TOTAL MENTION'
                            : 'TOTAL MENTIONS'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.featuredBtn}
                        onPress={() => openPersonDetail(featuredPerson)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.featuredBtnText}>Explore Mentions</Text>
                        <Feather name="arrow-right" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Directory List of People */}
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listHeaderTitle}>
                    {selectedRelationTag === 'All' ? 'All People' : selectedRelationTag}
                  </Text>
                  <Text style={styles.listHeaderCount}>
                    {filteredPeople.length} OF {scratchedPeople.length}
                  </Text>
                </View>

                {filteredPeople.map((person) => {
                  const palette = getPalette(person.name);
                  const isFavorite = (person as any).isFavorite;

                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={styles.personCard}
                      activeOpacity={0.7}
                      onPress={() => openPersonDetail(person)}
                    >
                      <View
                        style={[
                          styles.personAvatar,
                          { backgroundColor: palette.bg },
                        ]}
                      >
                        <Text style={[styles.personAvatarText, { color: palette.text }]}>
                          {getInitials(person.name)}
                        </Text>
                      </View>

                      <View style={styles.personInfo}>
                        <View style={styles.personNameRow}>
                          <Text style={styles.personName}>{person.name}</Text>
                          <View style={styles.relationTagPill}>
                            <Text style={styles.relationTagPillText}>
                              {person.suggestedRelation}
                            </Text>
                          </View>
                        </View>

                        {/* Recent quote snippet */}
                        {person.occurrences[0] ? (
                          <Text style={styles.personSnippet} numberOfLines={1}>
                            &ldquo;{person.occurrences[0].snippet}&rdquo;
                          </Text>
                        ) : (
                          <Text style={styles.personEmptySnippet}>
                            Manually added to your circle
                          </Text>
                        )}
                      </View>

                      {/* Mentions counter badge */}
                      <View style={styles.mentionsBadge}>
                        <Text style={styles.mentionsNumber}>{person.mentionsCount}</Text>
                        <Text style={styles.mentionsLabel}>
                          {person.mentionsCount === 1 ? 'mention' : 'mentions'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(person.id)}
                        style={styles.cardFavoriteBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
                          {isFavorite ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}

                {filteredPeople.length === 0 && (
                  <View style={styles.noResultsBox}>
                    <Feather name="search" size={28} color="#AAA69B" />
                    <Text style={styles.noResultsTitle}>No People Found</Text>
                    <Text style={styles.noResultsSub}>
                      No matches found for &ldquo;{search}&rdquo;. Try another name or clear filters.
                    </Text>
                    <TouchableOpacity
                      style={styles.clearSearchBtn}
                      onPress={() => {
                        setSearch('');
                        setSelectedRelationTag('All');
                      }}
                    >
                      <Text style={styles.clearSearchBtnText}>Reset Filters</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <Text style={styles.bottomWatermark}>
          INNERSPACE  /  MEMORIES & CONNECTIONS
        </Text>
      </ScrollView>

      {/* PERSON DETAIL MODAL */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.detailModalSheet}>
            {selectedPerson && (
              <>
                {/* Modal Header */}
                <View style={styles.detailHeader}>
                  <View style={styles.detailAvatarRow}>
                    <View
                      style={[
                        styles.detailAvatar,
                        { backgroundColor: getPalette(selectedPerson.name).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailAvatarText,
                          { color: getPalette(selectedPerson.name).text },
                        ]}
                      >
                        {getInitials(selectedPerson.name)}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.detailName}>{selectedPerson.name}</Text>
                      <View style={styles.detailMetaRow}>
                        <View style={styles.detailMentionsChip}>
                          <Text style={styles.detailMentionsChipText}>
                            {selectedPerson.mentionsCount}{' '}
                            {selectedPerson.mentionsCount === 1 ? 'Mention' : 'Mentions'}
                          </Text>
                        </View>
                        <Text style={styles.detailEntriesCount}>
                          Across {selectedPerson.entriesCount}{' '}
                          {selectedPerson.entriesCount === 1 ? 'story' : 'stories'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsDetailModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Feather name="x" size={20} color="#667085" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.detailScrollContent}
                >
                  {/* Relationship Selector */}
                  <Text style={styles.detailSectionLabel}>RELATIONSHIP</Text>
                  <View style={styles.relationPickerRow}>
                    {(['Family', 'Friend', 'Partner', 'Mentor', 'Colleague', 'Other'] as const).map(
                      (rel) => (
                        <TouchableOpacity
                          key={rel}
                          style={[
                            styles.relationPickerChip,
                            selectedPerson.suggestedRelation === rel &&
                              styles.relationPickerChipActive,
                          ]}
                          onPress={() => handleChangeRelation(selectedPerson.id, rel)}
                        >
                          <Text
                            style={[
                              styles.relationPickerChipText,
                              selectedPerson.suggestedRelation === rel &&
                                styles.relationPickerChipTextActive,
                            ]}
                          >
                            {rel}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>

                  {/* Personal Note */}
                  <Text style={styles.detailSectionLabel}>PERSONAL NOTE</Text>
                  <TextInput
                    style={styles.detailNoteInput}
                    placeholder="Add a thought or note about how you know them..."
                    placeholderTextColor="#AAA69B"
                    defaultValue={(selectedPerson as any).note || ''}
                    onEndEditing={(e) =>
                      handleSaveNote(selectedPerson.id, e.nativeEvent.text)
                    }
                    multiline
                  />

                  {/* Occurrences & Snippets in Entries */}
                  <View style={styles.occurrencesHeaderRow}>
                    <Text style={styles.detailSectionLabel}>MENTIONS IN STORIES</Text>
                    <Text style={styles.occurrencesCount}>
                      {selectedPerson.occurrences.length} EXCERPTS
                    </Text>
                  </View>

                  {selectedPerson.occurrences.length === 0 ? (
                    <View style={styles.noMentionsBox}>
                      <Text style={styles.noMentionsText}>
                        No text mentions found yet in your journal. Mention &ldquo;{selectedPerson.name}&rdquo; in a reflection to see their stories appear here.
                      </Text>
                    </View>
                  ) : (
                    selectedPerson.occurrences.map((occ, idx) => (
                      <View key={`${occ.entryId}-${idx}`} style={styles.occurrenceCard}>
                        <View style={styles.occurrenceTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.occurrenceTitle}>{occ.entryTitle}</Text>
                            <Text style={styles.occurrenceDate}>{occ.entryDate}</Text>
                          </View>

                          {occ.entryMood && (
                            <View style={styles.occurrenceMoodBadge}>
                              <Text style={styles.occurrenceMoodText}>{occ.entryMood}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.occurrenceSnippet}>
                          &ldquo;{occ.snippet}&rdquo;
                        </Text>

                        {onOpenEntry && (
                          <TouchableOpacity
                            style={styles.openEntryLink}
                            activeOpacity={0.7}
                            onPress={() => handleOpenEntryOccurrence(occ)}
                          >
                            <Feather name="book-open" size={13} color="#7663A8" />
                            <Text style={styles.openEntryLinkText}>Open Full Story</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}

                  {/* Danger zone / Hide button */}
                  <TouchableOpacity
                    style={styles.ignorePersonBtn}
                    onPress={() => handleIgnorePerson(selectedPerson)}
                    activeOpacity={0.7}
                  >
                    <Feather name="eye-off" size={14} color="#A39D94" />
                    <Text style={styles.ignorePersonBtnText}>
                      Hide &ldquo;{selectedPerson.name}&rdquo; from users map
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MANUAL ADD PERSON MODAL */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.detailModalSheet}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.modalEyebrow}>MANUAL CONNECTION</Text>
                <Text style={styles.detailName}>Add to Your Circle</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#667085" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailScrollContent}>
              <Text style={styles.formInputLabel}>Person Name *</Text>
              <TextInput
                style={styles.formTextInput}
                placeholder="e.g. Sarah, Lucas, Mom, Dr. Chen"
                placeholderTextColor="#AAA69B"
                value={addName}
                onChangeText={setAddName}
                autoFocus
              />

              <Text style={styles.formInputLabel}>Relationship</Text>
              <View style={styles.relationPickerRow}>
                {(['Family', 'Friend', 'Partner', 'Mentor', 'Colleague', 'Other'] as const).map(
                  (rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.relationPickerChip,
                        addRelation === rel && styles.relationPickerChipActive,
                      ]}
                      onPress={() => setAddRelation(rel)}
                    >
                      <Text
                        style={[
                          styles.relationPickerChipText,
                          addRelation === rel && styles.relationPickerChipTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.formInputLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.formTextInput, { height: 68, textAlignVertical: 'top' }]}
                placeholder="A brief note about them..."
                placeholderTextColor="#AAA69B"
                value={addNote}
                onChangeText={setAddNote}
                multiline
              />

              <View style={styles.formActionsRow}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.cancelFormBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitFormBtn}
                  onPress={handleManualAddSubmit}
                >
                  <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitFormBtnText}>Save to Circle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default UsersMapScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7663A8',
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingBottom: 48,
  },
  introHeader: {
    marginTop: 6,
    marginBottom: 20,
  },
  introTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#A18F7D',
    fontWeight: '700',
    marginBottom: 6,
  },
  heading: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '700',
    color: '#292B25',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtext: {
    color: '#89877E',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7663A8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#7663A8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EFE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#292B25',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#A18F7D',
    marginTop: 1,
  },

  // Toggle View
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEAE1',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#7663A8',
    shadowColor: '#7663A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7663A8',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },

  // Constellation Map Card
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    shadowColor: '#2C2738',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapCardEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: '#7663A8',
  },
  mapCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292B25',
    marginTop: 2,
  },
  mapLegendBadge: {
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  mapLegendText: {
    fontSize: 10,
    color: '#8D897E',
    fontWeight: '500',
  },
  mapCanvas: {
    width: '100%',
    height: 340,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  mapRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#F0ECE1',
    borderStyle: 'dashed',
  },
  centerNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE7F6',
    borderWidth: 3,
    borderColor: '#7663A8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#7663A8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  centerNodeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7663A8',
    letterSpacing: 1,
  },
  mapNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapNodeText: {
    fontWeight: '700',
  },
  nodeMentionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#7663A8',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nodeMentionBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Map Spotlight Card
  mapSpotlightCard: {
    backgroundColor: '#FAF8F4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    marginTop: 8,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spotlightAvatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightAvatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  spotlightName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#292B25',
  },
  spotlightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  relationBadge: {
    backgroundColor: '#EFE7F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  relationBadgeText: {
    color: '#7663A8',
    fontSize: 10,
    fontWeight: '600',
  },
  spotlightHeart: {
    fontSize: 10,
    color: '#D76161',
    fontWeight: '600',
  },
  spotlightCountWrap: {
    alignItems: 'flex-end',
  },
  spotlightCountNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#292B25',
  },
  spotlightCountLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#8D897E',
    fontWeight: '600',
  },
  spotlightSnippetBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  spotlightSnippetText: {
    flex: 1,
    fontSize: 12,
    color: '#656054',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  spotlightActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  spotlightFavoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  spotlightFavoriteIcon: {
    fontSize: 18,
    color: '#AAA69B',
  },
  spotlightDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7663A8',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  spotlightDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Directory / List View Styles
  searchBar: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE9E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#292B25',
  },
  clearSearch: {
    padding: 4,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  filterChipActive: {
    backgroundColor: '#7663A8',
    borderColor: '#7663A8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656054',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A18F7D',
    letterSpacing: 1.2,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#ECEAE1',
  },
  sortChipActive: {
    backgroundColor: '#292B25',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#767265',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },

  // Featured Card
  featuredCard: {
    backgroundColor: '#ECEAE1',
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E0DDD2',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredLabel: {
    color: '#7663A8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featuredAvatar: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredAvatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292B25',
  },
  featuredRelation: {
    color: '#7663A8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  featuredStats: {
    color: '#8D897E',
    fontSize: 11,
    marginTop: 2,
  },
  featuredSnippetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DDD8CB',
  },
  featuredSnippetQuote: {
    fontSize: 12,
    color: '#4A463E',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  featuredSnippetDate: {
    fontSize: 10,
    color: '#A18F7D',
    marginTop: 6,
    textAlign: 'right',
  },
  featuredFooter: {
    borderTopWidth: 1,
    borderTopColor: '#D8D4C7',
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredCountNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#292B25',
  },
  featuredCountLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#8D897E',
    fontWeight: '600',
  },
  featuredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B25',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  featuredBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Directory Person Card
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#292B25',
  },
  listHeaderCount: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#A18F7D',
    fontWeight: '700',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0EEE7',
    shadowColor: '#2C2738',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#292B25',
  },
  relationTagPill: {
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  relationTagPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7663A8',
  },
  personSnippet: {
    fontSize: 11,
    color: '#8D897E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  personEmptySnippet: {
    fontSize: 11,
    color: '#AAA69B',
    marginTop: 4,
  },
  mentionsBadge: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  mentionsNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#292B25',
  },
  mentionsLabel: {
    fontSize: 8,
    color: '#AAA69B',
    marginTop: 1,
  },
  cardFavoriteBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FAF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 17,
    color: '#AAA69B',
  },
  favoriteActive: {
    color: '#D76161',
  },

  // No Results State
  noResultsBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#292B25',
    marginTop: 12,
  },
  noResultsSub: {
    fontSize: 13,
    color: '#8D897E',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 14,
    backgroundColor: '#EDE9F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  clearSearchBtnText: {
    color: '#7663A8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Serene Empty State
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#2C2738',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIllustration: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyCircleOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F1FB',
  },
  emptyCircleInner: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EDE6F9',
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7663A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  emptySparkle: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  emptyEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#7663A8',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#292B25',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#7A7569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7663A8',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 22,
    gap: 8,
    shadowColor: '#7663A8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  emptySecondaryBtnText: {
    color: '#7663A8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom Watermark
  bottomWatermark: {
    textAlign: 'center',
    color: '#B1AA9E',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 25,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 23, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  detailModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  detailAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailAvatar: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292B25',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  detailMentionsChip: {
    backgroundColor: '#EFE7F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  detailMentionsChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7663A8',
  },
  detailEntriesCount: {
    fontSize: 12,
    color: '#8D897E',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F4F2EB',
  },
  detailScrollContent: {
    paddingBottom: 20,
  },
  detailSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#A18F7D',
    marginBottom: 8,
    marginTop: 14,
  },
  relationPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationPickerChip: {
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  relationPickerChipActive: {
    backgroundColor: '#7663A8',
    borderColor: '#7663A8',
  },
  relationPickerChipText: {
    fontSize: 12,
    color: '#656054',
    fontWeight: '500',
  },
  relationPickerChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailNoteInput: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#292B25',
    minHeight: 50,
  },
  occurrencesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  occurrencesCount: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#7663A8',
  },
  noMentionsBox: {
    padding: 16,
    backgroundColor: '#FAF8F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  noMentionsText: {
    fontSize: 12,
    color: '#8D897E',
    lineHeight: 18,
    textAlign: 'center',
  },
  occurrenceCard: {
    backgroundColor: '#FAF8F4',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  occurrenceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  occurrenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#292B25',
  },
  occurrenceDate: {
    fontSize: 11,
    color: '#8D897E',
    marginTop: 2,
  },
  occurrenceMoodBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  occurrenceMoodText: {
    fontSize: 11,
    color: '#656054',
  },
  occurrenceSnippet: {
    fontSize: 12,
    color: '#4A463E',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  openEntryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  openEntryLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7663A8',
  },
  ignorePersonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 16,
  },
  ignorePersonBtnText: {
    fontSize: 12,
    color: '#A39D94',
    fontWeight: '500',
  },

  // Manual Form Styles
  modalEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#7663A8',
    fontWeight: '700',
    marginBottom: 4,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
    marginBottom: 6,
    marginTop: 12,
  },
  formTextInput: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E8E4DA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#292B25',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F2EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C574C',
  },
  submitFormBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#7663A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitFormBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
