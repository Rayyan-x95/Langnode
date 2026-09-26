import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Storage } from '@/services/storage';
import { CareerService, CareerRoleDetail } from '@/services/careers';
import { RoadmapApiService, UserSkillRating } from '@/services/roadmap';

const PROFICIENCY_OPTIONS = [
  { level: 'Expert', score: 5, desc: 'Production-tested leader, architect level, deep internals' },
  { level: 'Advanced', score: 4, desc: 'Fluently build complex systems, debug subtle edge cases' },
  { level: 'Intermediate', score: 3, desc: 'Comfortable with standard features, built real projects' },
  { level: 'Basic', score: 2, desc: 'Familiar with core concepts, need references for syntax' },
  { level: 'Beginner', score: 1, desc: 'Just started exploring, understand high-level purpose' },
  { level: "I Don't Know", score: 0, desc: 'Zero prior exposure to this technology or concept' },
];

export default function SkillAssessmentScreen() {
  const router = useRouter();
  const { roleId } = useLocalSearchParams<{ roleId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [activeRoleId, setActiveRoleId] = useState<string>(roleId || 'role_frontend');
  const [role, setRole] = useState<CareerRoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, { level: string; score: number }>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function resolveRole() {
      if (roleId) {
        setActiveRoleId(roleId);
        await Storage.setLastCareerRoleId(roleId);
      } else {
        const saved = await Storage.getLastCareerRoleId();
        if (saved) {
          setActiveRoleId(saved);
        }
      }
    }
    resolveRole();
  }, [roleId]);

  useEffect(() => {
    async function loadRole() {
      try {
        setLoading(true);
        const data = await CareerService.getRoleDetail(activeRoleId);
        setRole(data);
      } catch (err) {
        console.warn('[SkillAssessmentScreen] Failed to load role for assessment:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [activeRoleId]);

  if (loading || !role) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Preparing diagnostic assessment...
        </Text>
      </SafeAreaView>
    );
  }

  const currentSkill = role.skills[currentIndex];
  const totalSkills = role.skills.length;
  const progressFraction = (currentIndex + 1) / totalSkills;
  const selectedRating = ratings[currentSkill.skill_id];

  const handleSelectOption = (level: string, score: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setRatings((prev) => ({
      ...prev,
      [currentSkill.skill_id]: { level, score },
    }));
  };

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (currentIndex < totalSkills - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinishAssessment = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSubmitting(true);

      const submissionRatings: UserSkillRating[] = role.skills.map((s) => {
        const recorded = ratings[s.skill_id] || { level: 'Beginner', score: 1 };
        return {
          skill_id: s.skill_id,
          skill_name: s.skill_name,
          level: recorded.level,
          level_score: recorded.score,
        };
      });

      await RoadmapApiService.submitAssessment(activeRoleId, submissionRatings, user?.id || 'student_default');

      // Navigate to Skill Gap Analysis screen
      router.replace({
        pathname: '/career/gap',
        params: { roleId: activeRoleId },
      } as any);
    } catch (err) {
      console.warn('[SkillAssessmentScreen] Assessment submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            DIAGNOSTIC ASSESSMENT
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {role.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
        >
          <Text style={[styles.saveLaterText, { color: colors.primary }]}>Save &amp; Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressHeader}>
        <View style={styles.progressTextRow}>
          <Text style={[styles.progressCounter, { color: colors.text }]}>
            Skill {currentIndex + 1} of {totalSkills}
          </Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {Math.round(progressFraction * 100)}% Complete
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.borderSubtle }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressFraction * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Skill Card */}
        <View
          style={[
            styles.questionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.categoryBadgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.textSecondary }]}>
                {currentSkill.category}
              </Text>
            </View>
            <View
              style={[
                styles.targetBadge,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={[styles.targetBadgeText, { color: colors.primary }]}>
                Role Target: {currentSkill.expected_proficiency}
              </Text>
            </View>
          </View>

          <Text style={[styles.skillTitle, { color: colors.text }]}>
            {currentSkill.skill_name}
          </Text>
          <Text style={[styles.skillDescription, { color: colors.textSecondary }]}>
            {currentSkill.description}
          </Text>
        </View>

        {/* Question Prompt */}
        <Text style={[styles.questionPrompt, { color: colors.text }]}>
          How would you rate your current capability?
        </Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {PROFICIENCY_OPTIONS.map((opt) => {
            const isSelected = selectedRating?.level === opt.level;
            return (
              <TouchableOpacity
                key={opt.level}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '15'
                      : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelectOption(opt.level, opt.score)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <View style={styles.optionTextBox}>
                  <Text
                    style={[
                      styles.optionLevel,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {opt.level}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    {opt.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            styles.prevBtn,
            {
              borderColor: colors.border,
              opacity: currentIndex === 0 ? 0.4 : 1,
            },
          ]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {currentIndex < totalSkills - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.finishBtn, { backgroundColor: '#10B981' }]}
            onPress={handleFinishAssessment}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={[styles.navBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Analyze Gaps
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveLaterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressCounter: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  skillTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  skillDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  questionPrompt: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextBox: {
    flex: 1,
  },
  optionLevel: {
    fontSize: 14,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  prevBtn: {
    borderWidth: 1,
  },
  nextBtn: {},
  finishBtn: {},
  navBtnText: {
    fontSize: 14,
  },
});
