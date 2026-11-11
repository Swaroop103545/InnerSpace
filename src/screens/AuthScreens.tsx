
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type AuthScreenProps = {
  onLogin?: (email: string, password: string) => Promise<void> | void;
  onRegister?: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void> | void;
  onForgotPassword?: (email: string) => void;
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onSwitch?: () => void;
  onViewIntro?: () => void;
};

const COLORS = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  primary: '#7663A8',
  primaryLight: '#EFEBF6',
  text: '#302B38',
  secondary: '#898392',
  border: '#EAE7ED',
  placeholder: '#B5B0BB',
  danger: '#C65B65',
  muted: '#F4F2F6',
};

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

type AuthInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  onSwitch?: boolean;
};

const AuthInput: React.FC<AuthInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : undefined,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={error ? COLORS.danger : '#9B94A6'}
        />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secureTextEntry && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          selectionColor={COLORS.primary}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setPasswordVisible((previous) => !previous)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color="#9B94A6"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

type AuthShellProps = {
  children: React.ReactNode;
  mode: 'login' | 'register';
  onSwitch: () => void;
  onViewIntro?: () => void;
};

const AuthShell: React.FC<AuthShellProps> = ({
  children,
  mode,
  onSwitch,
  onViewIntro,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons
                  name="book-outline"
                  size={23}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.brandName}>InnerSpace</Text>
            </View>

            {onViewIntro ? (
              <TouchableOpacity
                onPress={onViewIntro}
                activeOpacity={0.75}
                style={styles.introTourButton}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.introTourText}>Intro</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Decorative journal illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.decorCircleOne} />
            <View style={styles.decorCircleTwo} />

            <View style={styles.journalIllustration}>
              <View style={styles.journalSpine} />
              <View style={styles.journalContent}>
                <Ionicons
                  name="sparkles"
                  size={23}
                  color="#B29BCF"
                />
                <View style={styles.journalLineLong} />
                <View style={styles.journalLineShort} />
                <View style={styles.journalLineMedium} />
                <View style={styles.journalHeart}>
                  <Ionicons
                    name="heart"
                    size={17}
                    color="#C58F9B"
                  />
                </View>
              </View>
            </View>

            <View style={styles.floatingStar}>
              <Ionicons name="sparkles" size={18} color="#B69CCF" />
            </View>

            <View style={styles.floatingFlower}>
              <Ionicons name="flower-outline" size={24} color="#C99AA8" />
            </View>
          </View>

          {/* Page heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.eyebrow}>
              {mode === 'login' ? 'WELCOME BACK' : 'A NEW BEGINNING'}
            </Text>

            <Text style={styles.heading}>
              {mode === 'login'
                ? 'Your space awaits.'
                : 'Start your story.'}
            </Text>

            <Text style={styles.description}>
              {mode === 'login'
                ? 'Take a moment for yourself. Your thoughts and memories are right where you left them.'
                : 'Create a personal space for your thoughts, memories, and everything in between.'}
            </Text>
          </View>

          {/* Form */}
          {children}

          {/* Switch auth mode */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </Text>

            <TouchableOpacity onPress={onSwitch} activeOpacity={0.7}>
              <Text style={styles.switchAction}>
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons
              name="lock-closed-outline"
              size={12}
              color="#A6A0AC"
            />
            <Text style={styles.footerText}>
              Your thoughts deserve a private space.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ======================================================
// LOGIN SCREEN
// ======================================================

export const LoginScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onForgotPassword,
  onLoginSuccess,
  onSwitch,
  onViewIntro,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Please enter your password.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (!onLogin) {
      Alert.alert(
        'Authentication not connected',
        'Connect your login API to enable sign in.',
      );
      return;
    }

    try {
      setLoading(true);
      await onLogin(email.trim(), password);
      onLoginSuccess?.();
    } catch (error: any) {
      Alert.alert(
        'Unable to sign in',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      onSwitch={onSwitch || (() => {})}
      onViewIntro={onViewIntro}
    >
      <View style={styles.form}>
        <AuthInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((previous) => ({ ...previous, email: '' }));
          }}
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <AuthInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((previous) => ({ ...previous, password: '' }));
          }}
          icon="lock-closed-outline"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          activeOpacity={0.7}
          onPress={() => {
            if (!email.trim()) {
              Alert.alert(
                'Email required',
                'Enter your email address first.',
              );
              return;
            }

            if (!validateEmail(email)) {
              Alert.alert(
                'Invalid email',
                'Please enter a valid email address.',
              );
              return;
            }

            if (onForgotPassword) {
              onForgotPassword(email.trim());
            } else {
              Alert.alert(
                'Password recovery',
                'Connect your password recovery flow here.',
              );
            }
          }}
        >
          <Text style={styles.forgotPasswordText}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Sign in</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.quoteContainer}>
          <Ionicons name="leaf-outline" size={17} color="#A18DBE" />
          <Text style={styles.quoteText}>
            &ldquo;A little space for a lot of thoughts.&rdquo;
          </Text>
        </View>
      </View>
    </AuthShell>
  );
};

// ======================================================
// REGISTER SCREEN
// ======================================================

export const RegisterScreen: React.FC<AuthScreenProps> = ({
  onRegister,
  onRegisterSuccess,
  onSwitch,
  onViewIntro,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Please create a password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must contain at least 8 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptedTerms) {
      nextErrors.terms = 'Please accept the terms to continue.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (!onRegister) {
      Alert.alert(
        'Authentication not connected',
        'Connect your registration API to create an account.',
      );
      return;
    }

    try {
      setLoading(true);

      await onRegister(name.trim(), email.trim(), password);

      onRegisterSuccess?.();
    } catch (error: any) {
      Alert.alert(
        'Unable to create account',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="register"
      onSwitch={onSwitch || (() => {})}
      onViewIntro={onViewIntro}
    >
      <View style={styles.form}>
        <AuthInput
          label="Your name"
          placeholder="Enter your name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((previous) => ({ ...previous, name: '' }));
          }}
          icon="person-outline"
          error={errors.name}
        />

        <AuthInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((previous) => ({ ...previous, email: '' }));
          }}
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <AuthInput
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((previous) => ({ ...previous, password: '' }));
          }}
          icon="lock-closed-outline"
          secureTextEntry
          error={errors.password}
        />

        <AuthInput
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((previous) => ({
              ...previous,
              confirmPassword: '',
            }));
          }}
          icon="shield-checkmark-outline"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <TouchableOpacity
          style={styles.termsRow}
          activeOpacity={0.8}
          onPress={() => {
            setAcceptedTerms((previous) => !previous);
            setErrors((previous) => ({ ...previous, terms: '' }));
          }}
        >
          <View
            style={[
              styles.checkbox,
              acceptedTerms && styles.checkboxActive,
            ]}
          >
            {acceptedTerms && (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            )}
          </View>

          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsHighlight}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsHighlight}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {errors.terms ? (
          <Text style={styles.errorText}>{errors.terms}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          activeOpacity={0.85}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                Create account
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.quoteContainer}>
          <Ionicons name="heart-outline" size={17} color="#C58F9B" />
          <Text style={styles.quoteText}>
            &ldquo;Every meaningful journey begins with a page.&rdquo;
          </Text>
        </View>
      </View>
    </AuthShell>
  );
};

// ======================================================
// AUTH STYLES
// ======================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 30,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  introTourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
  },
  introTourText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  brandIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Illustration
  illustrationContainer: {
    height: 175,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 5,
  },
  decorCircleOne: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 80,
    backgroundColor: '#F0ECF5',
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EAE4F1',
    opacity: 0.7,
  },
  journalIllustration: {
    width: 105,
    height: 132,
    backgroundColor: '#AFA0C7',
    borderRadius: 12,
    padding: 7,
    transform: [{ rotate: '-7deg' }],
    shadowColor: '#51436C',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  journalSpine: {
    position: 'absolute',
    left: 12,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: '#8C7AA9',
    zIndex: 1,
  },
  journalContent: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    borderRadius: 7,
    alignItems: 'center',
    paddingTop: 15,
    paddingLeft: 8,
  },
  journalLineLong: {
    width: 53,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D8D1E1',
    marginTop: 12,
  },
  journalLineShort: {
    width: 37,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E4DDE9',
    marginTop: 7,
    alignSelf: 'center',
  },
  journalLineMedium: {
    width: 47,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E4DDE9',
    marginTop: 7,
  },
  journalHeart: {
    marginTop: 10,
  },
  floatingStar: {
    position: 'absolute',
    right: '22%',
    top: 20,
  },
  floatingFlower: {
    position: 'absolute',
    left: '20%',
    bottom: 20,
  },

  // Heading
  headingContainer: {
    marginTop: 5,
    marginBottom: 25,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 9,
  },
  heading: {
    color: COLORS.text,
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 39,
  },
  description: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 310,
  },

  // Form
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 17,
  },
  inputLabel: {
    color: '#4B4555',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 9,
  },
  inputContainer: {
    height: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 10,
    marginTop: 6,
    marginLeft: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -3,
    marginBottom: 23,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    height: 55,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quoteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  quoteText: {
    color: '#A39BAA',
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Register terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 8,
    gap: 9,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#CFC8D8',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 17,
  },
  termsHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Switch and footer
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 25,
  },
  switchText: {
    color: COLORS.secondary,
    fontSize: 11,
  },
  switchAction: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  footerText: {
    color: '#A6A0AC',
    fontSize: 10,
  },
});
