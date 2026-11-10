import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsAuthenticated,
  selectAuthIsInitialized,
  setFullUserProfile,
  setAuthInitialized,
  logout,
} from '../store/slices/userSlice';
import {
  setEntries,
  setIsLoadingEntries,
} from '../store/slices/journalSlice';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import {
  signInUser,
  registerUser,
  resetPassword,
  signOutUser,
  subscribeToAuthState,
  getUserProfile,
} from '../services/authService';
import {
  subscribeToJournalEntries,
  seedDefaultEntriesIfEmpty,
} from '../services/journalFirestoreService';
import { isCustomFirebaseConfigured } from '../services/firebase';

export default function Index() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthIsInitialized);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const unsubscribeJournalRef = useRef<(() => void) | null>(null);

  // Subscribe to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
      // Clean up previous journal subscription if any
      if (unsubscribeJournalRef.current) {
        unsubscribeJournalRef.current();
        unsubscribeJournalRef.current = null;
      }

      if (firebaseUser) {
        try {
          // Fetch extended Firestore profile
          const userProfile = await getUserProfile(firebaseUser.uid);

          const displayName =
            userProfile?.name ||
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Emma';

          dispatch(
            setFullUserProfile({
              uid: firebaseUser.uid,
              name: displayName,
              email: firebaseUser.email || '',
              subtitle:
                userProfile?.subtitle || 'Tell me about your day today',
              streakDays: userProfile?.streakDays ?? 1,
              photoURL: firebaseUser.photoURL,
            })
          );

          // Listen to user's journal entries in real-time from Firestore
          dispatch(setIsLoadingEntries(true));
          unsubscribeJournalRef.current = subscribeToJournalEntries(
            firebaseUser.uid,
            async (entries) => {
              if (entries.length === 0) {
                // If brand new user with no entries, seed starter entries
                try {
                  const seeded = await seedDefaultEntriesIfEmpty(
                    firebaseUser.uid
                  );
                  dispatch(setEntries(seeded));
                } catch {
                  dispatch(setEntries([]));
                }
              } else {
                dispatch(setEntries(entries));
              }
            },
            (error) => {
              console.warn('Firestore subscription notice:', error.message);
              dispatch(setIsLoadingEntries(false));
            }
          );
        } catch (err) {
          console.warn('Error loading user profile or entries:', err);
          dispatch(setAuthInitialized(true));
        }
      } else {
        dispatch(logout());
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeJournalRef.current) {
        unsubscribeJournalRef.current();
      }
    };
  }, [dispatch]);

  const handleLogin = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter both your email and password.');
    }

    try {
      await signInUser(trimmedEmail, password);
    } catch (err: any) {
      if (
        err.message.includes('configuration-not-found') ||
        err.message.includes('Email/Password provider') ||
        (!isCustomFirebaseConfigured() &&
          (err.message.includes('API key') || err.message.includes('invalid-credential')))
      ) {
        Alert.alert(
          'Email/Password Provider Not Enabled',
          'In your Firebase Console:\n1. Go to Build > Authentication\n2. Open the "Sign-in method" tab\n3. Click "Email/Password" and toggle it ON\n\nWould you like to use Demo Mode while enabling it in Firebase?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use Demo Mode',
              onPress: () => {
                const prefix = trimmedEmail.split('@')[0];
                const derivedName = prefix
                  ? prefix.charAt(0).toUpperCase() +
                    prefix.slice(1).replace(/[._-]/g, ' ')
                  : 'Emma';
                dispatch(
                  setFullUserProfile({
                    uid: 'demo-local-user',
                    email: trimmedEmail,
                    name: derivedName,
                    subtitle: 'Tell me about your day today',
                    streakDays: 14,
                  })
                );
              },
            },
          ]
        );
        return;
      }
      throw err;
    }
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      throw new Error('Please complete all required fields.');
    }

    try {
      await registerUser(trimmedName, trimmedEmail, password);
    } catch (err: any) {
      if (
        err.message.includes('configuration-not-found') ||
        err.message.includes('Email/Password provider') ||
        (!isCustomFirebaseConfigured() &&
          (err.message.includes('API key') || err.message.includes('invalid-credential')))
      ) {
        Alert.alert(
          'Email/Password Provider Not Enabled',
          'In your Firebase Console:\n1. Go to Build > Authentication\n2. Open the "Sign-in method" tab\n3. Click "Email/Password" and toggle it ON\n\nWould you like to use Demo Mode while enabling it in Firebase?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use Demo Mode',
              onPress: () => {
                dispatch(
                  setFullUserProfile({
                    uid: 'demo-local-user',
                    email: trimmedEmail,
                    name: trimmedName,
                    subtitle: 'Tell me about your day today',
                    streakDays: 1,
                  })
                );
              },
            },
          ]
        );
        return;
      }
      throw err;
    }
  };

  const handleForgotPassword = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Email required', 'Please enter your email address first.');
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      Alert.alert(
        'Password Recovery',
        `A recovery link has been sent to ${trimmedEmail}. Please check your email inbox.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      if (!isCustomFirebaseConfigured()) {
        Alert.alert(
          'Password Recovery',
          `A recovery link has been sent to ${trimmedEmail} (Simulated). Connect your Firebase project in .env to send real password emails.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Password Recovery Error', error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch {
      // Clean up Redux regardless of network
      dispatch(logout());
    }
    setAuthMode('login');
  };

  // Initial loading splash screen while Firebase determines auth persistence
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.brandBadge}>
          <Ionicons name="book-outline" size={32} color="#7663A8" />
        </View>
        <Text style={styles.loadingTitle}>InnerSpace</Text>
        <ActivityIndicator
          size="small"
          color="#7663A8"
          style={styles.loadingSpinner}
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
          onSwitch={() => setAuthMode('register')}
        />
      );
    }
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onSwitch={() => setAuthMode('login')}
      />
    );
  }

  return <HomeScreen onLogout={handleLogout} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFEBF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#302B38',
    letterSpacing: -0.5,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});
