import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import {
  RoadmapApiService,
  StudentProgressState,
  RoadmapItem,
} from '@/services/roadmap';
import { getLanguageByCode } from '@/constants/languages';

export default function ProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [progress, setProgress] = useState<StudentProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lang = getLanguageByCode(currentLanguage);
  const userId = user?.id || 'student_default';

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RoadmapApiService.getStudentProgress(userId);
      setProgress(data);
    } catch (err) {
      console.warn('[ProgressScreen] Failed to load progress:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRefreshing(true);
    await loadProgress();
  };

  const handleLearnNextStep = (item: RoadmapItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    startNewConversation();
    const prompt =
      `Target Skill: ${item.skill_name}\n` +
      `Current Level: ${item.current_level}\n` +
      `Target Level: ${item.target_level}\n` +
      `Learning Objective: ${item.learning_objective}\n` +
      `Recommended Activity: ${item.recommended_activity}\n\n` +
      `Hello! I am continuing my personalized learning roadmap. Please teach me "${item.topic}" in ${lang.name}, with practical examples and dual-script terminology.`;

    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading && !progress) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your learning metrics...
        </Text>
      </SafeAreaView>
    );
  }

  const nextStep = progress?.recommended_next_step;

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
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>ANALYTICS &amp; GROWTH</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Learning Progress
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.roadmapBtn, { borderColor: colors.border }]}
          onPress={() => router.push('/career/dashboard' as any)}
        >
          <Ionicons name="speedometer-outline" size={14} color={colors.primary} />
          <Text style={[styles.roadmapBtnText, { color: colors.primary }]}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Core Stats Overview 2x2 Grid */}
        <View style={styles.statsGrid}>
          {/* Stat 1: Roadmap Completion */}
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="pie-chart" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress?.completion_percentage ?? 0}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Roadmap Completed
            </Text>
          </View>

          {/* Stat 2: Topics Mastered */}
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkmark-done" size={22} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress?.completed_topics_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Topics Mastered
            </Text>
          </View>

          {/* Stat 3: Learning Sessions */}
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="chatbubbles" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress?.learning_sessions_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              AI Tutor Sessions
            </Text>
          </View>

          {/* Stat 4: Saved Notes & Artifacts */}
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="document-text" size={22} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress?.saved_notes_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Saved Study Notes
            </Text>
          </View>
        </View>

        {/* Streak & Velocity Banner */}
        <View
          style={[
            styles.streakCard,
            { backgroundColor: colors.primaryLight, borderColor: colors.primary + '35' },
          ]}
        >
          <View style={styles.streakTop}>
            <View style={styles.streakLeft}>
              <Ionicons name="flame" size={28} color="#EF4444" />
              <View>
                <Text style={[styles.streakTitle, { color: colors.text }]}>
                  {progress?.current_streak_days ?? 1} Day Learning Streak
                </Text>
                <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
                  Consistent daily learning with Langnode AI
                </Text>
              </View>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: '#EF444415' }]}>
              <Text style={[styles.streakBadgeText, { color: '#EF4444' }]}>ON FIRE</Text>
            </View>
          </View>
        </View>

        {/* Recommended Next Step Card */}
        {nextStep && (
          <View
            style={[
              styles.nextStepCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.nextStepHeader}>
              <View style={[styles.nextStepTag, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.nextStepTagText}>RECOMMENDED NEXT STEP</Text>
              </View>
            </View>
            <Text style={[styles.nextStepTitle, { color: colors.text }]}>{nextStep.topic}</Text>
            <Text style={[styles.nextStepSkill, { color: colors.primary }]}>
              {nextStep.skill_name} ({nextStep.current_level} → {nextStep.target_level})
            </Text>
            <Text style={[styles.nextStepDesc, { color: colors.textSecondary }]}>
              {nextStep.learning_objective}
            </Text>

            <TouchableOpacity
              style={[styles.nextStepCTA, { backgroundColor: colors.primary }]}
              onPress={() => handleLearnNextStep(nextStep)}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.nextStepCTAText}>Learn with Langnode</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Milestone Milestones Achieved */}
        <View
          style={[
            styles.milestonesCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.milestonesHeader}>
            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
            <Text style={[styles.milestonesTitle, { color: colors.text }]}>Competency Milestones</Text>
          </View>

          <View style={styles.milestoneItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <View style={styles.milestoneTextBox}>
              <Text style={[styles.milestoneName, { color: colors.text }]}>
                Target Career Selected
              </Text>
              <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
                Targeting {progress?.active_role_name || 'Software Engineering'}
              </Text>
            </View>
          </View>

          <View style={styles.milestoneItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <View style={styles.milestoneTextBox}>
              <Text style={[styles.milestoneName, { color: colors.text }]}>
                Diagnostic Competency Mapping
              </Text>
              <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
                Identified baseline skills and target proficiency gaps
              </Text>
            </View>
          </View>

          <View style={styles.milestoneItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <View style={styles.milestoneTextBox}>
              <Text style={[styles.milestoneName, { color: colors.text }]}>
                5-Phase Personalized Curriculum Generated
              </Text>
              <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
                Structured topics from Foundations to Production Capstone
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  roadmapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  roadmapBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  streakCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  streakTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakSub: {
    fontSize: 11,
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nextStepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  nextStepHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  nextStepTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextStepTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  nextStepSkill: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  nextStepDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  nextStepCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextStepCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  milestonesCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  milestoneTextBox: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 13,
    fontWeight: '600',
  },
  milestoneDesc: {
    fontSize: 11,
    marginTop: 1,
  },
});
