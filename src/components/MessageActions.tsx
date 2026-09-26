import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChatMessage } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { ExplanationLevel, EXPLANATION_LEVELS } from '@/constants/explanationLevels';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface MessageActionsProps {
  visible: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  onCopy: (content: string) => void;
  onReExplain: (messageId: string, level: ExplanationLevel) => void;
  onTranslate: (messageId: string, targetLanguage: string) => void;
  onExplainMode?: (messageId: string, mode: 'simply' | 'example' | 'analogy') => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  visible,
  message,
  onClose,
  onCopy,
  onReExplain,
  onTranslate,
  onExplainMode,
}) => {
  const { colors } = useTheme();

  if (!message) return null;

  const handleCopy = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onCopy(message.content);
    onClose();
  };

  const handleLevel = (lvl: ExplanationLevel) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onReExplain(message.id, lvl);
    onClose();
  };

  const handleLang = (code: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onTranslate(message.id, code);
    onClose();
  };

  const handleExplainMode = (mode: 'simply' | 'example' | 'analogy') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (onExplainMode) {
      onExplainMode(message.id, mode);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.indicator} />

          <Text style={[styles.title, { color: colors.text }]}>
            Message Options
          </Text>

          {/* Quick Copy */}
          <TouchableOpacity
            style={[
              styles.actionItem,
              { backgroundColor: colors.surfaceSubtle },
            ]}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Copy Explanation Text
            </Text>
          </TouchableOpacity>

          {/* Quick Explanation Transformations */}
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Transform Explanation Mode
          </Text>
          <View style={styles.levelsGrid}>
            <TouchableOpacity
              style={[
                styles.levelButton,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleExplainMode('simply')}
            >
              <Text style={{ fontSize: 13 }}>💡</Text>
              <Text style={[styles.levelBtnText, { color: colors.text }]}>
                Simply
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.levelButton,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleExplainMode('example')}
            >
              <Text style={{ fontSize: 13 }}>🛠️</Text>
              <Text style={[styles.levelBtnText, { color: colors.text }]}>
                Example
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.levelButton,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleExplainMode('analogy')}
            >
              <Text style={{ fontSize: 13 }}>🎭</Text>
              <Text style={[styles.levelBtnText, { color: colors.text }]}>
                Analogy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Re-explain at Depth */}
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Re-Explain At Different Depth
          </Text>
          <View style={styles.levelsGrid}>
            {EXPLANATION_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.levelButton,
                  {
                    backgroundColor:
                      message.explanationLevel === lvl.id
                        ? lvl.badgeColor + '20'
                        : colors.surfaceSubtle,
                    borderColor:
                      message.explanationLevel === lvl.id
                        ? lvl.badgeColor
                        : colors.border,
                  },
                ]}
                onPress={() => handleLevel(lvl.id)}
              >
                <Ionicons
                  name={lvl.icon as any}
                  size={16}
                  color={lvl.badgeColor}
                />
                <Text
                  style={[
                    styles.levelBtnText,
                    {
                      color:
                        message.explanationLevel === lvl.id
                          ? lvl.badgeColor
                          : colors.text,
                    },
                  ]}
                >
                  {lvl.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Translate into Native Language */}
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Bridge Into Another Native Language
          </Text>
          <View style={styles.languagesGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langButton,
                  {
                    backgroundColor:
                      message.language === lang.code
                        ? colors.primary + '20'
                        : colors.surfaceSubtle,
                    borderColor:
                      message.language === lang.code
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => handleLang(lang.code)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        message.language === lang.code
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#94A3B860',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  levelsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  levelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
