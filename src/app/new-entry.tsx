import React from 'react';
import { router } from 'expo-router';
import { NewEntryScreen } from '../screens/NewEntryScreen';

export default function NewEntryRoute() {
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
      onSave={(_entry) => {
        handleClose();
      }}
    />
  );
}

