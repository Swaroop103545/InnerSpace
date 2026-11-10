import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry } from '../types';
import { INITIAL_SECTIONS } from '../store/initialData';

// Asset dictionary to restore polaroid images cleanly when loaded from Firestore
const ASSET_MAP: Record<string, any> = {
  'matcha-cafe.jpg': require('../../assets/matcha-cafe.jpg'),
  'clara-pumpkin.jpg': require('../../assets/clara-pumpkin.jpg'),
  'pumpkin-patch-2.jpg': require('../../assets/pumpkin-patch-2.jpg'),
  'matcha-latte.jpg': require('../../assets/matcha-latte.jpg'),
  'matcha-latte-2.jpg': require('../../assets/matcha-latte-2.jpg'),
  'emma-avatar.jpg': require('../../assets/emma-avatar.jpg'),
  'emma-profile.jpg': require('../../assets/emma-profile.jpg'),
};

const getEntriesCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'entries');
};

const getEntryDocRef = (userId: string, entryId: string) => {
  return doc(db, 'users', userId, 'entries', entryId);
};

// Known demo IDs and titles to guarantee demo data is NEVER displayed by default
const DEMO_ENTRY_IDS = new Set([
  'oct-1', 'oct-2', 'oct-3',
  'sep-1', 'sep-2', 'sep-3', 'sep-4', 'sep-5',
  'aug-1', 'aug-2', 'aug-3', 'aug-4',
]);

const DEMO_TITLES = new Set([
  'sunny coffee house',
  'pumpkin patch autumn',
  'quiet rainy journaling',
  'golden hour walk',
  'farmers market haul',
  'art studio session',
  'late night reading',
  'baking cinnamon rolls',
  'stargazing on the hill',
  'coastal breeze & journal',
  'vintage flea market',
  'midsummer peach cobbler',
]);

/**
 * Checks if an entry is demo/dummy data
 */
export function isDemoEntry(entry: Partial<JournalEntry>): boolean {
  if (!entry) return false;
  if (entry.id && DEMO_ENTRY_IDS.has(entry.id)) return true;
  if (entry.title && DEMO_TITLES.has(entry.title.trim().toLowerCase())) return true;
  return false;
}

/**
 * Strips undefined values and sanitizes objects so Firestore accepts them cleanly
 */
function sanitizeEntryForFirestore(entry: Partial<JournalEntry>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, val] of Object.entries(entry)) {
    if (val === undefined) continue;

    if (key === 'polaroid' && val && typeof val === 'object' && !Array.isArray(val)) {
      const cleanPolaroid: Record<string, any> = {};
      const polaroidVal = val as Record<string, any>;
      for (const [pKey, pVal] of Object.entries(polaroidVal)) {
        if (pVal !== undefined) {
          // In React Native bundling, require() returns a transient number.
          // We omit transient numbers and store the assetKey so it resolves across all sessions.
          if (pKey === 'image' && typeof pVal === 'number') {
            continue;
          }
          cleanPolaroid[pKey] = pVal;
        }
      }
      if (polaroidVal.assetKey) {
        cleanPolaroid.assetKey = polaroidVal.assetKey;
      }
      sanitized[key] = cleanPolaroid;
    } else if (key === 'textColors' && val && typeof val === 'object') {
      sanitized[key] = {
        date: (val as any).date || '#781552',
        title: (val as any).title || '#1C1335',
        body: (val as any).body || '#333333',
      };
    } else if (key === 'tags' && Array.isArray(val)) {
      sanitized[key] = val.filter((t) => typeof t === 'string' && t.trim().length > 0);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Converts a Firestore document snapshot data into a type-safe JournalEntry
 */
function mapDocToJournalEntry(id: string, data: Record<string, any>): JournalEntry {
  let polaroid = data.polaroid || undefined;
  if (polaroid) {
    const key = polaroid.assetKey;
    const resolvedImage = (key && ASSET_MAP[key]) ? ASSET_MAP[key] : (polaroid.image || ASSET_MAP['matcha-cafe.jpg']);
    polaroid = {
      ...polaroid,
      image: resolvedImage,
    };
  }

  return {
    id,
    date: data.date || '',
    title: data.title || '',
    titleEmoji: data.titleEmoji || '',
    body: data.body || '',
    backgroundColor: data.backgroundColor || '#FAF7FB',
    textColors: data.textColors || {
      date: '#781552',
      title: '#1C1335',
      body: '#333333',
    },
    polaroid,
    mood: data.mood || undefined,
    weather: data.weather || undefined,
    tags: Array.isArray(data.tags) ? data.tags : [],
    alignment: data.alignment || 'left',
    fontFamily: data.fontFamily || undefined,
    isFavorite: Boolean(data.isFavorite),
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
  };
}

/**
 * 1. CREATE: Add a new journal entry to Firestore
 */
export async function addJournalEntry(
  userId: string,
  entry: Partial<JournalEntry>
): Promise<JournalEntry> {
  if (!userId) {
    throw new Error('User ID is required to create a journal entry.');
  }

  const entriesRef = getEntriesCollectionRef(userId);
  const newDocRef = entry.id ? getEntryDocRef(userId, entry.id) : doc(entriesRef);
  const entryId = newDocRef.id;

  const timestamp = entry.timestamp || Date.now();
  const completeEntry: JournalEntry = {
    id: entryId,
    date:
      entry.date ||
      new Date(timestamp)
        .toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: '2-digit',
        })
        .toUpperCase(),
    title: entry.title || 'Untitled Entry',
    titleEmoji: entry.titleEmoji || '',
    body: entry.body || '',
    backgroundColor: entry.backgroundColor || '#FAF7FB',
    textColors: entry.textColors || {
      date: '#781552',
      title: '#1C1335',
      body: '#333333',
    },
    polaroid: entry.polaroid,
    mood: entry.mood,
    weather: entry.weather,
    tags: entry.tags || [],
    alignment: entry.alignment || 'left',
    fontFamily: entry.fontFamily,
    isFavorite: Boolean(entry.isFavorite),
    timestamp,
  };

  const firestoreData = {
    ...sanitizeEntryForFirestore(completeEntry),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newDocRef, firestoreData);
  return completeEntry;
}

/**
 * 2. READ: Fetch all journal entries for a user once
 */
export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  const q = query(
    getEntriesCollectionRef(userId),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  querySnapshot.forEach((docSnap) => {
    const entry = mapDocToJournalEntry(docSnap.id, docSnap.data());
    // Only return user entries, never demo entries
    if (!isDemoEntry(entry)) {
      entries.push(entry);
    }
  });

  return entries;
}

/**
 * 2b. READ LIVE: Subscribe to real-time updates for a user's journal entries
 */
export function subscribeToJournalEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    getEntriesCollectionRef(userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      const demoDocsToDelete: any[] = [];

      snapshot.forEach((docSnap) => {
        const entry = mapDocToJournalEntry(docSnap.id, docSnap.data());
        if (isDemoEntry(entry)) {
          // Identify any legacy demo documents in Firestore to clean them up
          demoDocsToDelete.push(docSnap.ref);
        } else {
          entries.push(entry);
        }
      });

      // Silently purge demo entries from Firestore in background so Firestore console remains clean
      if (demoDocsToDelete.length > 0) {
        Promise.all(demoDocsToDelete.map((ref) => deleteDoc(ref))).catch((err) =>
          console.warn('Notice: Background demo data cleanup in Firestore:', err)
        );
      }

      onUpdate(entries);
    },
    (error) => {
      console.warn('Error listening to journal entries:', error);
      onError?.(error);
    }
  );
}

/**
 * 3. UPDATE: Update an existing journal entry in Firestore
 */
export async function updateJournalEntry(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  if (!userId || !entry.id) {
    throw new Error('User ID and entry ID are required to update a journal entry.');
  }

  const entryRef = getEntryDocRef(userId, entry.id);
  const firestoreData = {
    ...sanitizeEntryForFirestore(entry),
    updatedAt: Date.now(),
  };

  await updateDoc(entryRef, firestoreData);
}

/**
 * 4. DELETE: Delete a journal entry from Firestore
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('User ID and entry ID are required to delete a journal entry.');
  }

  const entryRef = getEntryDocRef(userId, entryId);
  await deleteDoc(entryRef);
}

/**
 * Toggle favorite status for a journal entry
 */
export async function toggleFavoriteJournalEntry(
  userId: string,
  entryId: string,
  isFavorite: boolean
): Promise<void> {
  if (!userId || !entryId) return;

  const entryRef = getEntryDocRef(userId, entryId);
  await updateDoc(entryRef, {
    isFavorite,
    updatedAt: Date.now(),
  });
}

/**
 * 5. BATCH CREATE / SYNC: Store journal entries to Firebase Firestore
 * Writes entries using an atomic Firestore writeBatch
 */
export async function storeAllEntriesToFirestore(
  userId: string,
  entries: JournalEntry[] = []
): Promise<number> {
  if (!userId) {
    throw new Error('User ID is required to store entries to Firebase.');
  }

  // Ensure demo entries are never saved to Firebase
  const realEntries = (entries || []).filter((e) => !isDemoEntry(e));

  if (realEntries.length === 0) {
    return 0;
  }

  const batch = writeBatch(db);

  for (const entry of realEntries) {
    const docRef = getEntryDocRef(userId, entry.id);
    const sanitized = sanitizeEntryForFirestore(entry);
    batch.set(
      docRef,
      {
        ...sanitized,
        createdAt: entry.timestamp || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return realEntries.length;
}

/**
 * Retrieve user's Firestore entries
 */
export async function seedDefaultEntriesIfEmpty(
  userId: string
): Promise<JournalEntry[]> {
  if (!userId) return [];
  return await getJournalEntries(userId);
}

/**
 * Clear all journal entries for a user in Firestore
 */
export async function clearAllUserEntries(userId: string): Promise<void> {
  if (!userId) return;

  const currentEntries = await getJournalEntries(userId);
  if (currentEntries.length === 0) return;

  const deleteBatch = writeBatch(db);
  for (const entry of currentEntries) {
    deleteBatch.delete(getEntryDocRef(userId, entry.id));
  }
  await deleteBatch.commit();
}

/**
 * Reset entries: clears all entries in Firestore
 */
export async function resetUserEntriesToDemo(userId: string): Promise<void> {
  await clearAllUserEntries(userId);
}
