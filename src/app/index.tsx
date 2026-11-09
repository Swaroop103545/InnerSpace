import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsAuthenticated,
  login,
  register,
  logout,
} from '../store/slices/userSlice';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';

export default function Index() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter both your email and password.');
    }

    // Simulate authentication delay for smooth UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Extract a friendly display name if available
    const prefix = trimmedEmail.split('@')[0];
    const derivedName = prefix
      ? prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ')
      : 'Emma';

    dispatch(login({ email: trimmedEmail, name: derivedName }));
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

    await new Promise((resolve) => setTimeout(resolve, 500));

    dispatch(register({ name: trimmedName, email: trimmedEmail }));
  };

  const handleForgotPassword = (email: string) => {
    Alert.alert(
      'Password Recovery',
      `A recovery link has been sent to ${email}. Please check your email inbox.`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    setAuthMode('login');
  };

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
