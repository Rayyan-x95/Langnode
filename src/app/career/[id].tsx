import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { CareerService, CareerRoleDetail, RoleSkillInfo } from '@/services/careers';
import { Storage } from '@/services/storage';
import { getLanguageByCode } from '@/constants/languages';

const IMPORTANCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Essential: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  Core: { bg: '#EFF6FF', text: '#0284C7', border: '#BAE6FD' },
  Recommended: { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' },
  Bonus: { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
};

const PROFICIENCY_COLORS: Record<string, string> = {
  Beginner: '#10B981',
  Basic: '#06B6D4',
  Intermediate: '#3B82F6',
  Advanced: '#8B5CF6',
  Expert: '#EC4899',
};

export default function CareerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [role, setRole] = useState<CareerRoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Required Skills
  const [selectedImportance, setSelectedImportance] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Bottom Sheet state for inspecting a single skill
  const [selectedSkillForModal, setSelectedSkillForModal] = useState<RoleSkillInfo | null>(null);

  const lang = getLanguageByCode(currentLanguage);

  useEffect(() => {
    async function loadRole() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await CareerService.getRoleDetail(id);
        setRole(data);
        await Storage.setLastCareerRoleId(id);
      } catch (err: any) {
        console.warn('[CareerDetailScreen] Failed to load role detail:', err);
        setError(err.message || 'Failed to load career details');
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [id]);

  const filteredSkills = useMemo(() => {
    if (!role) return [];
    return role.skills.filter((s) => {
      const matchImportance =
        selectedImportance === 'All' || s.importance.toLowerCase() === selectedImportance.toLowerCase();
      const matchCategory =
        selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchImportance && matchCategory;
    });
  }, [role, selectedImportance, selectedCategory]);

  const handleImportanceFilter = (imp: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedImportance(imp);
  };

  const handleCategoryFilter = (cat: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedCategory(cat);
  };

  const handleOpenSkillModal = (skill: RoleSkillInfo) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedSkillForModal(skill);
  };

  const handleCloseSkillModal = () => {
    setSelectedSkillForModal(null);
  };

  const handleAskAITutorAboutSkill = (skill: RoleSkillInfo) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    handleCloseSkillModal();
    startNewConversation();
    const prompt = `Can you explain the skill "${skill.skill_name}" for a ${role?.name || 'career'} role in ${lang.name}? Explain what concepts I should study to achieve ${skill.expected_proficiency} level.`;
    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading career competency details...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !role) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Career Not Found</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          {error || 'The requested career pathway could not be retrieved.'}
        </Text>
        <TouchableOpacity
          style={[styles.backToHomeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backToHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const essentialCount = role.skills.filter((s) => s.importance === 'Essential').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
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

        <View style={styles.topBarTitleBox}>
          <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
            {role.name}
          </Text>
          <Text style={[styles.topBarSub, { color: colors.textSecondary }]}>
            {role.category}
          </Text>
        </View>

        <View style={[styles.roleBadgeIcon, { backgroundColor: role.badge_color + '20' }]}>
          <Ionicons name={(role.icon as any) || 'briefcase'} size={18} color={role.badge_color} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================== */}
        {/* SCREEN 3: CAREER DETAILS HERO */}
        {/* ========================================== */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: role.badge_color + '15', borderColor: role.badge_color + '40' },
              ]}
            >
              <Ionicons
                name={(role.icon as any) || 'desktop-outline'}
                size={32}
                color={role.badge_color}
              />
            </View>

            <View style={styles.heroTitleBox}>
              <View style={[styles.heroCategoryPill, { backgroundColor: role.badge_color + '15' }]}>
                <Text style={[styles.heroCategoryText, { color: role.badge_color }]}>
                  {role.category}
                </Text>
              </View>
              <Text style={[styles.heroName, { color: colors.text }]}>{role.name}</Text>
            </View>
          </View>

          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            {role.description}
          </Text>

          {/* Quick Metrics Bar */}
          <View
            style={[
              styles.metricsRow,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Skills Needed</Text>
              <Text style={[styles.metricValue, { color: colors.text, fontWeight: '800' }]}>{role.skills.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Essential</Text>
              <Text style={[styles.metricValue, { color: '#DC2626', fontWeight: '800' }]}>{essentialCount}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Market Outlook</Text>
              <Text style={[styles.metricValue, { color: role.badge_color, fontWeight: '800' }]}>
                {role.growth_outlook.split(' ')[0]}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Compensation</Text>
              <Text style={[styles.metricValue, { color: '#059669', fontWeight: '800' }]}>
                {role.avg_salary.split(' ')[0]}
              </Text>
            </View>
          </View>

          {/* Why Choose This Role */}
          {role.why_choose_this && role.why_choose_this.length > 0 && (
            <View style={styles.whyBox}>
              <Text style={[styles.whyTitle, { color: colors.text }]}>Why Choose This Career:</Text>
              {role.why_choose_this.map((point, index) => (
                <View key={index} style={styles.whyItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
                  <Text style={[styles.whyText, { color: colors.textSecondary }]}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick Actions Row: Assessment & Roadmap */}
          <View style={styles.heroActionButtonsRow}>
            <TouchableOpacity
              style={[styles.heroPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                router.push({
                  pathname: '/career/assess',
                  params: { roleId: role.id },
                } as any);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkbox" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroPrimaryBtnText}>Start Skill Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                router.push({
                  pathname: '/career/roadmap',
                  params: { roleId: role.id },
                } as any);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="map" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.heroSecondaryBtnText, { color: colors.primary }]}>View Roadmap</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================== */}
        {/* SCREEN 4: REQUIRED SKILLS SECTION */}
        {/* ========================================== */}
        <View style={styles.skillsSectionContainer}>
          <View style={styles.skillsSectionHeader}>
            <View>
              <Text style={[styles.skillsSectionTitle, { color: colors.text }]}>
                Required Skills &amp; Competencies
              </Text>
              <Text style={[styles.skillsSectionSubtitle, { color: colors.textSecondary }]}>
                Showing {filteredSkills.length} of {role.skills.length} competencies
              </Text>
            </View>
          </View>

          {/* Importance Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.importanceScroll}
          >
            {['All', 'Essential', 'Core', 'Recommended', 'Bonus'].map((imp) => {
              const isSelected = selectedImportance === imp;
              return (
                <TouchableOpacity
                  key={imp}
                  style={[
                    styles.importanceFilterTab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleImportanceFilter(imp)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.importanceFilterText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {imp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Skill Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}
          >
            {['All', ...role.categories_covered].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryFilterChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleCategoryFilter(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryFilterChipText,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Skills List */}
          <View style={styles.skillsList}>
            {filteredSkills.map((skill) => {
              const impConfig = IMPORTANCE_COLORS[skill.importance] || IMPORTANCE_COLORS.Core;
              const profColor = PROFICIENCY_COLORS[skill.expected_proficiency] || '#3B82F6';

              return (
                <TouchableOpacity
                  key={skill.skill_id}
                  style={[
                    styles.skillCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleOpenSkillModal(skill)}
                  activeOpacity={0.8}
                >
                  {/* Skill Card Top */}
                  <View style={styles.skillCardHeader}>
                    <View style={styles.skillNameCategoryBox}>
                      <Text style={[styles.skillName, { color: colors.text }]}>
                        {skill.skill_name}
                      </Text>
                      <View style={styles.skillCategoryTag}>
                        <Text style={[styles.skillCategoryTagText, { color: colors.textSecondary }]}>
                          {skill.category}
                        </Text>
                      </View>
                    </View>

                    {/* Importance Badge */}
                    <View
                      style={[
                        styles.importanceBadge,
                        {
                          backgroundColor: impConfig.bg,
                          borderColor: impConfig.border,
                        },
                      ]}
                    >
                      <Text style={[styles.importanceBadgeText, { color: impConfig.text }]}>
                        {skill.importance}
                      </Text>
                    </View>
                  </View>

                  {/* Skill Description */}
                  <Text style={[styles.skillDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {skill.description}
                  </Text>

                  {/* Proficiency Level Progress Indicator */}
                  <View style={styles.proficiencySection}>
                    <View style={styles.proficiencyLabelRow}>
                      <Text style={[styles.proficiencyHeader, { color: colors.textSecondary }]}>
                        Target Proficiency:
                      </Text>
                      <Text style={[styles.proficiencyValue, { color: profColor }]}>
                        {skill.expected_proficiency} (Level {skill.proficiency_level}/4)
                      </Text>
                    </View>

                    {/* 4-Step Visual Progress Bar */}
                    <View style={styles.progressBarWrapper}>
                      {[1, 2, 3, 4].map((step) => {
                        const isFilled = step <= skill.proficiency_level;
                        return (
                          <View
                            key={step}
                            style={[
                              styles.progressStep,
                              {
                                backgroundColor: isFilled
                                  ? profColor
                                  : colors.border,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>

                  {/* Touch to inspect affordance */}
                  <View style={[styles.skillCardActionRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.actionRowText, { color: colors.primary }]}>
                      Tap for competency details &amp; tutor guidance
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredSkills.length === 0 && (
              <View style={styles.emptyFilteredBox}>
                <Ionicons name="filter-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyFilteredTitle, { color: colors.text }]}>
                  No Skills in this Filter
                </Text>
                <Text style={[styles.emptyFilteredSub, { color: colors.textSecondary }]}>
                  Try resetting importance or category filters.
                </Text>
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedImportance('All');
                    setSelectedCategory('All');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>Show All Skills</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* BOTTOM SHEET / MODAL FOR SKILL DEEP-DIVE */}
      {/* ========================================== */}
      <Modal
        visible={!!selectedSkillForModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSkillModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseSkillModal}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Handle Drag Bar */}
            <View style={[styles.modalDragBar, { backgroundColor: colors.border }]} />

            {selectedSkillForModal && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleBox}>
                    <Text style={[styles.modalSkillName, { color: colors.text }]}>
                      {selectedSkillForModal.skill_name}
                    </Text>
                    <View style={styles.modalBadgeRow}>
                      <View
                        style={[
                          styles.modalCategoryBadge,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.modalCategoryText, { color: colors.textSecondary }]}>
                          {selectedSkillForModal.category}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.modalImpBadge,
                          {
                            backgroundColor:
                              IMPORTANCE_COLORS[selectedSkillForModal.importance]?.bg || '#E0E7FF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalImpText,
                            {
                              color:
                                IMPORTANCE_COLORS[selectedSkillForModal.importance]?.text || colors.primary,
                            },
                          ]}
                        >
                          {selectedSkillForModal.importance}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleCloseSkillModal}
                    style={[styles.modalCloseBtn, { backgroundColor: colors.border }]}
                  >
                    <Ionicons name="close" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                    Skill Overview:
                  </Text>
                  <Text style={[styles.modalDescText, { color: colors.text }]}>
                    {selectedSkillForModal.description}
                  </Text>
                </View>

                {/* Proficiency Details */}
                <View style={[styles.modalProficiencyBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.modalProfHeader}>
                    <Ionicons name="speedometer-outline" size={18} color={PROFICIENCY_COLORS[selectedSkillForModal.expected_proficiency]} />
                    <Text style={[styles.modalProfTitle, { color: colors.text }]}>
                      Expected Industry Level: {selectedSkillForModal.expected_proficiency}
                    </Text>
                  </View>
                  <Text style={[styles.modalProfDesc, { color: colors.textSecondary }]}>
                    For the {role.name} role, students are expected to demonstrate Level {selectedSkillForModal.proficiency_level} of 4 proficiency before production deployment.
                  </Text>
                </View>

                {/* Ask AI Tutor CTA */}
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAskAITutorAboutSkill(selectedSkillForModal)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalActionBtnText}>
                    Ask AI Tutor in {lang.name}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={handleCloseSkillModal}
                >
                  <Text style={[styles.modalDismissText, { color: colors.textSecondary }]}>
                    Done
                  </Text>
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
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  backToHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backToHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  topBar: {
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
  topBarTitleBox: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBarSub: {
    fontSize: 11,
  },
  roleBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTitleBox: {
    flex: 1,
  },
  heroCategoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  heroCategoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  whyBox: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  whyText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  skillsSectionContainer: {
    marginBottom: 24,
  },
  skillsSectionHeader: {
    marginBottom: 12,
  },
  skillsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  skillsSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  importanceScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  importanceFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  importanceFilterText: {
    fontSize: 12,
  },
  categoryChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryFilterChipText: {
    fontSize: 11,
  },
  skillsList: {
    gap: 12,
  },
  skillCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillNameCategoryBox: {
    flex: 1,
    marginRight: 8,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '700',
  },
  skillCategoryTag: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  skillCategoryTagText: {
    fontSize: 11,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  importanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skillDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  proficiencySection: {
    marginBottom: 10,
  },
  proficiencyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  proficiencyHeader: {
    fontSize: 11,
  },
  proficiencyValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    height: 6,
    gap: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressStep: {
    flex: 1,
    borderRadius: 3,
  },
  skillCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionRowText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyFilteredBox: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyFilteredTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyFilteredSub: {
    fontSize: 12,
    marginTop: 4,
  },
  resetFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  modalDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleBox: {
    flex: 1,
    marginRight: 10,
  },
  modalSkillName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalImpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalImpText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalDescText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalProficiencyBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalProfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalProfTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalProfDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalDismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalDismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
