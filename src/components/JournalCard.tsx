
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
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
    textColors,
    polaroid,
    mood,
    weather,
    tags,
    isFavorite,
  } = entry;

  const colors = {
    date: textColors?.date || '#85818B',
    title: textColors?.title || '#24212B',
    body: textColors?.body || '#686570',
  };

  const hasTitle = Boolean(title?.trim());
  const isBodyDuplicate = Boolean(
    hasTitle && body?.trim() === title?.trim()
  );
  const hasBody = Boolean(body?.trim() && !isBodyDuplicate);

  const hasMetadata = Boolean(
    (mood && MOOD_ICONS[mood]) ||
    (weather && WEATHER_ICONS[weather]) ||
    isFavorite
  );

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={polaroid ? styles.leftColumn : styles.fullColumn}>
          {/* Metadata */}
          <View style={styles.header}>
            <Text style={[styles.dateText, { color: colors.date }]}>
              {date}
            </Text>

            {hasMetadata && (
              <View style={styles.metadata}>
                {mood && MOOD_ICONS[mood] ? (
                  <Text style={styles.metaEmoji}>
                    {MOOD_ICONS[mood]}
                  </Text>
                ) : null}

                {weather && WEATHER_ICONS[weather] ? (
                  <Text style={styles.metaEmoji}>
                    {WEATHER_ICONS[weather]}
                  </Text>
                ) : null}

                {isFavorite ? (
                  <Ionicons
                    name="star"
                    size={13}
                    color="#C69A45"
                  />
                ) : null}
              </View>
            )}
          </View>

          {/* Title */}
          {hasTitle ? (
            <Text
              style={[
                styles.titleText,
                { color: colors.title },
                fontsLoaded
                  ? { fontFamily: 'PlayfairDisplay_700Bold' }
                  : null,
              ]}
              numberOfLines={2}
            >
              {title}
              {titleEmoji ? ` ${titleEmoji}` : ''}
            </Text>
          ) : null}

          {/* Body */}
          {hasBody ? (
            <Text
              style={[styles.bodyText, { color: colors.body }]}
              numberOfLines={polaroid ? 3 : 4}
            >
              {body}
            </Text>
          ) : null}

          {/* Tags */}
          {tags && tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.slice(0, 3).map((tag) => (
                <Text key={tag} style={styles.cardTagText}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Polaroid */}
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
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAE8ED',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  leftColumn: {
    flex: 1,
    paddingRight: 16,
  },

  fullColumn: {
    flex: 1,
  },

  rightColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  dateText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },

  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  metaEmoji: {
    fontSize: 13,
  },

  titleText: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.45,
    marginBottom: 7,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
    }),
  },

  bodyText: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: 0.05,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 13,
  },

  cardTagText: {
    color: '#898590',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
