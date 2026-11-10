import React from 'react';
import { router } from 'expo-router';
import { NewEntryScreen } from '../screens/NewEntryScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addEntry } from '../store/slices/journalSlice';
import { selectUserId } from '../store/slices/userSlice';
import { addJournalEntry } from '../services/journalFirestoreService';

export default function NewEntryRoute() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <NewEntryScreen
      onClose={handleClose}
      onSave={(entry) => {
        dispatch(addEntry(entry));
        if (userId && userId !== 'demo-local-user') {
          addJournalEntry(userId, entry).catch((err) =>
            console.warn('Error saving entry to Firestore:', err)
          );
        }
        handleClose();
      }}
    />
  );
}
