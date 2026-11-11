
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type SplashScreenProps = {
  onFinish: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),

      // Text entrance
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),

      // Short welcome pause
      Animated.delay(1100),

      // Exit animation
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => {
      animation.stop();
    };
  }, [fadeAnim, scaleAnim, contentAnim, exitAnim, onFinish]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: exitAnim,
        },
      ]}
    >
      <StatusBar
        backgroundColor="#F8F5FC"
        barStyle="dark-content"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Decorative background */}
        <View style={styles.backgroundCircleOne} />
        <View style={styles.backgroundCircleTwo} />
        <View style={styles.backgroundCircleThree} />

        <View style={styles.mainContent}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Feather
                  name="book-open"
                  size={43}
                  color="#FFFFFF"
                  strokeWidth={1.6}
                />
              </View>
            </View>

            <View style={styles.logoAccent}>
              <Feather name="feather" size={17} color="#7655C9" />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.brandContent,
              {
                opacity: contentAnim,
                transform: [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.appName}>InnerSpace</Text>

            <View style={styles.brandDivider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.tagline}>
              A little space to meet yourself.
            </Text>

            <Text style={styles.description}>
              Capture your thoughts. Preserve your moments.
              {'\n'}Discover the story within.
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View
          style={[
            styles.bottomContent,
            {
              opacity: contentAnim,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color="#7655C9"
          />

          <Text style={styles.loadingText}>
            Preparing your personal space
          </Text>

          <Text style={styles.versionText}>
            YOUR STORY · YOUR SPACE
          </Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  backgroundCircleOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F0EAFB',
    top: -145,
    right: -120,
  },
  backgroundCircleTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F1EBF9',
    bottom: -110,
    left: -120,
  },
  backgroundCircleThree: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F4EFFB',
    top: '30%',
    right: -75,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  logoWrapper: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 38,
  },
  logoOuter: {
    width: 108,
    height: 108,
    borderRadius: 34,
    backgroundColor: '#E8DFF8',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 27,
    backgroundColor: '#7655C9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7655C9',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },
  logoAccent: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  brandContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#30243F',
  },
  brandDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 19,
  },
  dividerLine: {
    width: 32,
    height: 1,
    backgroundColor: '#CBBDE5',
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9878D4',
    marginHorizontal: 9,
  },
  tagline: {
    fontSize: 16,
    color: '#7655C9',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  description: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 21,
    color: '#968CA3',
    marginTop: 14,
  },
  bottomContent: {
    alignItems: 'center',
    paddingBottom: 35,
  },
  loadingText: {
    fontSize: 11,
    color: '#9489A5',
    marginTop: 12,
  },
  versionText: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#B3A8C4',
    marginTop: 30,
  },
});
