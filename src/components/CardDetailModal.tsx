import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { JournalEntry } from '../types';
import { Polaroid } from './Polaroid';

interface CardDetailModalProps {
  entry: JournalEntry | null;
  visible: boolean;
  onClose: () => void;
  onToggleFavorite?: (entry: JournalEntry) => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (entry: JournalEntry) => void;
  fontsLoaded?: boolean;
}

const MOOD_INFO: Record<string, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  peaceful: { label: 'Calm', emoji: '😌' },
  excited: { label: 'Excited', emoji: '🥳' },
  inspired: { label: 'Inspired', emoji: '✨' },
  grateful: { label: 'Grateful', emoji: '🙏' },
  productive: { label: 'Productive', emoji: '⚡' },
  reflective: { label: 'Reflective', emoji: '💭' },
  tired: { label: 'Tired', emoji: '😴' },
  melancholy: { label: 'Melancholy', emoji: '🌧️' },
};

const WEATHER_INFO: Record<string, { label: string; emoji: string }> = {
  sunny: { label: 'Sunny', emoji: '☀️' },
  'partly-cloudy': { label: 'Partly Cloudy', emoji: '⛅' },
  cloudy: { label: 'Cloudy', emoji: '☁️' },
  rainy: { label: 'Rainy', emoji: '🌧️' },
  stormy: { label: 'Stormy', emoji: '⛈️' },
  snowy: { label: 'Snowy', emoji: '❄️' },
  windy: { label: 'Windy', emoji: '💨' },
};

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  entry,
  visible,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
  fontsLoaded = false,
}) => {
  if (!entry) return null;

  const {
    date,
    title,
    titleEmoji,
    body,
    backgroundColor = '#FAF7FB',
    textColors,
    polaroid,
    mood,
    weather,
    tags,
    isFavorite,
  } = entry;

  const colors = {
    date: textColors?.date || '#781552',
    title: textColors?.title || '#1C1335',
    body: textColors?.body || '#333333',
  };

  const moodData = mood ? MOOD_INFO[mood] : null;
  const weatherData = weather ? WEATHER_INFO[weather] : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="dark" />

        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            style={styles.circleButton}
            accessibilityRole="button"
            accessibilityLabel="Close entry"
          >
            <Feather name="x" size={22} color={colors.title} />
          </TouchableOpacity>

          <View style={styles.topBarActions}>
            {onToggleFavorite ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onToggleFavorite(entry)}
                style={styles.circleButton}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remove favorite' : 'Mark favorite'}
              >
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={isFavorite ? '#D97706' : colors.title}
                />
              </TouchableOpacity>
            ) : null}

            {onEdit ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onEdit(entry)}
                style={styles.circleButton}
                accessibilityRole="button"
                accessibilityLabel="Edit entry"
              >
                <Feather name="edit-3" size={18} color={colors.title} />
              </TouchableOpacity>
            ) : null}

            {onDelete ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onDelete(entry)}
                style={styles.circleButton}
                accessibilityRole="button"
                accessibilityLabel="Delete entry"
              >
                <Feather name="trash-2" size={18} color="#D9383A" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Scrollable Complete Card Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date & Status Pills Row */}
          <View style={styles.dateSection}>
            <View style={styles.dateBadge}>
              <Text style={[styles.dateText, { color: colors.date }]}>
                {date}
              </Text>
              {isFavorite ? (
                <Ionicons
                  name="star"
                  size={12}
                  color={colors.date}
                  style={styles.starIcon}
                />
              ) : null}
            </View>

            {moodData ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipEmoji}>{moodData.emoji}</Text>
                <Text style={[styles.metaChipText, { color: colors.title }]}>
                  {moodData.label}
                </Text>
              </View>
            ) : null}

            {weatherData ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipEmoji}>{weatherData.emoji}</Text>
                <Text style={[styles.metaChipText, { color: colors.title }]}>
                  {weatherData.label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Full Entry Title */}
          {title ? (
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.titleText,
                  { color: colors.title },
                  fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
                ]}
              >
                {title}
                {titleEmoji ? ` ${titleEmoji}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Optional Polaroid Image */}
          {polaroid ? (
            <View style={styles.polaroidWrapper}>
              <Polaroid
                image={polaroid.image}
                caption={polaroid.caption}
                tapeColor={polaroid.tapeColor}
                fontsLoaded={fontsLoaded}
              />
            </View>
          ) : null}

          {/* Full Body Text without any truncation */}
          {body ? (
            <View style={styles.bodyContainer}>
              <Text
                style={[styles.bodyText, { color: colors.body }]}
                selectable
              >
                {body}
              </Text>
            </View>
          ) : null}

          {/* Tags Section */}
          {tags && tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagBadge,
                    { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: colors.title }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  dateSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  starIcon: {
    marginBottom: 1,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  metaChipEmoji: {
    fontSize: 13,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  titleContainer: {
    marginBottom: 18,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 35,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  polaroidWrapper: {
    alignItems: 'center',
    marginVertical: 18,
  },
  bodyContainer: {
    marginTop: 6,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16.5,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

