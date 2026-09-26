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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import {
  RoadmapApiService,
  PersonalizedRoadmapResponse,
  SkillGapAnalysisResponse,
  StudentProgressState,
  RoadmapItem,
} from '@/services/roadmap';
import { CareerService, CareerRoleDetail } from '@/services/careers';
import { useAuth } from '@/context/AuthContext';
import { Storage } from '@/services/storage';
import { getLanguageByCode } from '@/constants/languages';

export default function CareerDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roleId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [activeRoleId, setActiveRoleId] = useState<string>(params.roleId || 'role_frontend');
  const roleId = activeRoleId;
  const [roleDetail, setRoleDetail] = useState<CareerRoleDetail | null>(null);
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmapResponse | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<SkillGapAnalysisResponse | null>(null);
  const [progressState, setProgressState] = useState<StudentProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lang = getLanguageByCode(currentLanguage);
  const userId = user?.id || 'student_default';

  useEffect(() => {
    async function resolveRoleId() {
      if (params.roleId) {
        setActiveRoleId(params.roleId);
        await Storage.setLastCareerRoleId(params.roleId);
      } else {
        const saved = await Storage.getLastCareerRoleId();
        if (saved) {
          setActiveRoleId(saved);
        }
      }
    }
    resolveRoleId();
  }, [params.roleId]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [roleData, roadmapData, gapData, progData] = await Promise.all([
        CareerService.getRoleDetail(activeRoleId).catch(() => null),
        RoadmapApiService.getRoadmap(activeRoleId, userId).catch(() => null),
        RoadmapApiService.getGapAnalysis(activeRoleId, userId).catch(() => null),
        RoadmapApiService.getStudentProgress(userId).catch(() => null),
      ]);

      if (roleData) setRoleDetail(roleData);
      if (roadmapData) setRoadmap(roadmapData);
      if (gapData) setGapAnalysis(gapData);
      if (progData) setProgressState(progData);
    } catch (err) {
      console.warn('[CareerDashboardScreen] Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRoleId, userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleLearnWithLangnode = (item: RoadmapItem) => {
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
      `Hello! I am preparing for the ${roleDetail?.name || 'Software'} career path. Please guide me through "${item.topic}" in ${lang.name}, explaining the concept with practical examples and preserving essential technical terminology.`;

    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading && !roadmap) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your personalized career dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  const nextStep = roadmap?.recommended_next_step;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          style={[styles.headerBackBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>MY CAREER GOAL</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {roleDetail?.name || roadmap?.role_name || 'Career Dashboard'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.switchRoleBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => router.push('/(tabs)/career' as any)}
        >
          <Text style={[styles.switchRoleText, { color: colors.primary }]}>Switch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* ========================================== */}
        {/* HERO CAREER GOAL & READINESS CARD */}
        {/* ========================================== */}
        <View
          style={[
            styles.heroGoalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 3,
            },
          ]}
        >
          <View style={styles.goalCardTop}>
            <View
              style={[
                styles.goalIconBox,
                {
                  backgroundColor: (roleDetail?.badge_color || colors.primary) + '18',
                  borderColor: (roleDetail?.badge_color || colors.primary) + '40',
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name={(roleDetail?.icon as any) || 'rocket'}
                size={26}
                color={roleDetail?.badge_color || colors.primary}
              />
            </View>

            <View style={styles.goalInfoBox}>
              <View style={styles.goalBadgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: '#05966918', borderColor: '#05966940', borderWidth: 1 }]}>
                  <Text style={[styles.statusBadgeText, { color: '#059669' }]}>ACTIVE GOAL</Text>
                </View>
                <Text style={[styles.categoryTag, { color: colors.textSecondary }]}>
                  {roleDetail?.category || 'Engineering'}
                </Text>
              </View>
              <Text style={[styles.goalRoleName, { color: colors.text }]}>
                {roleDetail?.name || roadmap?.role_name}
              </Text>
            </View>
          </View>

          {/* Progress / Readiness Summary Row */}
          <View
            style={[
              styles.readinessContainer,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.readinessMetricItem}>
              <Text style={[styles.readinessMetricLabel, { color: colors.textSecondary }]}>
                Career Readiness
              </Text>
              <Text style={[styles.readinessMetricVal, { color: '#059669' }]}>
                {gapAnalysis?.readiness_percentage ?? 45}%
              </Text>
            </View>

            <View style={styles.readinessDivider} />

            <View style={styles.readinessMetricItem}>
              <Text style={[styles.readinessMetricLabel, { color: colors.textSecondary }]}>
                Roadmap Progress
              </Text>
              <Text style={[styles.readinessMetricVal, { color: colors.primary }]}>
                {roadmap?.completion_percentage ?? 0}%
              </Text>
            </View>

            <View style={styles.readinessDivider} />

            <View style={styles.readinessMetricItem}>
              <Text style={[styles.readinessMetricLabel, { color: colors.textSecondary }]}>
                Topics Completed
              </Text>
              <Text style={[styles.readinessMetricVal, { color: colors.text }]}>
                {roadmap?.completed_topics ?? 0} / {roadmap?.total_topics ?? 14}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================== */}
        {/* SCREEN 6: RECOMMENDED NEXT STEP */}
        {/* ========================================== */}
        {nextStep ? (
          <View
            style={[
              styles.nextStepCard,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary + '35',
                borderLeftColor: colors.primary,
                borderLeftWidth: 4,
                shadowColor: '#EA580C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              },
            ]}
          >
            <View style={styles.nextStepHeader}>
              <View style={[styles.nextStepBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.nextStepBadgeText}>RECOMMENDED NEXT STEP</Text>
              </View>
              <Text style={[styles.nextStepPhase, { color: colors.textSecondary, fontWeight: '700' }]}>
                Phase {nextStep.phase_number}
              </Text>
            </View>

            <Text style={[styles.nextStepTopic, { color: colors.text }]}>{nextStep.topic}</Text>
            <Text style={[styles.nextStepSkill, { color: colors.primary }]}>
              Skill: {nextStep.skill_name} ({nextStep.current_level} → {nextStep.target_level})
            </Text>

            <Text style={[styles.nextStepObjective, { color: colors.textSecondary }]}>
              {nextStep.learning_objective}
            </Text>

            {/* Learn with Langnode CTA */}
            <TouchableOpacity
              style={[styles.learnWithLangnodeBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleLearnWithLangnode(nextStep)}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.learnWithLangnodeText}>
                Learn with Langnode ({lang.nativeName})
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.nextStepCard,
              {
                backgroundColor: '#10B98115',
                borderColor: '#10B981',
              },
            ]}
          >
            <View style={styles.nextStepHeader}>
              <View style={[styles.nextStepBadge, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-done" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.nextStepBadgeText}>ROADMAP COMPLETE</Text>
              </View>
            </View>
            <Text style={[styles.nextStepTopic, { color: colors.text }]}>
              All Personalized Topics Mastered!
            </Text>
            <Text style={[styles.nextStepObjective, { color: colors.textSecondary }]}>
              You have completed all curriculum topics for this career path. Keep practicing with AI Tutor to maintain your mastery.
            </Text>
          </View>
        )}

        {/* ========================================== */}
        {/* CORE NAVIGATION SECTIONS GRID */}
        {/* ========================================== */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Competency Management</Text>

        <View style={styles.navGrid}>
          {/* Card 1: Skill Gap */}
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push({
                pathname: '/career/gap',
                params: { roleId },
              } as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="analytics" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.navCardTitle, { color: colors.text }]}>Skill Gap Analysis</Text>
            <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>
              {gapAnalysis
                ? `${gapAnalysis.strong_skills.length} Strong · ${gapAnalysis.missing_skills.length} Missing`
                : 'Inspect competency gaps vs role'}
            </Text>
            <View style={styles.navCardArrow}>
              <Text style={[styles.navCardAction, { color: colors.primary }]}>View Gaps</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Learning Roadmap */}
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push({
                pathname: '/career/roadmap',
                params: { roleId },
              } as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.navIconBox, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="map" size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.navCardTitle, { color: colors.text }]}>Learning Roadmap</Text>
            <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>
              5 Phased steps tailored to your assessed gaps
            </Text>
            <View style={styles.navCardArrow}>
              <Text style={[styles.navCardAction, { color: colors.secondary }]}>View Timeline</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
            </View>
          </TouchableOpacity>

          {/* Card 3: Diagnostic Assessment */}
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push({
                pathname: '/career/assess',
                params: { roleId },
              } as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkbox" size={24} color="#10B981" />
            </View>
            <Text style={[styles.navCardTitle, { color: colors.text }]}>Skill Assessment</Text>
            <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>
              Self-rate skills to dynamically recalibrate your roadmap
            </Text>
            <View style={styles.navCardArrow}>
              <Text style={[styles.navCardAction, { color: colors.primary }]}>
                {gapAnalysis ? 'Retake' : 'Start'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Card 4: Progress & Growth */}
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push('/career/progress' as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.navIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="trending-up" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.navCardTitle, { color: colors.text }]}>Progress &amp; Stats</Text>
            <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>
              {progressState
                ? `${progressState.current_streak_days} Day Streak · ${progressState.skills_leveled_up} Skills Up`
                : 'Track learning growth over time'}
            </Text>
            <View style={styles.navCardArrow}>
              <Text style={[styles.navCardAction, { color: colors.primary }]}>View Stats</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ========================================== */}
        {/* RECENT ACTIVITY LOG */}
        {/* ========================================== */}
        {progressState?.recent_activity && progressState.recent_activity.length > 0 && (
          <View
            style={[
              styles.activityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.activityHeader}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.activityTitle, { color: colors.text }]}>Recent Learning Activity</Text>
            </View>
            {progressState.recent_activity.slice(0, 4).map((act, i) => (
              <View key={i} style={styles.activityRow}>
                <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 6 }} />
                <Text style={[styles.activityText, { color: colors.textSecondary }]}>{act}</Text>
              </View>
            ))}
          </View>
        )}
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
  headerBackBtn: {
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
    fontSize: 16,
    fontWeight: '800',
  },
  switchRoleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  heroGoalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  goalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfoBox: {
    flex: 1,
  },
  goalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  goalRoleName: {
    fontSize: 18,
    fontWeight: '800',
  },
  readinessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  readinessMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  readinessMetricLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  readinessMetricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  readinessDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  nextStepCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  nextStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextStepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextStepBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextStepPhase: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextStepTopic: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  nextStepSkill: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  nextStepObjective: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  learnWithLangnodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  learnWithLangnodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  navCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  navIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  navCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  navCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  navCardArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  navCardAction: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  activityText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
