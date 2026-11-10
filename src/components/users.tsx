import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Header } from './Header';
import { useAppSelector } from '../store/hooks';
import { selectUserId, selectUserName } from '../store/slices/userSlice';

export interface UserConnection {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  description?: string;
  isFavorite?: boolean;
}

const RELATION_CHIPS = ['Friend', 'Family', 'Partner', 'Mentor', 'Colleague', 'Sibling'];
const AVATAR_COLORS = ['#EFE7F6', '#E5EDF9', '#F9EAE1', '#E7F4EB', '#FDF3D8', '#F5E6EC'];

const UsersRender = () => {
  const userId = useAppSelector(selectUserId);
  const userName = useAppSelector(selectUserName);
  const sections = useAppSelector((state) => state.journal.sections);

  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('Friend');
  const [newDescription, setNewDescription] = useState('');

  const storageKey = `@innerspace_connections_${userId || 'local'}`;

  // Load saved connections
  useEffect(() => {
    let isMounted = true;
    const loadConnections = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setConnections(parsed);
          }
        }
      } catch (err) {
        console.warn('Error loading user connections:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConnections();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Save connections helper
  const saveConnections = async (updated: UserConnection[]) => {
    setConnections(updated);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving user connections:', err);
    }
  };

  // Flatten all journal entries to dynamically compute mentions
  const allEntries = useMemo(() => {
    return sections.flatMap((section) => section.data);
  }, [sections]);

  // Compute mentions for each person dynamically from actual journal entries
  const getPersonMentions = (personName: string) => {
    if (!personName.trim()) return 0;
    const term = personName.toLowerCase().trim();
    return allEntries.filter((entry) => {
      const inTitle = entry.title?.toLowerCase().includes(term);
      const inBody = entry.body?.toLowerCase().includes(term);
      const inTags = entry.tags?.some((t) => t.toLowerCase().includes(term));
      return inTitle || inBody || inTags;
    }).length;
  };

  // Connections decorated with dynamic mentions count
  const connectionsWithMentions = useMemo(() => {
    return connections.map((conn) => ({
      ...conn,
      mentions: getPersonMentions(conn.name),
    }));
  }, [connections, allEntries]);

  // Search filtered connections
  const filteredUsers = useMemo(() => {
    return connectionsWithMentions.filter((user) =>
      `${user.name} ${user.relation} ${user.description || ''}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );
  }, [connectionsWithMentions, search]);

  const featuredUser = useMemo(() => {
    if (filteredUsers.length === 0) return null;
    return [...filteredUsers].sort((a, b) => b.mentions - a.mentions)[0];
  }, [filteredUsers]);

  const remainingUsers = useMemo(() => {
    return filteredUsers.filter((user) => user.id !== featuredUser?.id);
  }, [filteredUsers, featuredUser]);

  const toggleFavorite = (id: string) => {
    const updated = connections.map((c) =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    );
    saveConnections(updated);
  };

  const handleAddSubmit = () => {
    if (!newName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this person.');
      return;
    }

    const newConnection: UserConnection = {
      id: Date.now().toString(),
      name: newName.trim(),
      relation: newRelation.trim() || 'Friend',
      description: newDescription.trim() || undefined,
      isFavorite: false,
    };

    const nextList = [newConnection, ...connections];
    saveConnections(nextList);

    setNewName('');
    setNewRelation('Friend');
    setNewDescription('');
    setIsAddModalVisible(false);
  };

  const handleDeleteConnection = (user: UserConnection) => {
    Alert.alert(
      'Remove from Circle?',
      `Are you sure you want to remove ${user.name} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const nextList = connections.filter((c) => c.id !== user.id);
            saveConnections(nextList);
          },
        },
      ]
    );
  };

  // Generate initials and consistent background color
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
  };

  const getAvatarBg = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
  };

  const renderAvatar = (user: { name: string; avatar?: string }, size = 48) => {
    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={{ width: size, height: size, borderRadius: size / 2.5 }}
        />
      );
    }

    const initials = getInitials(user.name);
    const bg = getAvatarBg(user.name);

    return (
      <View
        style={[
          styles.initialsAvatar,
          { width: size, height: size, borderRadius: size / 2.5, backgroundColor: bg },
        ]}
      >
        <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
      </View>
    );
  };

  const renderUserCard = (item: (typeof connectionsWithMentions)[number]) => {
    const isFavorite = item.isFavorite;

    return (
      <View key={item.id} style={styles.userCard}>
        {renderAvatar(item, 48)}

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userRelation}>{item.relation}</Text>
          {item.description ? (
            <Text style={styles.userDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.mentionContainer}>
          <Text style={styles.mentionNumber}>{item.mentions}</Text>
          <Text style={styles.mentionLabel}>
            {item.mentions === 1 ? 'mention' : 'mentions'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteButton}
          activeOpacity={0.7}
          accessibilityLabel={isFavorite ? 'Unfavorite connection' : 'Favorite connection'}
        >
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteConnection(item)}
          style={styles.deleteButton}
          activeOpacity={0.7}
          accessibilityLabel="Remove connection"
        >
          <Feather name="trash-2" size={15} color="#B5AFA6" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#7663A8" />
        <Text style={styles.loadingText}>Loading your circle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header
          name={userName || 'Writer'}
          subtitle="The people who share your journey."
        />

        <View style={styles.introSection}>
          <View style={styles.introHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>YOUR CIRCLE</Text>
              <Text style={styles.heading}>The people in{'\n'}your stories.</Text>
            </View>

            <TouchableOpacity
              style={styles.headerAddBtn}
              activeOpacity={0.8}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            The special people who illuminate your memories. Mention them in your reflections to track their presence.
          </Text>
        </View>

        {/* If no connections exist at all, render the Serene Empty Screen */}
        {connections.length === 0 ? (
          <View style={styles.sereneEmptyCard}>
            <View style={styles.sereneIllustration}>
              <View style={styles.sereneCircleOuter} />
              <View style={styles.sereneCircleInner} />
              <View style={styles.sereneIconCircle}>
                <Ionicons name="people-outline" size={36} color="#7663A8" />
              </View>
              <View style={styles.sereneSparkle}>
                <Ionicons name="sparkles" size={16} color="#BFA3DC" />
              </View>
            </View>

            <Text style={styles.sereneEyebrow}>PERSONAL CONNECTIONS</Text>
            <Text style={styles.sereneTitle}>Your Circle is Empty</Text>
            <Text style={styles.sereneDescription}>
              Keep track of family, friends, and mentors who inspire your reflections.
              Add them to your circle to see how often they appear in your stories.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.serenePrimaryBtn}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Feather name="user-plus" size={16} color="#FFFFFF" />
              <Text style={styles.serenePrimaryBtnText}>Add Someone to Your Circle</Text>
            </TouchableOpacity>

            <View style={styles.sereneTipBox}>
              <Feather name="info" size={15} color="#7663A8" />
              <Text style={styles.sereneTipText}>
                Tip: When you mention a person&apos;s name in your journal entries, InnerSpace automatically calculates how often they appear here.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color="#8D897E" style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Find someone by name or relation..."
                placeholderTextColor="#AAA69B"
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={18} color="#8D897E" style={styles.clearSearch} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>People</Text>
              <Text style={styles.resultsCount}>
                {filteredUsers.length} OF {connections.length} IN CIRCLE
              </Text>
            </View>

            {/* Featured / Most Mentioned Card */}
            {featuredUser && (
              <View style={styles.featuredCard}>
                <View style={styles.featuredTop}>
                  <Text style={styles.featuredLabel}>
                    {featuredUser.mentions > 0 ? 'MOST MENTIONED' : 'IN YOUR CIRCLE'}
                  </Text>
                  <Ionicons name="sparkles" size={16} color="#7663A8" />
                </View>

                <View style={styles.featuredContent}>
                  {renderAvatar(featuredUser, 58)}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.featuredName}>{featuredUser.name}</Text>
                    <Text style={styles.featuredRelation}>{featuredUser.relation}</Text>
                    {featuredUser.description ? (
                      <Text style={styles.featuredDesc} numberOfLines={2}>
                        {featuredUser.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.featuredFooter}>
                  <View>
                    <Text style={styles.featuredNumber}>{featuredUser.mentions}</Text>
                    <Text style={styles.featuredCaption}>
                      {featuredUser.mentions === 1 ? 'TIME IN YOUR JOURNAL' : 'TIMES IN YOUR JOURNAL'}
                    </Text>
                  </View>

                  <View style={styles.featuredActionsRow}>
                    <TouchableOpacity
                      style={styles.featuredButton}
                      onPress={() => toggleFavorite(featuredUser.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.featuredButtonText}>
                        {featuredUser.isFavorite ? '♥ Saved' : '♡ Save'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.featuredDeleteBtn}
                      onPress={() => handleDeleteConnection(featuredUser)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={15} color="#8E8A80" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Remaining Connections List */}
            {remainingUsers.length > 0 && (
              <>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>Everyone else</Text>
                  <Text style={styles.listSubtitle}>YOUR CIRCLE</Text>
                </View>

                {remainingUsers.map(renderUserCard)}
              </>
            )}

            {/* Search Filter Empty State */}
            {filteredUsers.length === 0 && search.length > 0 && (
              <View style={styles.emptyState}>
                <Feather name="search" size={32} color="#AAA69B" />
                <Text style={styles.emptyTitle}>No matching connections</Text>
                <Text style={styles.emptyDescription}>
                  No one found matching &ldquo;{search}&rdquo;. Try another name or clear your search.
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearch('')}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={styles.bottomNote}>
          EVERY PERSON HAS A STORY TO TELL.
        </Text>
      </ScrollView>

      {/* Add Connection Modal */}
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>NEW CONNECTION</Text>
                <Text style={styles.modalTitle}>Add to Your Circle</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#667085" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Maya, Lucas, Dr. Chen"
              placeholderTextColor="#98A2B3"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Friend, Sister, Colleague"
              placeholderTextColor="#98A2B3"
              value={newRelation}
              onChangeText={setNewRelation}
            />

            {/* Quick Relationship Chips */}
            <View style={styles.relationChipsRow}>
              {RELATION_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.relationChip,
                    newRelation.toLowerCase() === chip.toLowerCase() && styles.relationChipActive,
                  ]}
                  onPress={() => setNewRelation(chip)}
                >
                  <Text
                    style={[
                      styles.relationChipText,
                      newRelation.toLowerCase() === chip.toLowerCase() && styles.relationChipTextActive,
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="A brief note about how you know them..."
              placeholderTextColor="#98A2B3"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddSubmit}
              >
                <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Person</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default UsersRender;

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
  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  introSection: {
    marginTop: 6,
    marginBottom: 20,
  },
  introHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#A18F7D',
    fontWeight: '700',
    marginBottom: 8,
  },
  heading: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '700',
    color: '#292B25',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  description: {
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
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 22,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292B25',
  },
  resultsCount: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#A18F7D',
    fontWeight: '700',
  },
  initialsAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '700',
    color: '#4B3E6B',
  },
  featuredCard: {
    backgroundColor: '#ECEAE1',
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#E0DDD2',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  featuredName: {
    color: '#292B25',
    fontSize: 20,
    fontWeight: '700',
  },
  featuredRelation: {
    color: '#7A7569',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  featuredDesc: {
    color: '#8D897E',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  featuredFooter: {
    borderTopWidth: 1,
    borderTopColor: '#D8D4C7',
    marginTop: 16,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredNumber: {
    fontSize: 24,
    color: '#292B25',
    fontWeight: '700',
  },
  featuredCaption: {
    color: '#8D897E',
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: 2,
    fontWeight: '600',
  },
  featuredActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredButton: {
    backgroundColor: '#292B25',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
  },
  featuredButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredDeleteBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#DDD8CB',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#292B25',
  },
  listSubtitle: {
    fontSize: 9,
    letterSpacing: 1.3,
    color: '#AAA69B',
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0EEE7',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#292B25',
    fontSize: 15,
    fontWeight: '700',
  },
  userRelation: {
    color: '#7663A8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  userDesc: {
    color: '#8D897E',
    fontSize: 11,
    marginTop: 3,
  },
  mentionContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  mentionNumber: {
    fontSize: 15,
    color: '#292B25',
    fontWeight: '700',
  },
  mentionLabel: {
    fontSize: 8,
    color: '#AAA69B',
    marginTop: 1,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  favoriteIcon: {
    fontSize: 17,
    color: '#AAA69B',
  },
  favoriteActive: {
    color: '#D77979',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#292B25',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#8D897E',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 19,
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
  sereneEmptyCard: {
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
  sereneIllustration: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sereneCircleOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F1FB',
  },
  sereneCircleInner: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EDE6F9',
  },
  sereneIconCircle: {
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
  sereneSparkle: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  sereneEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#7663A8',
    fontWeight: '700',
    marginBottom: 8,
  },
  sereneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#292B25',
    marginBottom: 10,
    textAlign: 'center',
  },
  sereneDescription: {
    fontSize: 13,
    color: '#7A7569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  serenePrimaryBtn: {
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
  serenePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sereneTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#EFECE2',
    borderRadius: 14,
    padding: 12,
    marginTop: 22,
    gap: 10,
  },
  sereneTipText: {
    flex: 1,
    fontSize: 12,
    color: '#8A8578',
    lineHeight: 18,
  },
  bottomNote: {
    textAlign: 'center',
    color: '#B1AA9E',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 25,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 23, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#7663A8',
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292B25',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F4F2EB',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E8E4DA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#292B25',
  },
  modalTextarea: {
    height: 64,
    textAlignVertical: 'top',
  },
  relationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  relationChip: {
    backgroundColor: '#F2EFE8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  relationChipActive: {
    backgroundColor: '#7663A8',
  },
  relationChipText: {
    fontSize: 12,
    color: '#656054',
    fontWeight: '500',
  },
  relationChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    backgroundColor: '#F2EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C574C',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#7663A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
