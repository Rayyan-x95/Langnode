import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

const STATUS_OPTIONS: { key: 'not_started' | 'in_progress' | 'completed'; label: string; color: string; icon: string }[] = [
  { key: 'not_started', label: 'Not Started', color: '#94A3B8', icon: 'ellipse-outline' },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B', icon: 'time-outline' },
  { key: 'completed', label: 'Completed', color: '#10B981', icon: 'checkmark-circle' },
];

export default function RoadmapItemDetailScreen() {
  const router = useRouter();
  const { itemId, roleId } = useLocalSearchParams<{ itemId: string; roleId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, startNewConversation, sendMessage } = useChat();

  const [activeRoleId, setActiveRoleId] = useState<string>(roleId || 'role_frontend');
  const [roadmap, setRoadmap] = useState<PersonalizedRoadmapResponse | null>(null);
  const [item, setItem] = useState<RoadmapItem | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        const data = await RoadmapApiService.getRoadmap(activeRoleId, userId);
        setRoadmap(data);
        for (const phase of data.phases) {
          const found = phase.items.find((i) => i.id === itemId);
          if (found) {
            setItem(found);
            break;
          }
        }
      } catch (err) {
        console.warn('[RoadmapItemDetailScreen] Error loading roadmap item:', err);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [itemId, activeRoleId, userId]);

  const handleUpdateStatus = async (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!item) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await RoadmapApiService.updateItemStatus(activeRoleId, item.id, newStatus, userId);
      setRoadmap(updated);
      setItem({ ...item, status: newStatus });
    } catch (err) {
      console.warn('[RoadmapItemDetailScreen] Error updating status:', err);
    }
  };

  const handleLearnWithLangnode = () => {
    if (!item) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    startNewConversation();
    const prompt =
      `Target Skill: ${item.skill_name}\n` +
      `Current Level: ${item.current_level}\n` +
      `Target Level: ${item.target_level}\n` +
      `Learning Objective: ${item.learning_objective}\n` +
      `Recommended Activity: ${item.recommended_activity}\n\n` +
      `Hello! I am preparing for ${roadmap?.role_name || 'my career'}. Please guide me through "${item.topic}" in ${lang.name}, explaining key concepts with practical examples and dual-script technical terminology.`;

    sendMessage(prompt);
    router.push('/(tabs)/chat' as any);
  };

  if (loading || !item) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading curriculum topic details...
        </Text>
      </SafeAreaView>
    );
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
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {item.phase_name.toUpperCase()}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {item.skill_name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.roadmapBtn, { borderColor: colors.border }]}
          onPress={() => router.push({ pathname: '/career/roadmap', params: { roleId: activeRoleId } } as any)}
        >
          <Ionicons name="map-outline" size={14} color={colors.primary} />
          <Text style={[styles.roadmapBtnText, { color: colors.primary }]}>Roadmap</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Topic Banner */}
        <View
          style={[
            styles.topicCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.phaseTagRow}>
            <View style={[styles.phaseTag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.phaseTagText, { color: colors.primary }]}>
                Phase {item.phase_number}
              </Text>
            </View>
            <View style={[styles.hoursTag, { backgroundColor: colors.border }]}>
              <Text style={[styles.hoursTagText, { color: colors.textSecondary }]}>
                ~{item.estimated_hours} Hours
              </Text>
            </View>
          </View>

          <Text style={[styles.topicTitle, { color: colors.text }]}>{item.topic}</Text>
          <Text style={[styles.skillSub, { color: colors.textSecondary }]}>
            Part of skill competency:{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{item.skill_name}</Text>
          </Text>

          {/* Level Transition Pill */}
          <View style={[styles.levelTransitionBox, { backgroundColor: colors.surfaceSubtle }]}>
            <View style={styles.levelCol}>
              <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Current Standing</Text>
              <Text style={[styles.levelValue, { color: colors.text }]}>{item.current_level}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            <View style={styles.levelCol}>
              <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Target Mastery</Text>
              <Text style={[styles.levelValue, { color: colors.primary }]}>{item.target_level}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Learning Objective */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning Objective</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {item.learning_objective}
          </Text>
        </View>

        {/* Section 2: Recommended Activity */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="construct-outline" size={18} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Practice Activity</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {item.recommended_activity}
          </Text>
        </View>

        {/* Status Selector */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flag-outline" size={18} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Topic Progress State</Text>
          </View>

          <View style={styles.statusButtonsGroup}>
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = item.status === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.statusOptionBtn,
                    {
                      backgroundColor: isSelected ? opt.color : colors.surface,
                      borderColor: isSelected ? opt.color : colors.border,
                    },
                  ]}
                  onPress={() => handleUpdateStatus(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Learn With Langnode Hero CTA */}
        <TouchableOpacity
          style={[styles.heroLearnBtn, { backgroundColor: colors.primary }]}
          onPress={handleLearnWithLangnode}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.heroLearnBtnTitle}>Learn with Langnode AI Tutor</Text>
            <Text style={styles.heroLearnBtnSub}>
              Adaptive step-by-step guidance in {lang.name} ({lang.nativeName})
            </Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  phaseTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  phaseTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  hoursTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hoursTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  topicTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  skillSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  levelTransitionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  levelCol: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  levelValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 11,
  },
  heroLearnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  heroLearnBtnTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  heroLearnBtnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
});
