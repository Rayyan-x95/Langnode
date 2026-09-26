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
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { EXPLANATION_LEVELS, ExplanationLevel } from '@/constants/explanationLevels';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ta');
  const [selectedLevel, setSelectedLevel] = useState<ExplanationLevel>('Beginner');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await signUp(
        name.trim(),
        email.trim(),
        password,
        selectedLanguage,
        selectedLevel
      );
      if (res.error) {
        setErrorMessage(res.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set up your multilingual AI learning profile
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
                Full Name
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
                  name="person-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Anand Kumar"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

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
                  placeholder="learner@example.com"
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
                  placeholder="At least 6 characters"
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

            {/* Language Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Primary Learning Language
              </Text>
              <View style={styles.langChipsRow}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryLight
                            : colors.surfaceSubtle,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedLanguage(lang.code);
                      }}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Explanation Depth Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Default Explanation Depth
              </Text>
              <View style={styles.levelRow}>
                {EXPLANATION_LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <TouchableOpacity
                      key={lvl.id}
                      style={[
                        styles.levelBtn,
                        {
                          backgroundColor: isSelected
                            ? lvl.badgeColor + '20'
                            : colors.surfaceSubtle,
                          borderColor: isSelected
                            ? lvl.badgeColor
                            : colors.border,
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedLevel(lvl.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.levelBtnText,
                          {
                            color: isSelected ? lvl.badgeColor : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {lvl.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSignup}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' }}>
                Skip registration & Continue as Guest →
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
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
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
    gap: 14,
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
    paddingVertical: 11,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  langChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 13,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelBtnText: {
    fontSize: 13,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
