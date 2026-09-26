import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInDemo } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setErrorMessage(res.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signInDemo();
      router.replace('/(tabs)');
    } catch {
      setErrorMessage('Demo login failed.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue your multilingual learning journey
            </Text>
          </View>

          {errorMessage && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: colors.danger + '15',
                  borderColor: colors.danger,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Quick Demo Access Button */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.demoButton,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleDemo}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={[styles.demoButtonText, { color: colors.primary }]}>
                Sign In with Demo Learner Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoButton,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  marginTop: 10,
                },
              ]}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.text} />
              <Text style={[styles.demoButtonText, { color: colors.text }]}>
                Continue as Guest (No Auth Required)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  demoButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
