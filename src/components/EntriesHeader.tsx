import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MonthSectionHeaderProps {
  month?: string;
  year?: string;
  entryCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const MonthSectionHeader: React.FC<MonthSectionHeaderProps> = ({
  month = 'OCTOBER',
  year = '2026',
  entryCount = 3,
  isExpanded = true,
  onToggle,
}) => {
  const [animatedAngle] = useState(() => new Animated.Value(isExpanded ? 1 : 0));

  useEffect(() => {
    Animated.spring(animatedAngle, {
      toValue: isExpanded ? 1 : 0,
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, animatedAngle]);

  const chevronRotation = animatedAngle.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={onToggle ? 0.75 : 1}
      onPress={onToggle}
      disabled={!onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      accessibilityLabel={`${month} ${year}, ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}, ${isExpanded ? 'expanded' : 'collapsed'}`}
      accessibilityHint={onToggle ? "Toggles this month's entries" : undefined}
      style={[
        styles.sectionHeaderContainer,
        !isExpanded && styles.sectionHeaderCollapsed,
      ]}
    >
      <View style={styles.dateSection}>
        <View style={styles.dateCol}>
          <View style={[styles.monthPill, !isExpanded && styles.monthPillCollapsed]}>
            <Text style={styles.monthText}>{month}</Text>
            <Text style={styles.monthText}>{year}</Text>
          </View>
        </View>

        <View style={styles.dividerRow}>
          <Text style={styles.entriesCount}>
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </Text>
          <View style={styles.dividerLine} />
          {onToggle ? (
            <View style={[styles.chevronBadge, !isExpanded && styles.chevronBadgeCollapsed]}>
              <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={isExpanded ? '#32234D' : '#79718A'}
                />
              </Animated.View>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export interface EntriesTopBarProps {
  title?: string;
  onPressSort?: () => void;
  sortLabel?: string;
  onPressSearch?: () => void;
  isSearchActive?: boolean;
}

export const EntriesTopBar: React.FC<EntriesTopBarProps> = ({
  title = 'All Entries',
  onPressSort,
  sortLabel = 'Sort',
  onPressSearch,
  isSearchActive = false,
}) => {
  return (
    <View style={styles.topBarContainer}>
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <View style={styles.topBarActions}>
          {onPressSearch ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onPressSearch}
              style={[
                styles.iconActionButton,
                isSearchActive && styles.iconActionButtonActive,
              ]}
            >
              <Ionicons
                name="search"
                size={16}
                color={isSearchActive ? '#6E3DE6' : '#2F2448'}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPressSort}
            style={styles.sortButton}
          >
            <Ionicons name="swap-vertical" size={15} color="#2F2448" />
            <Text style={styles.sortText}>{sortLabel}</Text>
            <Ionicons name="chevron-down" size={13} color="#2F2448" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export interface EntriesHeaderProps {
  title?: string;
  month?: string;
  year?: string;
  entryCount?: number;
  onPressSort?: () => void;
  showTitleRow?: boolean;
  showDateSection?: boolean;
  sortLabel?: string;
  isExpanded?: boolean;
  onToggleMonth?: () => void;
}

export const EntriesHeader: React.FC<EntriesHeaderProps> = ({
  title = 'All Entries',
  month = 'OCTOBER',
  year = '2026',
  entryCount = 3,
  onPressSort,
  showTitleRow = true,
  showDateSection = true,
  sortLabel = 'Sort',
  isExpanded = true,
  onToggleMonth,
}) => {
  return (
    <View style={styles.container}>
      {showTitleRow && (
        <EntriesTopBar
          title={title}
          onPressSort={onPressSort}
          sortLabel={sortLabel}
        />
      )}
      {showDateSection && (
        <MonthSectionHeader
          month={month}
          year={year}
          entryCount={entryCount}
          isExpanded={isExpanded}
          onToggle={onToggleMonth}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  topBarContainer: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1C1335',
    letterSpacing: -0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconActionButtonActive: {
    backgroundColor: '#F3ECFD',
    borderColor: '#6E3DE6',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E1EE',
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2F2448',
    marginHorizontal: 5,
  },
  sectionHeaderContainer: {
    backgroundColor: '#FAF7FB',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sectionHeaderCollapsed: {
    paddingBottom: 8,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: {
    alignItems: 'flex-start',
  },
  monthPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DFD9E8',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 3.5,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPillCollapsed: {
    backgroundColor: '#F5F1F9',
    borderColor: '#D8CFE5',
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1335',
    letterSpacing: 0.8,
  },
  dividerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  entriesCount: {
    fontSize: 13.5,
    color: '#79718A',
    fontWeight: '500',
    marginRight: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAE5F2',
  },
  chevronBadge: {
    marginLeft: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD9E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chevronBadgeCollapsed: {
    backgroundColor: '#F0EAF7',
    borderColor: '#CEC4DF',
  },
});
