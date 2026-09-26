import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { EXPLANATION_LEVELS, ExplanationLevel } from '@/constants/explanationLevels';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, signInDemo } = useAuth();
  const { colors } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('ta');
  const [selectedLevel, setSelectedLevel] = useState<ExplanationLevel>('Beginner');

  const steps = [
    {
      title: 'Break Language Barriers',
      subtitle: 'Zero Conceptual Loss',
      description:
        'Learners encounter severe conceptual friction when instructional content is locked behind unfamiliar linguistic constructs. Langnode translates understanding—not just words.',
      icon: 'bulb-outline',
      accent: colors.primary,
    },
    {
      title: 'Learn in Your Mother Tongue',
      subtitle: 'Native Script & Cultural Context',
      description:
        'Select your preferred native Indian language. Your AI Tutor will ground challenging concepts in familiar cultural idioms and local linguistic models.',
      icon: 'language-outline',
      accent: colors.secondary,
    },
    {
      title: 'Calibrate Your Explanation Depth',
      subtitle: 'From Metaphors to Rigor',
      description:
        'Toggle between Beginner intuitive stories, Intermediate engineering blueprints, and Advanced algorithmic proofs at any instant.',
      icon: 'sparkles-outline',
      accent: colors.accent,
    },
  ];

  const handleNext = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding(selectedLanguage, selectedLevel);
      router.replace('/(tabs)');
    }
  };

  const handleDemoAccess = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await completeOnboarding(selectedLanguage, selectedLevel);
    await signInDemo();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.stepIndicator}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    idx === currentStep ? colors.primary : colors.border,
                  width: idx === currentStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleDemoAccess} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip / Try Demo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Hero */}
        <View
          style={[
            styles.heroCircle,
            {
              backgroundColor: steps[currentStep].accent + '15',
              borderColor: steps[currentStep].accent + '40',
            },
          ]}
        >
          <Ionicons
            name={steps[currentStep].icon as any}
            size={48}
            color={steps[currentStep].accent}
          />
        </View>

        <Text style={[styles.subtitleBadge, { color: steps[currentStep].accent }]}>
          {steps[currentStep].subtitle}
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>
          {steps[currentStep].title}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {steps[currentStep].description}
        </Text>

        {/* Step 2: Language Selector interactive preview */}
        {currentStep === 1 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>
              Tap to choose your language:
            </Text>
            <View style={styles.langGrid}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.primary : colors.border,
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
                        styles.langCardNative,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.langCardEnglish,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Explanation Level selector interactive preview */}
        {currentStep === 2 && (
          <View style={styles.pickerSection}>
            <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>
              Select starting depth:
            </Text>
            <View style={styles.levelList}>
              {EXPLANATION_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[
                      styles.levelCard,
                      {
                        backgroundColor: isSelected
                          ? lvl.badgeColor + '15'
                          : colors.surfaceSubtle,
                        borderColor: isSelected ? lvl.badgeColor : colors.border,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setSelectedLevel(lvl.id);
                    }}
                  >
                    <Ionicons
                      name={lvl.icon as any}
                      size={20}
                      color={lvl.badgeColor}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.levelCardTitle,
                          { color: isSelected ? lvl.badgeColor : colors.text },
                        ]}
                      >
                        {lvl.title}
                      </Text>
                      <Text
                        style={[
                          styles.levelCardDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {lvl.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA Area */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoLink}
          onPress={handleDemoAccess}
        >
          <Text style={[styles.demoLinkText, { color: colors.primary }]}>
            Instant Demo Access (No password required)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  skipBtn: {
    padding: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  subtitleBadge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  pickerSection: {
    width: '100%',
    marginTop: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  langCard: {
    width: (width - 68) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  langCardNative: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  langCardEnglish: {
    fontSize: 11,
    fontWeight: '500',
  },
  levelList: {
    gap: 10,
    width: '100%',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  levelCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  levelCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoLink: {
    marginTop: 12,
    alignItems: 'center',
    padding: 4,
  },
  demoLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
