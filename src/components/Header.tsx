
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface HeaderProps {
  name?: string;
  subtitle?: string;
  avatarUri?: any;
  onPressAvatar?: () => void;
  fontsLoaded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  name = 'Emma',
  subtitle = 'A little space for your thoughts.',
  avatarUri = require('../../assets/emma-profile.jpg'),
  onPressAvatar,
  fontsLoaded = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>INNERSPACE  /  PERSONAL JOURNAL</Text>
          <Text
            style={[
              styles.greeting,
              fontsLoaded && { fontFamily: 'PlayfairDisplay_700Bold' },
            ]}
          >
            Hello, {name}.
          </Text>
        </View>

        <TouchableOpacity
          onPress={onPressAvatar}
          activeOpacity={0.8}
          style={styles.avatarWrapper}
        >
          <Image source={avatarUri} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 26,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#A18F7D',
    fontWeight: '700',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 34,
    color: '#292B25',
    letterSpacing: -1,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#89877E',
    marginTop: 10,
    letterSpacing: 0.1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineDot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#A6A982',
    borderWidth: 2,
    borderColor: '#F8F6F0',
    right: 0,
    bottom: 0,
  },
});
