import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Firebase Configuration for InnerSpace
 *
 * Values can be configured via environment variables with the EXPO_PUBLIC_ prefix:
 * - EXPO_PUBLIC_FIREBASE_API_KEY
 * - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - EXPO_PUBLIC_FIREBASE_PROJECT_ID
 * - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - EXPO_PUBLIC_FIREBASE_APP_ID
 */
export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDemoFallbackKey-ReplaceWithYourActualFirebaseKey',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'innerspace-demo.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'innerspace-demo',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'innerspace-demo.appspot.com',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '102938475612',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:102938475612:web:a1b2c3d4e5f6g7h8i9j0k1',
};

/**
 * Check if the app is configured with custom Firebase credentials
 * rather than demo placeholders.
 */
export const isCustomFirebaseConfigured = (): boolean => {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  return Boolean(
    key &&
      key.trim() !== '' &&
      !key.includes('FallbackKey') &&
      !key.includes('ReplaceWith')
  );
};

// Initialize Firebase App singleton
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth singleton with React Native AsyncStorage persistence
let auth: Auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // In React Native environment, initializeAuth with AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  // If initializeAuth was already called (e.g. during fast refresh), get existing instance
  auth = getAuth(app);
}

// Initialize Firestore singleton
const db: Firestore = getFirestore(app);

export { app, auth, db };
