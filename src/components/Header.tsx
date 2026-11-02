import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  name?: string;
  subtitle?: string;
  avatarUri?: any;
  onPressAvatar?: () => void;
  fontsLoaded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  name = 'Emma',
  subtitle = 'Tell me about your day today',
  avatarUri = require('../../assets/emma-profile.jpg'),
  onPressAvatar,
  fontsLoaded = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.greeting,
            fontsLoaded ? { fontFamily: 'PlayfairDisplay_700Bold' } : null,
          ]}
        >
          Hey, {name}!
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressAvatar}
        style={styles.avatarTouchable}
      >
        <LinearGradient
          colors={['#FFAD7E', '#FFE396', '#FF9EC5', '#F57BA4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradientRing}
        >
          <View style={styles.avatarInnerBorder}>
            <Image
              source={avatarUri}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1335',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    fontSize: 16,
    color: '#79718A',
    marginTop: 4,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  smiley: {
    fontSize: 16,
    color: '#79718A',
    marginTop: 1,
    fontWeight: '400',
  },
  avatarTouchable: {
    marginTop: 4,
    shadowColor: '#F78CA0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 1.5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
});

