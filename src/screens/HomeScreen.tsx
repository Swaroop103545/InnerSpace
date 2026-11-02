import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';

import { Header } from '../components/Header';
import { EntriesTopBar, MonthSectionHeader } from '../components/EntriesHeader';
import { JournalCard } from '../components/JournalCard';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { JournalSection, JournalEntry, DisplayedJournalSection } from '../types';
import { NewEntryScreen } from './NewEntryScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_SECTIONS: JournalSection[] = [
  {
    id: 'oct-2026',
    month: 'OCTOBER',
    year: '2026',
    data: [
      {
        id: 'oct-1',
        date: 'FRIDAY, OCT 12',
        title: 'Sunny Coffee House',
        body: 'Spent the afternoon at that adorable little cafe. The matcha latte was delicious, and the warm sunlight through the window was perfect.',
        backgroundColor: '#EB7AB7',
        textColors: {
          date: '#781552',
          title: '#470938',
          body: '#73175A',
        },
        polaroid: {
          image: require('../../assets/matcha-cafe.jpg'),
          caption: 'Matcha Day 🍵',
          tapeColor: 'rgba(182, 140, 244, 0.72)',
        },
      },
      {
        id: 'oct-2',
        date: 'TUESDAY, OCT 09',
        title: 'Pumpkin Patch\nAutumn',
        titleEmoji: '🍂',
        body: 'Went pumpkin picking with Clara today! Finding the roundest pumpkin was harder than expected, but so much fun.',
        backgroundColor: '#E56338',
        textColors: {
          date: '#722108',
          title: '#3B0E01',
          body: '#6F230A',
        },
        polaroid: {
          image: require('../../assets/clara-pumpkin.jpg'),
          caption: 'Clara & Me 🎃',
          tapeColor: 'rgba(255, 185, 45, 0.8)',
        },
      },
      {
        id: 'oct-3',
        date: 'SUNDAY, OCT 07',
        title: 'Quiet Rainy Journaling',
        body: 'A very peaceful day reading and drawing in my bed. Sometimes you just need to turn your phone off and drink hot cinnamon apple tea.',
        backgroundColor: '#2AB565',
        textColors: {
          date: '#0E5B2C',
          title: '#073519',
          body: '#0A4C25',
        },
      },
    ],
  },
  {
    id: 'sep-2026',
    month: 'SEPTEMBER',
    year: '2026',
    data: [
      {
        id: 'sep-1',
        date: 'WEDNESDAY, SEP 28',
        title: 'Golden Hour Walk',
        titleEmoji: '🌅',
        body: 'The evening light filtering through the maple trees was absolutely breathtaking today. Felt so grounded and calm after a hectic week.',
        backgroundColor: '#F2A33A',
        textColors: {
          date: '#7A4705',
          title: '#3D1F00',
          body: '#6E3C04',
        },
        polaroid: {
          image: require('../../assets/pumpkin-patch-2.jpg'),
          caption: 'Warm Sunlight ✨',
          tapeColor: 'rgba(255, 230, 150, 0.85)',
        },
      },
      {
        id: 'sep-2',
        date: 'SATURDAY, SEP 24',
        title: 'Farmers Market Haul',
        titleEmoji: '💐',
        body: 'Picked up fresh lavender bundles, warm artisan sourdough bread, and wildflowers. The entire apartment smells like fresh honey and blossoms.',
        backgroundColor: '#8E7CE6',
        textColors: {
          date: '#3B298A',
          title: '#201257',
          body: '#3C2A85',
        },
      },
      {
        id: 'sep-3',
        date: 'MONDAY, SEP 19',
        title: 'Art Studio Session',
        titleEmoji: '🎨',
        body: 'Tried water coloring botanical leaves in my sketchbook. Messy hands, quiet mind. Sometimes the unplanned strokes turn out to be the most beautiful.',
        backgroundColor: '#2EBFA5',
        textColors: {
          date: '#0B594C',
          title: '#04362E',
          body: '#0A5246',
        },
        polaroid: {
          image: require('../../assets/matcha-latte.jpg'),
          caption: 'Latte & Paints ☕',
          tapeColor: 'rgba(140, 230, 200, 0.8)',
        },
      },
      {
        id: 'sep-4',
        date: 'THURSDAY, SEP 15',
        title: 'Late Night Reading',
        titleEmoji: '📖',
        body: 'Finished the last three chapters with vanilla candlelight and lo-fi piano tunes playing softly. It was the exact slow recharge I needed.',
        backgroundColor: '#D95F85',
        textColors: {
          date: '#6E1B39',
          title: '#3B091C',
          body: '#691834',
        },
      },
      {
        id: 'sep-5',
        date: 'SUNDAY, SEP 04',
        title: 'Baking Cinnamon Rolls',
        titleEmoji: '🥐',
        body: 'Sunday morning dough kneading therapy! The sugary glaze dripped all over the counter, but the rolls came out warm, fluffy, and perfection.',
        backgroundColor: '#EB7751',
        textColors: {
          date: '#782808',
          title: '#3D1201',
          body: '#6E2306',
        },
        polaroid: {
          image: require('../../assets/matcha-latte-2.jpg'),
          caption: 'Sweet Morning 🍯',
          tapeColor: 'rgba(255, 200, 140, 0.8)',
        },
      },
    ],
  },
  {
    id: 'aug-2026',
    month: 'AUGUST',
    year: '2026',
    data: [
      {
        id: 'aug-1',
        date: 'FRIDAY, AUG 28',
        title: 'Stargazing On The Hill',
        titleEmoji: '✨',
        body: 'Laid out a checkered blanket and watched shooting stars until midnight. The air was crisp and full of cricket songs.',
        backgroundColor: '#5A8EE6',
        textColors: {
          date: '#163B7C',
          title: '#0A204C',
          body: '#153673',
        },
      },
      {
        id: 'aug-2',
        date: 'SUNDAY, AUG 16',
        title: 'Coastal Breeze & Journal',
        titleEmoji: '🌊',
        body: 'Sitting by the rocky cove with cool salt spray and my sketchbook was pure bliss. Watched sailboats glide across the horizon.',
        backgroundColor: '#2AB565',
        textColors: {
          date: '#0E5B2C',
          title: '#073519',
          body: '#0A4C25',
        },
        polaroid: {
          image: require('../../assets/matcha-cafe.jpg'),
          caption: 'By The Sea 🐚',
          tapeColor: 'rgba(180, 240, 230, 0.85)',
        },
      },
      {
        id: 'aug-3',
        date: 'THURSDAY, AUG 13',
        title: 'Vintage Flea Market',
        titleEmoji: '👒',
        body: 'Found an old leather-bound sketchbook and an amber glass bottle at the weekend vintage fair. Such hidden treasures!',
        backgroundColor: '#E56338',
        textColors: {
          date: '#722108',
          title: '#3B0E01',
          body: '#6F230A',
        },
      },
      {
        id: 'aug-4',
        date: 'SATURDAY, AUG 01',
        title: 'Midsummer Peach Cobbler',
        titleEmoji: '🍑',
        body: 'Baked fresh peach cobbler with vanilla bean ice cream. Summer evenings with good friends and warm dessert are unmatched.',
        backgroundColor: '#EB7AB7',
        textColors: {
          date: '#781552',
          title: '#470938',
          body: '#73175A',
        },
        polaroid: {
          image: require('../../assets/clara-pumpkin.jpg'),
          caption: 'Peachy Days 🍑',
          tapeColor: 'rgba(255, 215, 175, 0.85)',
        },
      },
    ],
  },
];

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sections, setSections] = useState<JournalSection[]>(INITIAL_SECTIONS);
  const [sortDescending, setSortDescending] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Caveat_600SemiBold,
  });

  const handleCardPress = (entry: JournalEntry) => {
    // Interactive card touch feedback
  };

  const handleSortPress = () => {
    setSortDescending((prev) => !prev);
  };

  const toggleSection = (sectionId: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const displayedSections = useMemo<DisplayedJournalSection[]>(() => {
    const baseSections = sortDescending
      ? sections
      : [...sections].reverse().map((section) => ({
          ...section,
          data: [...section.data].reverse(),
        }));

    return baseSections.map((section) => {
      const isExpanded = !collapsedSections[section.id];
      return {
        ...section,
        totalCount: section.data.length,
        isExpanded,
        data: isExpanded ? section.data : [],
      };
    });
  }, [sections, sortDescending, collapsedSections]);

  const handleAddPress = () => {
    setIsNewEntryOpen(true);
  };

  const handleSaveNewEntry = (newEntry: JournalEntry) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    const sectionId = 'nov-2026';
    setSections((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === sectionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          data: [newEntry, ...updated[existingIndex].data],
        };
        return updated;
      } else {
        const newSection: JournalSection = {
          id: sectionId,
          month: 'NOVEMBER',
          year: '2026',
          data: [newEntry],
        };
        return [newSection, ...prev];
      }
    });

    setIsNewEntryOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.container}>
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
                name="Emma"
                subtitle="Tell me about your day today"
                avatarUri={require('../../assets/emma-profile.jpg')}
                fontsLoaded={fontsLoaded}
                onPressAvatar={() => setActiveTab('profile')}
              />

              {/* All Entries Top Bar with Sort Filter */}
              <EntriesTopBar
                title="All Entries"
                onPressSort={handleSortPress}
                sortLabel="Sort"
              />
            </View>
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />

        {/* Floating Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={(tab) => setActiveTab(tab)}
          onPressAdd={handleAddPress}
        />

        {/* New Entry Modal triggered by the PLUS button */}
        <Modal
          visible={isNewEntryOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsNewEntryOpen(false)}
        >
          <NewEntryScreen
            onClose={() => setIsNewEntryOpen(false)}
            onSave={handleSaveNewEntry}
            fontsLoaded={fontsLoaded}
          />
        </Modal>
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
    paddingBottom: 110, // Extra padding to allow smooth scrolling above floating nav bar
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
});
