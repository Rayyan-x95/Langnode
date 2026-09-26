import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ConversationSummary } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig } from '@/constants/explanationLevels';

interface ConversationCardProps {
  conversation: ConversationSummary;
  isActive?: boolean;
  onPress: () => void;
  onDelete?: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isActive = false,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();
  const lang = getLanguageByCode(conversation.language);
  const levelConfig = getExplanationLevelConfig(conversation.explanationLevel);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const handleDelete = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    if (onDelete) onDelete();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? colors.primaryLight
            : colors.card,
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text
            style={[
              styles.title,
              { color: isActive ? colors.primary : colors.text },
            ]}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
        </View>

        <View style={styles.metaRight}>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {conversation.updatedAt}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text
        style={[styles.preview, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {conversation.lastMessagePreview || 'No messages yet'}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.badgeGroup}>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Ionicons name="globe-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {lang.nativeName}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: levelConfig.badgeColor + '20' },
            ]}
          >
            <Ionicons
              name={levelConfig.icon as any}
              size={11}
              color={levelConfig.badgeColor}
            />
            <Text
              style={[styles.badgeText, { color: levelConfig.badgeColor }]}
            >
              {levelConfig.title}
            </Text>
          </View>
        </View>

        <View style={styles.messageCount}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={12}
            color={colors.textMuted}
          />
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            {conversation.messageCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 2,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
