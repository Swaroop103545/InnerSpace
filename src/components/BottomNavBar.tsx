import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'home' | 'calendar' | 'add' | 'users' | 'profile';

interface BottomNavBarProps {
  activeTab?: TabType;
  onTabPress?: (tab: TabType) => void;
  onPressAdd?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'home',
  onTabPress,
  onPressAdd,
}) => {
  const insets = useSafeAreaInsets();

  const handlePress = (tab: TabType) => {
    if (tab === 'add') {
      onPressAdd?.();
    } else {
      onTabPress?.(tab);
    }
  };

  const bottomPosition = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outerContainer, { bottom: bottomPosition }]}>
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('home')}
          style={styles.navItem}
        >
          <Ionicons
            name="home-outline"
            size={24}
            color={activeTab === 'home' ? '#6E3DE6' : '#7E7790'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('calendar')}
          style={styles.navItem}
        >
          <Feather
            name="calendar"
            size={22}
            color={activeTab === 'calendar' ? '#6E3DE6' : '#7E7790'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress('add')}
          style={styles.addButtonTouchable}
        >
          <View style={styles.addButton}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('users')}
          style={styles.navItem}
        >
          <Ionicons
            name="people-outline"
            size={23}
            color={activeTab === 'users' ? '#6E3DE6' : '#7E7790'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('profile')}
          style={styles.navItem}
        >
          <Feather
            name="user"
            size={22}
            color={activeTab === 'profile' ? '#6E3DE6' : '#7E7790'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  navBar: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 225, 238, 0.6)',
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  addButtonTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1335',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1335',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
});
