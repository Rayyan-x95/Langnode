import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig } from '@/constants/explanationLevels';
import { FormattedMessageText } from '@/components/FormattedMessageText';

interface ChatBubbleProps {
  message: ChatMessage;
  onOpenActions?: (message: ChatMessage) => void;
  onSelectFollowup?: (followup: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onOpenActions,
  onSelectFollowup,
}) => {
  const { colors } = useTheme();
  const {
    speakingMessageId,
    speakMessage,
    explainModeMessage,
    isGenerating,
  } = useChat();

  const isUser = message.role === 'user';
  const lang = getLanguageByCode(message.language);
  const levelConfig = getExplanationLevelConfig(message.explanationLevel);
  const isSpeaking = speakingMessageId === message.id;

  const handleSpeakToggle = () => {
    speakMessage(message.id, message.content, message.language);
  };

  const handleQuickExplainMode = (mode: 'simply' | 'example' | 'analogy') => {
    explainModeMessage(message.id, mode);
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.assistantHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.assistantMeta}>
            <Text style={[styles.assistantName, { color: colors.text }]}>
              Langnode Tutor
            </Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.tagBadge,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {lang.nativeName}
                </Text>
              </View>

              <View
                style={[
                  styles.tagBadge,
                  { backgroundColor: levelConfig.badgeColor + '20' },
                ]}
              >
                <Text
                  style={[styles.tagText, { color: levelConfig.badgeColor }]}
                >
                  {levelConfig.title}
                </Text>
              </View>

              {/* Mixed Language / Code-switching Badge */}
              {message.isMixed && (
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: '#FFE4E6',
                      borderColor: '#F43F5E',
                      borderWidth: 0.5,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: '#E11D48' }]}>
                    Mixed Bilingual
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* TTS Audio Speak Button */}
          <TouchableOpacity
            onPress={handleSpeakToggle}
            style={[
              styles.speakButton,
              {
                backgroundColor: isSpeaking
                  ? colors.accent + '25'
                  : colors.surfaceSubtle,
                borderColor: isSpeaking ? colors.accent : colors.border,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
              size={16}
              color={isSpeaking ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>

          {onOpenActions && (
            <TouchableOpacity
              onPress={() => onOpenActions(message)}
              style={styles.moreButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.chatUserBubble }]
            : [
                styles.assistantBubble,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ],
        ]}
      >
        <FormattedMessageText content={message.content} isUser={isUser} />

        {/* Preserved Technical Terminology Badges */}
        {!isUser && message.preservedTerms && message.preservedTerms.length > 0 && (
          <View style={styles.preservedContainer}>
            <View style={styles.preservedHeader}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={[styles.preservedTitle, { color: '#10B981' }]}>
                Preserved Technical Terminology:
              </Text>
            </View>
            <View style={styles.conceptPills}>
              {message.preservedTerms.map((term, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.preservedPill,
                    {
                      backgroundColor: '#ECFDF5',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <Text style={[styles.preservedPillText, { color: '#059669' }]}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Concepts Chips */}
        {!isUser && message.keyConcepts && message.keyConcepts.length > 0 && (
          <View style={styles.conceptsContainer}>
            <Text style={[styles.conceptsTitle, { color: colors.textMuted }]}>
              Key Concepts:
            </Text>
            <View style={styles.conceptPills}>
              {message.keyConcepts.map((concept, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.conceptPill,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary + '35',
                    },
                  ]}
                >
                  <Ionicons name="bookmark" size={10} color={colors.primary} />
                  <Text
                    style={[styles.conceptPillText, { color: colors.primary }]}
                  >
                    {concept}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Explanation Mode Transformation Actions (Explain Simply / Example / Analogy) */}
        {!isUser && (
          <View style={styles.quickModesContainer}>
            <Text style={[styles.quickModesTitle, { color: colors.textMuted }]}>
              Quick Modes:
            </Text>
            <View style={styles.quickModeButtonsRow}>
              <TouchableOpacity
                onPress={() => handleQuickExplainMode('simply')}
                disabled={isGenerating}
                style={[
                  styles.quickModeBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.quickModeIcon}>💡</Text>
                <Text
                  style={[styles.quickModeText, { color: colors.textSecondary }]}
                >
                  Explain Simply
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickExplainMode('example')}
                disabled={isGenerating}
                style={[
                  styles.quickModeBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.quickModeIcon}>🛠️</Text>
                <Text
                  style={[styles.quickModeText, { color: colors.textSecondary }]}
                >
                  With Example
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickExplainMode('analogy')}
                disabled={isGenerating}
                style={[
                  styles.quickModeBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.quickModeIcon}>🎭</Text>
                <Text
                  style={[styles.quickModeText, { color: colors.textSecondary }]}
                >
                  With Analogy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footerRow}>
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            {message.timestamp}
          </Text>
        </View>
      </View>

      {/* Suggested Followups */}
      {!isUser &&
        message.suggestedFollowups &&
        message.suggestedFollowups.length > 0 && (
          <View style={styles.followupContainer}>
            <Text style={[styles.followupHeader, { color: colors.textMuted }]}>
              Suggested Follow-ups:
            </Text>
            {message.suggestedFollowups.map((followup, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.followupButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onSelectFollowup && onSelectFollowup(followup)}
              >
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={16}
                  color={colors.secondary}
                />
                <Text
                  style={[styles.followupText, { color: colors.textSecondary }]}
                >
                  {followup}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assistantMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantName: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speakButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  moreButton: {
    padding: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '88%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '400',
  },
  preservedContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#10B98140',
  },
  preservedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  preservedTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preservedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  preservedPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  conceptsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E140',
  },
  conceptsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conceptPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conceptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  conceptPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickModesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E140',
  },
  quickModesTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickModeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickModeIcon: {
    fontSize: 11,
  },
  quickModeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 10,
  },
  followupContainer: {
    marginTop: 8,
    width: '88%',
    gap: 6,
  },
  followupHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 2,
  },
  followupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  followupText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
});
