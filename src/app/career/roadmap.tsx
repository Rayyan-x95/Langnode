import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
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
  PersonalizedRoadmapResponse,
  RoadmapItem,
} from '@/services/roadmap';
import { getLanguageByCode } from '@/constants/languages';

const STATUS_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  completed: { icon: 'checkmark-circle', color: '#10B981', label: 'Completed' },
  in_progress: { icon: 'time', color: '#F59E0B', label: 'In Progress' },
  not_started: { icon: 'ellipse-outline', color: '#94A3B8', label: 'Not Started' },
};

export default function LearningRoadmapScreen() {
  const router = useRouter();
  const { roleId } = useLocalSearchParams<{ roleId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [activeRoleId, setActiveRoleId] = useState<string>(roleId || 'role_frontend');
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });
  const [selectedItemForModal, setSelectedItemForModal] = useState<RoadmapItem | null>(null);

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

  const loadRoadmap = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RoadmapApiService.getRoadmap(activeRoleId, userId);
      setRoadmap(data);
    } catch (err) {
      console.warn('[LearningRoadmapScreen] Failed to load roadmap:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRoleId, userId]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRefreshing(true);
    await loadRoadmap();
  };

  const togglePhase = (phaseNum: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseNum]: !prev[phaseNum],
    }));
  };

  const handleOpenItem = (item: RoadmapItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedItemForModal(item);
  };

  const handleCloseModal = () => {
    setSelectedItemForModal(null);
  };

  const handleToggleItemStatus = async (item: RoadmapItem, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await RoadmapApiService.updateItemStatus(activeRoleId, item.id, newStatus);
      setRoadmap(updated);
      if (selectedItemForModal && selectedItemForModal.id === item.id) {
        setSelectedItemForModal({ ...selectedItemForModal, status: newStatus });
      }
    } catch (err) {
      console.warn('[LearningRoadmapScreen] Error updating status:', err);
    }
  };

  const handleLearnWithLangnode = (item: RoadmapItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    handleCloseModal();

    startNewConversation();
    const prompt =
      `Target Skill: ${item.skill_name}\n` +
      `Current Level: ${item.current_level}\n` +
      `Target Level: ${item.target_level}\n` +
      `Learning Objective: ${item.learning_objective}\n` +
      `Recommended Activity: ${item.recommended_activity}\n\n` +
      `Hello! I am following my personalized roadmap for ${roadmap?.role_name || 'my career'}. Please guide me through "${item.topic}" in ${lang.name}, explaining the concept step-by-step with analogies and code snippets.`;

    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading && !roadmap) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Synthesizing your personalized learning roadmap...
        </Text>
      </SafeAreaView>
    );
  }

  if (!roadmap) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="map-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Roadmap Unavailable</Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
          Could not build your roadmap at this time. Please retry.
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={loadRoadmap}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>PERSONALIZED ROADMAP</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {roadmap.role_name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.dashboardBtn, { borderColor: colors.border }]}
          onPress={() => router.push({ pathname: '/career/dashboard', params: { roleId: activeRoleId } } as any)}
        >
          <Ionicons name="speedometer-outline" size={14} color={colors.primary} />
          <Text style={[styles.dashboardBtnText, { color: colors.primary }]}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Progress Banner */}
        <View
          style={[
            styles.progressBanner,
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
          <View style={styles.progressTopRow}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Overall Roadmap Progress</Text>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {roadmap.completed_topics} of {roadmap.total_topics} topics mastered
              </Text>
            </View>
            <Text style={[styles.progressPercentText, { color: colors.primary }]}>
              {roadmap.completion_percentage}%
            </Text>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.borderSubtle }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${roadmap.completion_percentage}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Phases Accordion / List */}
        <View style={styles.phasesContainer}>
          {roadmap.phases.map((phase) => {
            const isExpanded = expandedPhases[phase.phase_number] ?? true;
            const isCompleted = phase.completed_items_count === phase.total_items_count && phase.total_items_count > 0;

            return (
              <View
                key={phase.phase_number}
                style={[
                  styles.phaseCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isCompleted ? '#05966950' : colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  },
                ]}
              >
                {/* Phase Header */}
                <TouchableOpacity
                  style={styles.phaseHeader}
                  onPress={() => togglePhase(phase.phase_number)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseHeaderLeft}>
                    <View
                      style={[
                        styles.phaseNumberBadge,
                        {
                          backgroundColor: isCompleted
                            ? '#10B981'
                            : colors.primary,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.phaseNumberText}>{phase.phase_number}</Text>
                      )}
                    </View>
                    <View style={styles.phaseTitleBox}>
                      <Text style={[styles.phaseTitle, { color: colors.text }]}>
                        {phase.title}
                      </Text>
                      <Text style={[styles.phaseDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {phase.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.phaseHeaderRight}>
                    <Text style={[styles.phaseCounter, { color: colors.textSecondary }]}>
                      {phase.completed_items_count}/{phase.total_items_count}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Phase Items (Topics) */}
                {isExpanded && (
                  <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
                    {phase.items.map((item) => {
                      const statusConfig = STATUS_ICONS[item.status] || STATUS_ICONS.not_started;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemRow,
                            { borderBottomColor: colors.border },
                          ]}
                          onPress={() => handleOpenItem(item)}
                          activeOpacity={0.7}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              const nextStatus =
                                item.status === 'completed'
                                  ? 'not_started'
                                  : item.status === 'in_progress'
                                  ? 'completed'
                                  : 'in_progress';
                              handleToggleItemStatus(item, nextStatus);
                            }}
                            style={styles.itemStatusBtn}
                          >
                            <Ionicons
                              name={statusConfig.icon as any}
                              size={20}
                              color={statusConfig.color}
                            />
                          </TouchableOpacity>

                          <View style={styles.itemContentBox}>
                            <Text
                              style={[
                                styles.itemTopic,
                                {
                                  color: colors.text,
                                  textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
                                },
                              ]}
                            >
                              {item.topic}
                            </Text>
                            <View style={styles.itemMetaRow}>
                              <Text style={[styles.itemSkill, { color: colors.primary }]}>
                                {item.skill_name}
                              </Text>
                              <Text style={[styles.itemHours, { color: colors.textSecondary }]}>
                                ~{item.estimated_hours}h
                              </Text>
                            </View>
                          </View>

                          {/* Quick Learn CTA Button */}
                          <TouchableOpacity
                            style={[styles.quickLearnBtn, { backgroundColor: colors.primary + '15' }]}
                            onPress={() => handleLearnWithLangnode(item)}
                          >
                            <Ionicons name="sparkles" size={14} color={colors.primary} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* SCREEN 4: ROADMAP DETAIL MODAL / BOTTOM SHEET */}
      {/* ========================================== */}
      <Modal
        visible={!!selectedItemForModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleCloseModal} />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.dragBar, { backgroundColor: colors.border }]} />

            {selectedItemForModal && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleBox}>
                    <Text style={[styles.modalPhaseName, { color: colors.primary }]}>
                      {selectedItemForModal.phase_name}
                    </Text>
                    <Text style={[styles.modalTopicTitle, { color: colors.text }]}>
                      {selectedItemForModal.topic}
                    </Text>
                    <Text style={[styles.modalSkillName, { color: colors.textSecondary }]}>
                      Skill: {selectedItemForModal.skill_name} ({selectedItemForModal.current_level} → {selectedItemForModal.target_level})
                    </Text>
                  </View>

                  <TouchableOpacity onPress={handleCloseModal} style={[styles.modalClose, { backgroundColor: colors.border }]}>
                    <Ionicons name="close" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Learning Objective */}
                <View style={[styles.modalSectionBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                    LEARNING OBJECTIVE
                  </Text>
                  <Text style={[styles.modalObjectiveText, { color: colors.text }]}>
                    {selectedItemForModal.learning_objective}
                  </Text>
                </View>

                {/* Recommended Activity */}
                <View style={[styles.modalSectionBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                    RECOMMENDED ACTIVITY
                  </Text>
                  <Text style={[styles.modalActivityText, { color: colors.text }]}>
                    {selectedItemForModal.recommended_activity}
                  </Text>
                </View>

                {/* Status Selector */}
                <View style={styles.statusSelectorRow}>
                  <Text style={[styles.statusSelectorLabel, { color: colors.textSecondary }]}>
                    Status:
                  </Text>
                  <View style={styles.statusButtonsGroup}>
                    {(['not_started', 'in_progress', 'completed'] as const).map((st) => {
                      const isCurr = selectedItemForModal.status === st;
                      const config = STATUS_ICONS[st];
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.statusBtn,
                            {
                              backgroundColor: isCurr ? config.color : colors.surface,
                              borderColor: isCurr ? config.color : colors.border,
                            },
                          ]}
                          onPress={() => handleToggleItemStatus(selectedItemForModal, st)}
                        >
                          <Text
                            style={[
                              styles.statusBtnText,
                              { color: isCurr ? '#FFFFFF' : colors.textSecondary, fontWeight: isCurr ? '700' : '500' },
                            ]}
                          >
                            {config.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Learn With Langnode CTA Button */}
                <TouchableOpacity
                  style={[styles.modalLearnBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleLearnWithLangnode(selectedItemForModal)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalLearnBtnText}>
                    Learn with Langnode in {lang.name}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
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
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  dashboardBtnText: {
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
  progressBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressPercentText: {
    fontSize: 22,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  phasesContainer: {
    gap: 14,
  },
  phaseCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  phaseNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  phaseNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  phaseTitleBox: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  phaseDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  phaseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseCounter: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsList: {
    borderTopWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemStatusBtn: {
    padding: 4,
    marginRight: 10,
  },
  itemContentBox: {
    flex: 1,
    marginRight: 8,
  },
  itemTopic: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemSkill: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemHours: {
    fontSize: 11,
  },
  quickLearnBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalHeaderTitleBox: {
    flex: 1,
    marginRight: 10,
  },
  modalPhaseName: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalTopicTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSkillName: {
    fontSize: 12,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalObjectiveText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalActivityText: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  statusSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnText: {
    fontSize: 11,
  },
  modalLearnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  modalLearnBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
