import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JournalEntry } from '../types';
import { Polaroid } from './Polaroid';

interface JournalCardProps {
  entry: JournalEntry;
  onPress?: () => void;
  onLongPress?: () => void;
  fontsLoaded?: boolean;
}

const MOOD_ICONS: Record<string, string> = {
  happy: '😊',
  peaceful: '😌',
  excited: '🥳',
  inspired: '✨',
  grateful: '🙏',
  productive: '⚡',
  reflective: '💭',
  tired: '😴',
  melancholy: '🌧️',
};

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  windy: '💨',
};

export const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  onPress,
  onLongPress,
  fontsLoaded = false,
}) => {
  const {
    date,
    title,
    titleEmoji,
    body,
    backgroundColor,
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
    body: textColors?.body || '#4A4259',
  };

  const hasTitle = Boolean(title && title.trim().length > 0);
  const isBodyDuplicate = Boolean(
    hasTitle && body && body.trim() === title.trim()
  );
  const hasBody = Boolean(body && body.trim().length > 0 && !isBodyDuplicate);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[styles.card, { backgroundColor }]}
    >
      <View style={styles.cardContent}>
        <View style={polaroid ? styles.leftColumn : styles.fullColumn}>
          {/* Date Label with optional Mood, Weather & Favorite Star */}
          <View style={styles.dateRow}>
            <Text style={[styles.dateText, { color: colors.date }]}>
              {date}
            </Text>
            {mood && MOOD_ICONS[mood] ? (
              <Text style={styles.metaEmoji}>{MOOD_ICONS[mood]}</Text>
            ) : null}
            {weather && WEATHER_ICONS[weather] ? (
              <Text style={styles.metaEmoji}>{WEATHER_ICONS[weather]}</Text>
            ) : null}
            {isFavorite ? (
              <Ionicons
                name="star"
                size={12}
                color={colors.date}
                style={styles.starIcon}
              />
            ) : null}
          </View>

          {/* Title Row with Playfair Display and Emoji */}
          {/* {hasTitle ? (
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.titleText,
                  { color: colors.title },
                  fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
                ]}
                numberOfLines={2}
              >
                {title}
                {titleEmoji ? ` ${titleEmoji}` : ''}
              </Text>
            </View>
          ) : null} */}

          {/* Body Text */}
          {hasBody ? (
            <Text
              style={[styles.bodyText, { color: colors.body }]}
              numberOfLines={polaroid ? 3 : 4}
            >
              {body}
            </Text>
          ) : null}

          {/* Optional Tags */}
          {tags && tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.cardTagChip,
                    { backgroundColor: 'rgba(255, 255, 255, 0.42)' },
                  ]}
                >
                  <Text style={[styles.cardTagText, { color: colors.title }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Optional Polaroid Section */}
        {polaroid ? (
          <View style={styles.rightColumn}>
            <Polaroid
              image={polaroid.image}
              caption={polaroid.caption}
              tapeColor={polaroid.tapeColor}
              fontsLoaded={fontsLoaded}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 14,
    justifyContent: 'flex-start',
  },
  fullColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metaEmoji: {
    fontSize: 12,
  },
  starIcon: {
    marginBottom: 1,
  },
  titleRow: {
    marginBottom: 6,
  },
  titleText: {
    fontSize: 19.5,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 19.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  cardTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
