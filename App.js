import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { store } from './src/store';
import { HomeScreen } from './src/screens/HomeScreen';

import {
  LoginScreen,
  RegisterScreen,
} from './src/screens/AuthScreens';

type AuthMode = 'login' | 'register';

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Temporary demo login.
  // Replace this with your actual authentication API.
  const handleLogin = async (
    email: string,
    password: string,
  ) => {
    console.log('Login:', email);

    if (!email || !password) {
      throw new Error('Please enter your credentials.');
    }

    setIsAuthenticated(true);
  };

  // Temporary demo registration.
  // Replace this with your actual registration API.
  const handleRegister = async (
    name: string,
    email: string,
    password: string,
  ) => {
    console.log('Register:', { name, email });

    if (!name || !email || !password) {
      throw new Error('Please complete all fields.');
    }

    setIsAuthenticated(true);
  };

  const handleForgotPassword = (email: string) => {
    Alert.alert(
      'Password recovery',
      `Connect your password recovery service for ${email}.`,
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthMode('login');
  };

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <View style={styles.container}>
            {!isAuthenticated ? (
              authMode === 'login' ? (
                <LoginScreen
                  onLogin={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  onSwitch={() => setAuthMode('register')}
                />
              ) : (
                <RegisterScreen
                  onRegister={handleRegister}
                  onSwitch={() => setAuthMode('login')}
                />
              )
            ) : (
              <HomeScreen />
            )}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FB',
  },
});
