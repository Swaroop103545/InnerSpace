import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { JournalEntry } from '../types';
import { Polaroid } from './Polaroid';

interface JournalCardProps {
  entry: JournalEntry;
  onPress?: () => void;
  fontsLoaded?: boolean;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  onPress,
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
    tags,
  } = entry;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, { backgroundColor }]}
    >
      <View style={styles.cardContent}>
        <View style={polaroid ? styles.leftColumn : styles.fullColumn}>
          {/* Date Label */}
          <Text style={[styles.dateText, { color: textColors.date }]}>
            {date}
          </Text>

          {/* Title Row */}
          {/* <View style={styles.titleRow}>
            <Text
              style={[
                styles.titleText,
                { color: textColors.title },
              ]}
            >
              {title}{' '}
              {titleEmoji ? (
                <Text style={styles.emojiText}>{titleEmoji}</Text>
              ) : null}
            </Text>
          </View> */}

          {/* Body Text */}
          <Text
            style={[styles.bodyText, { color: textColors.body }]}
            numberOfLines={polaroid ? 4 : 5}
          >
            {body}
          </Text>

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
                  <Text style={[styles.cardTagText, { color: textColors.title }]}>
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
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1.18,
    paddingRight: 10,
    justifyContent: 'center',
  },
  fullColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 0.92,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 20.5,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  emojiText: {
    fontSize: 18,
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 18.5,
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

