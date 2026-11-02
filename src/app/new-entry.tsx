import React from 'react';
import { router } from 'expo-router';
import { NewEntryScreen } from '../screens/NewEntryScreen';
import { useAppDispatch } from '../store/hooks';
import { addEntry } from '../store/slices/journalSlice';

export default function NewEntryRoute() {
  const dispatch = useAppDispatch();

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
        handleClose();
      }}
    />
  );
}
