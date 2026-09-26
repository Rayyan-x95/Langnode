import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig, ExplanationLevel } from '@/constants/explanationLevels';

interface ChatInputProps {
  onSend: (text: string) => void;
  isGenerating?: boolean;
  currentLanguage: string;
  currentExplanationLevel: ExplanationLevel;
  onOpenLanguageSelector?: () => void;
  onOpenExplanationSelector?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isGenerating = false,
  currentLanguage,
  currentExplanationLevel,
  onOpenLanguageSelector,
  onOpenExplanationSelector,
}) => {
  const { colors } = useTheme();
  const {
    voiceState,
    isVoiceRecording,
    recordingDurationSeconds,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    autoTTS,
    toggleAutoTTS,
  } = useChat();

  const [text, setText] = useState('');
  const lang = getLanguageByCode(currentLanguage);
  const levelConfig = getExplanationLevelConfig(currentExplanationLevel);

  const handleSend = () => {
    if (!text.trim() || isGenerating) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSend(text.trim());
    setText('');
  };

  const handleVoiceRecordToggle = async () => {
    if (isVoiceRecording) {
      await stopVoiceRecording();
    } else {
      await startVoiceRecording();
    }
  };

  const handleSimulatedTanglishVoice = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSend('Photosynthesis epdi work aaguthu?');
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* Quick context pills & voice toggle */}
      <View style={styles.quickSelectorsRow}>
        {onOpenLanguageSelector && (
          <TouchableOpacity
            style={[
              styles.quickPill,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary + '35',
              },
            ]}
            onPress={onOpenLanguageSelector}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={12} color={colors.primary} />
            <Text style={[styles.quickPillText, { color: colors.primary }]}>
              {lang.nativeName}
            </Text>
            <Ionicons name="chevron-down" size={10} color={colors.primary} />
          </TouchableOpacity>
        )}

        {onOpenExplanationSelector && (
          <TouchableOpacity
            style={[
              styles.quickPill,
              {
                backgroundColor: levelConfig.badgeColor + '15',
                borderColor: levelConfig.badgeColor + '40',
              },
            ]}
            onPress={onOpenExplanationSelector}
            activeOpacity={0.7}
          >
            <Ionicons
              name={levelConfig.icon as any}
              size={12}
              color={levelConfig.badgeColor}
            />
            <Text
              style={[styles.quickPillText, { color: levelConfig.badgeColor }]}
            >
              {levelConfig.title}
            </Text>
            <Ionicons
              name="chevron-down"
              size={10}
              color={levelConfig.badgeColor}
            />
          </TouchableOpacity>
        )}

        {/* Auto TTS Toggle Pill */}
        <TouchableOpacity
          style={[
            styles.quickPill,
            {
              backgroundColor: autoTTS
                ? colors.primaryLight
                : colors.surfaceSubtle,
              borderColor: autoTTS ? colors.primary : colors.border,
            },
          ]}
          onPress={toggleAutoTTS}
          activeOpacity={0.7}
        >
          <Ionicons
            name={autoTTS ? 'volume-high' : 'volume-mute-outline'}
            size={13}
            color={autoTTS ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.quickPillText,
              {
                color: autoTTS ? colors.primary : colors.textMuted,
                fontWeight: autoTTS ? '700' : '500',
              },
            ]}
          >
            {autoTTS ? 'Voice Out: ON' : 'Voice Out'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Recording Active State Bar */}
      {isVoiceRecording ? (
        <View
          style={[
            styles.recordingBar,
            {
              backgroundColor: '#FEF2F2',
              borderColor: '#EF4444',
            },
          ]}
        >
          <View style={styles.recordingLeft}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>
              {formatSeconds(recordingDurationSeconds)}
            </Text>
            <Text style={[styles.recordingHint, { color: colors.textSecondary }]}>
              Listening in {lang.name}...
            </Text>
          </View>

          <View style={styles.recordingControls}>
            <TouchableOpacity
              onPress={cancelVoiceRecording}
              style={[styles.cancelRecordBtn, { borderColor: colors.border }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={stopVoiceRecording}
              style={styles.finishRecordBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Regular Text / Voice Input Row */
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
              },
            ]}
            placeholder={
              lang.code === 'ta'
                ? 'கேளுங்கள் (எ.கா: Photosynthesis epdi work aaguthu?)...'
                : lang.code === 'hi'
                ? 'पूछिए (उदा: Recursion kaise kaam karta hai?)...'
                : lang.placeholder || 'Ask any concept...'
            }
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            value={text}
            onChangeText={setText}
            editable={!isGenerating && voiceState !== 'processing'}
          />

          {text.length > 0 ? (
            <>
              <TouchableOpacity
                onPress={() => setText('')}
                style={styles.clearButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || isGenerating}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      text.trim() && !isGenerating ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={text.trim() ? '#FFFFFF' : colors.textMuted}
                  />
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Microphone voice button when text is empty */
            <View style={styles.voiceActionsRow}>
              {/* Quick Sample Tanglish voice button */}
              <TouchableOpacity
                onPress={handleSimulatedTanglishVoice}
                style={[
                  styles.quickVoiceChip,
                  {
                    backgroundColor: colors.secondaryLight,
                    borderColor: colors.secondary + '35',
                  },
                ]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="sparkles" size={10} color={colors.secondary} />
                <Text style={[styles.quickVoiceChipText, { color: colors.secondary }]}>
                  Tanglish Demo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVoiceRecordToggle}
                disabled={isGenerating || voiceState === 'processing'}
                style={[
                  styles.micButton,
                  {
                    backgroundColor:
                      voiceState === 'processing'
                        ? '#F59E0B'
                        : colors.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                {voiceState === 'processing' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="mic" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 96 : Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
  },
  quickSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 4,
  },
  clearButton: {
    padding: 6,
    marginBottom: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  voiceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  quickVoiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickVoiceChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  recordingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  recordingHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelRecordBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  finishRecordBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
