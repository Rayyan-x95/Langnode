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
import { useAuth } from '@/context/AuthContext';
import { Storage } from '@/services/storage';
import { useChat } from '@/context/ChatContext';
import {
  RoadmapApiService,
  SkillGapAnalysisResponse,
  SkillGapItem,
} from '@/services/roadmap';
import { getLanguageByCode } from '@/constants/languages';

const STATUS_TABS = ['Priority', 'All', 'Missing', 'Developing', 'Improvement', 'Strong'];

export default function SkillGapScreen() {
  const router = useRouter();
  const { roleId } = useLocalSearchParams<{ roleId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [activeRoleId, setActiveRoleId] = useState<string>(roleId || 'role_frontend');
  const [gapData, setGapData] = useState<SkillGapAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Priority');

  const lang = getLanguageByCode(currentLanguage);
  const userId = user?.id || 'student_default';

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

  const loadGapAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RoadmapApiService.getGapAnalysis(activeRoleId, userId);
      setGapData(data);
    } catch (err) {
      console.warn('[SkillGapScreen] Failed to load gap analysis:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRoleId, userId]);

  useEffect(() => {
    loadGapAnalysis();
  }, [loadGapAnalysis]);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRefreshing(true);
    await loadGapAnalysis();
  };

  const handleLearnSkill = (item: SkillGapItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    startNewConversation();
    const prompt =
      `Target Skill: ${item.skill_name}\n` +
      `Current Level: ${item.current_level}\n` +
      `Target Level: ${item.expected_level}\n` +
      `Category: ${item.category}\n` +
      `Recommended Action: ${item.recommended_action}\n\n` +
      `Hello! I need to bridge a gap in "${item.skill_name}" for my career goal. Please teach me the required concepts step-by-step in ${lang.name}, providing simple analogies and code examples.`;

    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading && !gapData) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Analyzing competency landscape and gaps...
        </Text>
      </SafeAreaView>
    );
  }

  if (!gapData) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>No Assessment Found</Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
          Take a 2-minute diagnostic assessment to identify your skill gaps.
        </Text>
        <TouchableOpacity
          style={[styles.takeAssessBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/career/assess', params: { roleId: activeRoleId } } as any)}
        >
          <Text style={styles.takeAssessText}>Start Skill Assessment</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Filter skills based on activeTab
  let displayedSkills: SkillGapItem[] = [];
  if (activeTab === 'Priority') {
    displayedSkills = gapData.priority_areas;
  } else if (activeTab === 'Missing') {
    displayedSkills = gapData.missing_skills;
  } else if (activeTab === 'Developing') {
    displayedSkills = gapData.developing_skills;
  } else if (activeTab === 'Improvement') {
    displayedSkills = gapData.improvement_needed_skills;
  } else if (activeTab === 'Strong') {
    displayedSkills = gapData.strong_skills;
  } else {
    displayedSkills = [
      ...gapData.priority_areas,
      ...gapData.missing_skills,
      ...gapData.improvement_needed_skills,
      ...gapData.developing_skills,
      ...gapData.strong_skills,
    ];
    // Remove duplicates
    const seen = new Set<string>();
    displayedSkills = displayedSkills.filter((s) => {
      if (seen.has(s.skill_id)) return false;
      seen.add(s.skill_id);
      return true;
    });
  }

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
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>SKILL GAP ANALYSIS</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {gapData.role_name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.retakeBtn, { borderColor: colors.border }]}
          onPress={() => router.push({ pathname: '/career/assess', params: { roleId: activeRoleId } } as any)}
        >
          <Ionicons name="refresh" size={14} color={colors.primary} />
          <Text style={[styles.retakeText, { color: colors.primary }]}>Retake</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Readiness Overview Card */}
        <View
          style={[
            styles.readinessCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            },
          ]}
        >
          <View style={styles.readinessTopRow}>
            <View style={styles.readinessTextBox}>
              <Text style={[styles.readinessTitle, { color: colors.text }]}>Role Readiness</Text>
              <Text style={[styles.readinessPercent, { color: '#059669' }]}>
                {gapData.readiness_percentage}%
              </Text>
            </View>
            <View style={styles.pillStatBox}>
              <View style={[styles.statPill, { backgroundColor: '#05966918', borderColor: '#05966940', borderWidth: 1 }]}>
                <Text style={[styles.statPillText, { color: '#059669' }]}>
                  {gapData.strong_skills.length} Strong
                </Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: '#D9770618', borderColor: '#D9770640', borderWidth: 1 }]}>
                <Text style={[styles.statPillText, { color: '#D97706' }]}>
                  {gapData.developing_skills.length + gapData.improvement_needed_skills.length} In-Flight
                </Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: '#DC262618', borderColor: '#DC262640', borderWidth: 1 }]}>
                <Text style={[styles.statPillText, { color: '#DC2626' }]}>
                  {gapData.missing_skills.length} Missing
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.readinessBarTrack, { backgroundColor: colors.borderSubtle }]}>
            <View
              style={[
                styles.readinessBarFill,
                { width: `${gapData.readiness_percentage}%`, backgroundColor: '#059669' },
              ]}
            />
          </View>

          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {gapData.summary}
          </Text>

          {/* Direct CTA to Roadmap */}
          <TouchableOpacity
            style={[
              styles.roadmapCTA,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              router.push({ pathname: '/career/roadmap', params: { roleId: activeRoleId } } as any);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="map" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.roadmapCTAText}>Open Personalized Learning Roadmap</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Tab Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {STATUS_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setActiveTab(tab);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Skill Gap Cards List */}
        <View style={styles.skillsList}>
          {displayedSkills.map((item) => {
            const isMissing = item.status === 'Missing';
            const isStrong = item.status === 'Strong';
            const statusColor = isStrong ? '#10B981' : isMissing ? '#EF4444' : '#F59E0B';

            return (
              <View
                key={item.skill_id}
                style={[
                  styles.skillGapCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleBox}>
                    <Text style={[styles.skillName, { color: colors.text }]}>{item.skill_name}</Text>
                    <View style={styles.cardBadges}>
                      <View style={[styles.catBadge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.catBadgeText, { color: colors.textSecondary }]}>
                          {item.category}
                        </Text>
                      </View>
                      <View style={[styles.impBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.impBadgeText, { color: colors.primary }]}>
                          {item.importance}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                  </View>
                </View>

                {/* Level Comparison Bar */}
                <View style={[styles.levelComparisonBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.levelRow}>
                    <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Current:</Text>
                    <Text style={[styles.levelValue, { color: colors.text }]}>{item.current_level}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={{ marginHorizontal: 6 }} />
                    <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Expected:</Text>
                    <Text style={[styles.levelValue, { color: colors.primary }]}>{item.expected_level}</Text>
                  </View>

                  <View style={styles.gapMeterRow}>
                    <Text style={[styles.gapText, { color: statusColor }]}>
                      {item.gap === 0 ? '✓ Target Met' : `Gap: ${item.gap} ${item.gap === 1 ? 'level' : 'levels'}`}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                  {item.recommended_action}
                </Text>

                {/* Learn With Langnode Action */}
                <TouchableOpacity
                  style={[styles.learnBtn, { borderColor: colors.border }]}
                  onPress={() => handleLearnSkill(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={[styles.learnBtnText, { color: colors.primary }]}>
                    Ask AI Tutor in {lang.name}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {displayedSkills.length === 0 && (
            <View style={styles.emptyFiltered}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Skills In This Filter</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Switch tabs or view all to explore other competencies.
              </Text>
            </View>
          )}
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
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  takeAssessBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  takeAssessText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  retakeText: {
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
  readinessCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  readinessTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  readinessTextBox: {
    flex: 1,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  readinessPercent: {
    fontSize: 28,
    fontWeight: '800',
  },
  pillStatBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  readinessBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  readinessBarFill: {
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  roadmapCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  roadmapCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
  },
  skillsList: {
    gap: 12,
  },
  skillGapCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
  },
  impBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelComparisonBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 11,
  },
  levelValue: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  gapMeterRow: {
    flexDirection: 'row',
  },
  gapText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  learnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  learnBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyFiltered: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
  },
});
