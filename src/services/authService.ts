import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  name: string;
  subtitle: string;
  streakDays: number;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Maps Firebase Auth error codes to user-friendly error messages
 */
export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  if (
    code === 'auth/configuration-not-found' ||
    message.includes('configuration-not-found')
  ) {
    return 'Email/Password provider is not enabled in your Firebase project. In the Firebase Console, go to Build > Authentication > Sign-in method, click "Email/Password", and turn it ON.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify your details.';
    case 'auth/user-not-found':
      return 'No account was found with this email. Please check or sign up.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to too many failed attempts. Try again later.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase API key is not configured. Please supply valid Firebase credentials in .env.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Sign in existing user with email and password
 */
export async function signInUser(
  email: string,
  password: string
): Promise<AuthUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Register a new user with name, email, and password
 * Creates auth account, updates display name, and sets up initial Firestore profile document
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  try {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      password
    );
    const user = userCredential.user;

    // Update display name in Firebase Auth
    if (trimmedName) {
      await updateFirebaseProfile(user, {
        displayName: trimmedName,
      });
    }

    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const initialProfile: UserProfileData = {
      uid: user.uid,
      email: user.email,
      name: trimmedName || user.email?.split('@')[0] || 'Emma',
      subtitle: 'Tell me about your day today',
      streakDays: 1,
      createdAt: Date.now(),
    };

    try {
      await setDoc(userDocRef, initialProfile, { merge: true });
    } catch (profileError) {
      console.warn('Failed to initialize Firestore user profile doc:', profileError);
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: trimmedName || user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Fetch extended user profile data from Firestore
 */
export async function getUserProfile(
  uid: string
): Promise<UserProfileData | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore and Firebase Auth
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfileData, 'name' | 'subtitle' | 'streakDays'>>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (updates.name && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: updates.name,
      });
    }
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated Firebase user
 */
export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

