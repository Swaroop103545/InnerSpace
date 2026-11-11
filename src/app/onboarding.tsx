import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ONBOARDING_STORAGE_KEY,
  OnboardingScreen,
} from '../screens/OnboardingScreen';

export default function OnboardingRoute() {
  const handleDone = () => {
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').catch((err) =>
      console.warn('Failed to persist onboarding completion:', err)
    );
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return <OnboardingScreen onDone={handleDone} />;
}

