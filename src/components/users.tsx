
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { Header } from './Header';

const users = [
  {
    id: '1',
    name: 'Swaroop',
    relation: 'Brother',
    mentions: 10,
    avatar: 'https://i.pravatar.cc/150?img=12',
    description: 'Someone who is always part of your stories.',
  },
  {
    id: '2',
    name: 'Aditya',
    relation: 'Friend',
    mentions: 15,
    avatar: 'https://i.pravatar.cc/150?img=11',
    description: 'A familiar face in your everyday memories.',
  },
  {
    id: '3',
    name: 'Priya',
    relation: 'Colleague',
    mentions: 8,
    avatar: 'https://i.pravatar.cc/150?img=47',
    description: 'A part of your work-life stories.',
  },
  {
    id: '4',
    name: 'Rahul',
    relation: 'Mentor',
    mentions: 12,
    avatar: 'https://i.pravatar.cc/150?img=13',
    description: 'Someone whose advice stays with you.',
  },
];

const UsersRender = () => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.name} ${user.relation}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );
  }, [search]);

  const featuredUser = filteredUsers.length
    ? [...filteredUsers].sort((a, b) => b.mentions - a.mentions)[0]
    : null;

  const remainingUsers = filteredUsers.filter(
    user => user.id !== featuredUser?.id
  );

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const renderUser = (item: typeof users[number]) => {
    const isFavorite = favorites.includes(item.id);

    return (
      <View key={item.id} style={styles.userCard}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.userAvatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userRelation}>{item.relation}</Text>
        </View>

        <View style={styles.mentionContainer}>
          <Text style={styles.mentionNumber}>{item.mentions}</Text>
          <Text style={styles.mentionLabel}>mentions</Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteButton}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.favoriteIcon,
            isFavorite && styles.favoriteActive,
          ]}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header />

        <View style={styles.introSection}>
          <Text style={styles.sectionEyebrow}>YOUR PEOPLE</Text>
          <Text style={styles.heading}>The people in{'\n'}your stories.</Text>
          <Text style={styles.description}>
            A collection of familiar faces who make up your everyday moments.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Find someone..."
            placeholderTextColor="#AAA69B"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>People</Text>
          <Text style={styles.resultsCount}>
            {filteredUsers.length} FOUND
          </Text>
        </View>

        {featuredUser && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredTop}>
              <Text style={styles.featuredLabel}>MOST MENTIONED</Text>
              <Text style={styles.featuredStar}>✳</Text>
            </View>

            <View style={styles.featuredContent}>
              <Image
                source={{ uri: featuredUser.avatar }}
                style={styles.featuredAvatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.featuredName}>
                  {featuredUser.name}
                </Text>
                <Text style={styles.featuredRelation}>
                  {featuredUser.relation}
                </Text>
              </View>
            </View>

            <View style={styles.featuredFooter}>
              <View>
                <Text style={styles.featuredNumber}>
                  {featuredUser.mentions}
                </Text>
                <Text style={styles.featuredCaption}>
                  TIMES IN YOUR JOURNAL
                </Text>
              </View>

              <TouchableOpacity
                style={styles.featuredButton}
                onPress={() => toggleFavorite(featuredUser.id)}
              >
                <Text style={styles.featuredButtonText}>
                  {favorites.includes(featuredUser.id)
                    ? '♥ Saved'
                    : '♡ Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Everyone else</Text>
          <Text style={styles.listSubtitle}>YOUR CIRCLE</Text>
        </View>

        {remainingUsers.map(renderUser)}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyTitle}>No stories found.</Text>
            <Text style={styles.emptyDescription}>
              Try searching with another name.
            </Text>
          </View>
        )}

        <Text style={styles.bottomNote}>
          EVERY PERSON HAS A STORY TO TELL.
        </Text>
      </ScrollView>
    </View>
  );
};

export default UsersRender;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  introSection: {
    marginTop: 12,
    marginBottom: 22,
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#A18F7D',
    fontWeight: '700',
    marginBottom: 12,
  },
  heading: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '700',
    color: '#292B25',
    letterSpacing: -1,
    fontFamily: 'serif',
  },
  description: {
    color: '#89877E',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 280,
  },
  searchContainer: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#ECE9E0',
  },
  searchIcon: {
    fontSize: 26,
    color: '#8D897E',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#292B25',
  },
  clearSearch: {
    color: '#8D897E',
    fontSize: 17,
    padding: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#292B25',
  },
  resultsCount: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#A18F7D',
    fontWeight: '700',
  },
  featuredCard: {
    backgroundColor: '#E9E8DC',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  featuredLabel: {
    color: '#898A73',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  featuredStar: {
    color: '#898A73',
    fontSize: 20,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  featuredAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  featuredName: {
    color: '#292B25',
    fontSize: 22,
    fontWeight: '700',
  },
  featuredRelation: {
    color: '#89877E',
    fontSize: 13,
    marginTop: 5,
  },
  featuredFooter: {
    borderTopWidth: 1,
    borderTopColor: '#D6D6C8',
    marginTop: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredNumber: {
    fontSize: 25,
    color: '#292B25',
    fontWeight: '700',
  },
  featuredCaption: {
    color: '#898A73',
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: 3,
  },
  featuredButton: {
    backgroundColor: '#292B25',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 30,
  },
  featuredButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 17,
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
    padding: 13,
    borderRadius: 18,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#F0EEE7',
  },
  userAvatar: {
    width: 49,
    height: 49,
    borderRadius: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 13,
  },
  userName: {
    color: '#292B25',
    fontSize: 14,
    fontWeight: '700',
  },
  userRelation: {
    color: '#A19C91',
    fontSize: 12,
    marginTop: 4,
  },
  mentionContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  mentionNumber: {
    fontSize: 16,
    color: '#292B25',
    fontWeight: '700',
  },
  mentionLabel: {
    fontSize: 9,
    color: '#AAA69B',
    marginTop: 2,
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 19,
    color: '#AAA69B',
  },
  favoriteActive: {
    color: '#D77979',
  },
  emptyState: {
    paddingVertical: 45,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 35,
    color: '#AAA69B',
  },
  emptyTitle: {
    color: '#292B25',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#AAA69B',
    fontSize: 13,
    marginTop: 6,
  },
  bottomNote: {
    textAlign: 'center',
    color: '#B1AA9E',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 35,
  },
});
