import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getLanguageByCode } from '@/constants/languages';

interface EmptyStateProps {
  title?: string;
  description?: string;
  languageCode?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  languageCode = 'en',
  icon = 'school-outline',
  actionLabel,
  onAction,
  onSelectPrompt,
}) => {
  const { colors } = useTheme();
  const lang = getLanguageByCode(languageCode);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.primaryLight,
          },
        ]}
      >
        <Ionicons name={icon as any} size={36} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title || 'Start Exploring Concepts'}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description ||
          `Ask questions freely in ${lang.nativeName} (${lang.name}). The AI Tutor adapts conceptual explanations without language barriers.`}
      </Text>

      {/* Sample starter concept questions */}
      {onSelectPrompt && lang.sampleTopics && (
        <View style={styles.samplesArea}>
          <Text style={[styles.samplesHeader, { color: colors.textMuted }]}>
            Try asking one of these:
          </Text>
          <View style={styles.promptList}>
            {lang.sampleTopics.map((topic, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.promptPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onSelectPrompt(topic.concept)}
                activeOpacity={0.7}
              >
                <View style={styles.promptHeaderRow}>
                  <Text style={[styles.topicTag, { color: colors.primary }]}>
                    {topic.title}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={[styles.promptText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {`"${topic.concept}"`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    width: '100%',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  samplesArea: {
    width: '100%',
    marginBottom: 20,
  },
  samplesHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  promptList: {
    gap: 10,
  },
  promptPill: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
