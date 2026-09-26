import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { ConversationCard } from '@/components/ConversationCard';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ExplanationSelector } from '@/components/ExplanationSelector';
import { AppHeader, HeaderPill, HeaderAvatar } from '@/components/AppHeader';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '@/constants/languages';
import { getExplanationLevelConfig } from '@/constants/explanationLevels';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    conversations,
    currentLanguage,
    currentExplanationLevel,
    setCurrentLanguage,
    setCurrentExplanationLevel,
    sendMessage,
    loadConversation,
    startNewConversation,
  } = useChat();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLangModal, setShowLangModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const lang = getLanguageByCode(currentLanguage);
  const levelConfig = getExplanationLevelConfig(currentExplanationLevel);

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    try {
      const netState = await Network.getNetworkStateAsync();
      setIsOnline(netState.isConnected ?? true);
    } catch {
      setIsOnline(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkNetwork();
    setRefreshing(false);
  };

  const handleQuickAsk = (conceptQuery: string, customLang?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (customLang && customLang !== currentLanguage) {
      setCurrentLanguage(customLang);
    }
    startNewConversation();
    sendMessage(conceptQuery);
    router.push('/(tabs)/chat');
  };

  const handleResumeConversation = (convId: string) => {
    loadConversation(convId);
    router.push('/(tabs)/chat');
  };

  const quickPrompts = [
    { label: 'Photosynthesis epdi work aaguthu?', lang: 'ta', icon: 'leaf-outline' as const },
    { label: 'Binary Search Tree analogy', lang: 'en', icon: 'git-branch-outline' as const },
    { label: 'Quantum Superposition simply', lang: 'en', icon: 'hardware-chip-outline' as const },
    { label: 'Frontend Developer roadmaps', lang: 'en', icon: 'compass-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <AppHeader
        title="LANGNODE"
        subtitle="Multilingual AI Tutor & Competency Engine"
        icon="sparkles"
        badge={
          !isOnline
            ? {
                text: 'OFFLINE',
                color: colors.warning,
                bgColor: colors.warning + '20',
                icon: 'cloud-offline-outline',
              }
            : undefined
        }
        actions={
          <>
            <HeaderPill
              icon="globe-outline"
              label={lang.nativeName}
              onPress={() => setShowLangModal(true)}
            />
            <HeaderPill
              icon={levelConfig.icon as any}
              iconColor={levelConfig.badgeColor}
              label={levelConfig.title}
              labelColor={levelConfig.badgeColor}
              backgroundColor={levelConfig.badgeColor + '12'}
              borderColor={levelConfig.badgeColor + '50'}
              onPress={() => setShowLevelModal(true)}
            />
            <HeaderAvatar
              name={user?.name}
              onPress={() => router.push('/(tabs)/profile')}
            />
          </>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.responsiveInner}>
          {/* Attention: Cinematic Hero Architecture */}
          <View
            style={[
              styles.heroContainer,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.heroAuraGlow} />

            <View style={styles.heroContent}>
              <Text style={[styles.heroH1, { color: colors.text }]}>
                Break Language Barriers.{'\n'}
                <Text style={{ color: colors.primary }}>Master Any Concept.</Text>
              </Text>

              <Text style={[styles.heroSubhead, { color: colors.textSecondary }]}>
                Ask in English, Tamil, Hindi, Telugu, Malayalam, or Kannada. Complex ideas in Computer Science, Math, and Engineering are anchored into intuitive native mental models with exact technical terminology preserved.
              </Text>

              {/* Elevated High-Contrast Interactive Search */}
              <View
                style={[
                  styles.searchBarWrapper,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="search" size={20} color={colors.primary} style={{ marginLeft: 4 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={lang.placeholder || 'Ask any concept (e.g., Recursion, Photosynthesis)...'}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => {
                    if (searchQuery.trim()) {
                      handleQuickAsk(searchQuery.trim());
                      setSearchQuery('');
                    }
                  }}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  onPress={() => {
                    if (searchQuery.trim()) {
                      handleQuickAsk(searchQuery.trim());
                      setSearchQuery('');
                    } else {
                      router.push('/(tabs)/chat');
                    }
                  }}
                  style={[styles.askSubmitBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Instant Prompt Triggers */}
              <View style={styles.quickPromptsRow}>
                <Text style={[styles.quickPromptLabel, { color: colors.textMuted }]}>Try asking:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
                  {quickPrompts.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.quickPromptChip,
                        {
                          backgroundColor: '#FFFFFF',
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleQuickAsk(p.label, p.lang)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={p.icon} size={12} color={colors.primary} />
                      <Text style={[styles.quickPromptChipText, { color: colors.text }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Platform Capability Credibility Strip */}
          <View
            style={[
              styles.statsStrip,
              {
                backgroundColor: '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>6</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Languages</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: colors.success }]}>100%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Terms Preserved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: colors.secondary }]}>7</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Career Tracks</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>5-Phase</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Roadmaps</Text>
            </View>
          </View>

          {/* Interest: Interactive Bento Grid Architecture */}
          <View style={styles.bentoSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Platform Capabilities</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>AI Tutor, Document RAG & Career Pathways</Text>
            </View>

            {/* Bento Card 1: Flagship Multilingual AI Tutor (Hero Card) */}
            <TouchableOpacity
              style={[
                styles.bentoFlagshipCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderLeftColor: colors.primary,
                  borderLeftWidth: 5,
                },
              ]}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.85}
            >
              <View style={styles.bentoCardHeader}>
                <View style={styles.bentoIconBadgeRow}>
                  <View style={[styles.bentoIconContainer, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                  </View>
                  <View style={[styles.metaTagPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.metaTagText}>FLAGSHIP TUTOR</Text>
                  </View>
                </View>
                <View style={[styles.badgeTag, { backgroundColor: colors.success + '20', borderColor: colors.success + '40', borderWidth: 1 }]}>
                  <Text style={[styles.badgeTagText, { color: colors.success }]}>Zero Distortion</Text>
                </View>
              </View>

              <Text style={[styles.bentoCardTitle, { color: colors.text }]}>
                Multilingual Concept Deconstruction
              </Text>
              <Text style={[styles.bentoCardBody, { color: colors.textSecondary }]}>
                Supports code-switching (e.g., &quot;Photosynthesis epdi work aaguthu?&quot;). The system identifies educational intent, preserving English technical terms while delivering culturally grounded analogies across 3 pedagogical levels.
              </Text>

              {/* Quick Language Switcher Pills inside Card */}
              <View style={styles.bentoLangList}>
                {SUPPORTED_LANGUAGES.map((l) => {
                  const isCurrent = l.code === currentLanguage;
                  return (
                    <TouchableOpacity
                      key={l.code}
                      style={[
                        styles.bentoLangChip,
                        {
                          backgroundColor: isCurrent ? colors.primary : colors.surfaceSubtle,
                          borderColor: isCurrent ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setCurrentLanguage(l.code)}
                    >
                      <Text
                        style={[
                          styles.bentoLangChipText,
                          { color: isCurrent ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {l.nativeName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.bentoCardFooter}>
                <View style={styles.bentoActionBtn}>
                  <Text style={[styles.bentoActionBtnText, { color: colors.primary }]}>Launch AI Session</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Bento Grid Dual Columns: Document RAG & Career Pathways */}
            <View style={styles.bentoGridRow}>
              {/* Bento Card 2: Document RAG */}
              <TouchableOpacity
                style={[
                  styles.bentoHalfCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderTopColor: colors.secondary,
                    borderTopWidth: 4,
                  },
                ]}
                onPress={() => router.push('/(tabs)/documents' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.bentoCardHeader}>
                  <View style={[styles.bentoIconContainer, { backgroundColor: colors.secondary + '18' }]}>
                    <Ionicons name="book" size={18} color={colors.secondary} />
                  </View>
                  <View style={[styles.metaTagPill, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.metaTagText}>STUDY RAG</Text>
                  </View>
                </View>

                <Text style={[styles.bentoHalfCardTitle, { color: colors.text }]}>
                  Document RAG Study
                </Text>
                <Text style={[styles.bentoHalfCardBody, { color: colors.textSecondary }]}>
                  Upload PDF, DOCX, or text notes. Ask questions in your native language with semantic vector retrieval.
                </Text>

                <View style={styles.bentoHalfFooter}>
                  <View style={[styles.formatTag, { backgroundColor: colors.secondaryLight }]}>
                    <Text style={[styles.formatTagText, { color: colors.secondary }]}>PDF • DOCX • TXT</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color={colors.secondary} />
                </View>
              </TouchableOpacity>

              {/* Bento Card 3: Career Competency Explorer */}
              <TouchableOpacity
                style={[
                  styles.bentoHalfCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderTopColor: colors.primary,
                    borderTopWidth: 4,
                  },
                ]}
                onPress={() => router.push('/(tabs)/career' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.bentoCardHeader}>
                  <View style={[styles.bentoIconContainer, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="compass" size={18} color={colors.primary} />
                  </View>
                  <View style={[styles.metaTagPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.metaTagText}>CAREER MAP</Text>
                  </View>
                </View>

                <Text style={[styles.bentoHalfCardTitle, { color: colors.text }]}>
                  Career Competency
                </Text>
                <Text style={[styles.bentoHalfCardBody, { color: colors.textSecondary }]}>
                  Select from 7 tech roles. Assess your skill gaps and unlock an automated 5-phase learning roadmap.
                </Text>

                <View style={styles.bentoHalfFooter}>
                  <View style={[styles.formatTag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.formatTagText, { color: colors.primary }]}>7 Tech Roles • Gaps</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recommended Concepts in Selected Language */}
          <View style={styles.conceptsSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Explore Concepts in {lang.nativeName}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  High-yield analogies curated for {levelConfig.title} Level
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  startNewConversation();
                  router.push('/(tabs)/chat');
                }}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ask AI Tutor →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.topicsGrid}>
              {lang.sampleTopics.map((topic, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickAsk(topic.concept)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicIconRow}>
                    <View style={[styles.topicIconCircle, { backgroundColor: colors.primary + '18' }]}>
                      <Ionicons name="sparkles" size={14} color={colors.primary} />
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>

                  <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                  <Text style={[styles.topicConcept, { color: colors.textSecondary }]} numberOfLines={2}>
                    {topic.concept}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Conversations */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Learning Sessions</Text>
              {conversations.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/conversations')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>View All ({conversations.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {conversations.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyCardTitle, { color: colors.text }]}>No learning sessions yet</Text>
                <Text style={[styles.emptyCardSub, { color: colors.textSecondary }]}>
                  Ask your first concept in the search bar above to generate an intuitive explanation.
                </Text>
              </View>
            ) : (
              conversations.slice(0, 3).map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  onPress={() => handleResumeConversation(conv.id)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <LanguageSelector
        visible={showLangModal}
        selectedLanguage={currentLanguage}
        onSelect={setCurrentLanguage}
        onClose={() => setShowLangModal(false)}
      />

      <ExplanationSelector
        visible={showLevelModal}
        selectedLevel={currentExplanationLevel}
        onSelect={setCurrentExplanationLevel}
        onClose={() => setShowLevelModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderWrapper: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topHeaderContent: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerSelectorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  responsiveInner: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  heroContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroAuraGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroH1: {
    fontSize: Platform.OS === 'web' ? 32 : 26,
    lineHeight: Platform.OS === 'web' ? 38 : 32,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubhead: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 720,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    paddingVertical: 8,
    fontWeight: '500',
  },
  askSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickPromptLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickPromptsScroll: {
    gap: 8,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickPromptChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  bentoSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  bentoFlagshipCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoIconBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bentoCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  bentoCardBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  bentoLangList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  bentoLangChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  bentoLangChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bentoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bentoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bentoGridRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 14,
  },
  bentoHalfCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  bentoHalfCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  bentoHalfCardBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  bentoHalfFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  conceptsSection: {
    marginBottom: 24,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    width: Platform.OS === 'web' ? '48.8%' : '48.2%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topicIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  topicConcept: {
    fontSize: 12,
    lineHeight: 16,
  },
  recentSection: {
    marginBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
