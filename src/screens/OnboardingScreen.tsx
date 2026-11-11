import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import {
  BuildFutureArt,
  PlanYourDayArt,
  YourStoriesLiveArt,
} from '../components/OnboardingArtworks';

export const ONBOARDING_STORAGE_KEY = '@innerspace_onboarding_seen_v1';

export type OnboardingScreenProps = {
  onDone: () => void;
};

type SlideItem = {
  id: string;
  step: string;
  title: string;
  subtitle: string;
};

const SLIDES: SlideItem[] = [
  {
    id: 'plan',
    step: '01 / 03',
    title: 'Plan your\nday',
    subtitle: 'Bring quiet order to scattered thoughts each morning.',
  },
  {
    id: 'future',
    step: '02 / 03',
    title: 'Build the\nFuture',
    subtitle: 'Connect daily reflections into lasting clarity and growth.',
  },
  {
    id: 'stories',
    step: '03 / 03',
    title: 'Your stories\nlive',
    subtitle: 'Every feeling, memory, and milestone kept in one space.',
  },
];

const renderSlideArt = (slideId: string, artSize: number) => {
  switch (slideId) {
    case 'plan':
      return <PlanYourDayArt size={artSize} />;
    case 'future':
      return <BuildFutureArt size={artSize} />;
    default:
      return <YourStoriesLiveArt size={artSize} />;
  }
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [contentFade]);

  const artSize = Math.min(
    260,
    Math.max(180, Math.min(Math.round(width * 0.62), Math.round(height * 0.34)))
  );
  const titleFontSize = width < 360 ? 33 : 38;
  const titleLineHeight = width < 360 ? 39 : 44;

  const isLastSlide = activeIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[activeIndex] || SLIDES[0];

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
      setActiveIndex(clamped);
      scrollRef.current?.scrollTo({
        x: clamped * width,
        animated: true,
      });
    },
    [width]
  );

  const handleNext = () => {
    if (isLastSlide) {
      onDone();
    } else {
      goToSlide(activeIndex + 1);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / width);
    if (nextIndex >= 0 && nextIndex < SLIDES.length && nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />

      <Animated.View style={[styles.container, { opacity: contentFade }]}>
        {/* Minimal Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.brandWordmark}>INNERSPACE</Text>

          <TouchableOpacity
            onPress={onDone}
            disabled={isLastSlide}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 12 }}
            style={[styles.skipButton, isLastSlide && styles.skipButtonHidden]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable 3-Screen Showcase */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScroll}
          style={styles.pager}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View style={styles.artStage}>
                {renderSlideArt(slide.id, artSize)}
              </View>

              <View style={styles.copyBlock}>
                <Text
                  style={[
                    styles.headline,
                    { fontSize: titleFontSize, lineHeight: titleLineHeight },
                  ]}
                >
                  {slide.title}
                </Text>

                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Action & Signature 3-Dash Progress Bar */}
        <View style={styles.bottomDock}>
          <View style={styles.actionRow}>
            {isLastSlide ? (
              <TouchableOpacity
                style={styles.getStartedButton}
                activeOpacity={0.85}
                onPress={onDone}
                accessibilityRole="button"
                accessibilityLabel="Get Started"
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Feather name="arrow-right" size={18} color="#121214" />
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.stepCounter}>{activeSlide.step}</Text>

                <TouchableOpacity
                  style={styles.nextCircleButton}
                  activeOpacity={0.8}
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel="Next onboarding screen"
                >
                  <Feather name="arrow-right" size={20} color="#121214" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.dashIndicatorRow}>
            {SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={slide.id}
                  onPress={() => goToSlide(idx)}
                  activeOpacity={0.75}
                  hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to step ${idx + 1}: ${slide.title.replace('\n', ' ')}`}
                >
                  <View
                    style={[
                      styles.dashIndicator,
                      isActive ? styles.dashIndicatorActive : styles.dashIndicatorInactive,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121214',
  },
  container: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 6,
  },
  brandWordmark: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: 'rgba(255, 255, 255, 0.38)',
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipButtonHidden: {
    opacity: 0,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 18,
  },
  artStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  copyBlock: {
    paddingBottom: 6,
  },
  headline: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#8E8E95',
    maxWidth: '88%',
  },
  bottomDock: {
    paddingHorizontal: 30,
    paddingTop: 8,
    paddingBottom: 22,
  },
  actionRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: 'rgba(255, 255, 255, 0.42)',
  },
  nextCircleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  getStartedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121214',
    letterSpacing: 0.2,
  },
  dashIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dashIndicator: {
    width: 34,
    height: 2.5,
    borderRadius: 2,
  },
  dashIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  dashIndicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
});
