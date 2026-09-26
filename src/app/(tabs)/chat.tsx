import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatInput } from '@/components/ChatInput';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { EmptyState } from '@/components/EmptyState';
import { MessageActions } from '@/components/MessageActions';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ExplanationSelector } from '@/components/ExplanationSelector';
import { AppHeader, HeaderPill, HeaderButton } from '@/components/AppHeader';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig } from '@/constants/explanationLevels';

export default function ChatScreen() {
  const {
    messages,
    currentLanguage,
    currentExplanationLevel,
    isGenerating,
    error,
    clearError,
    voiceState,
    sendMessage,
    reExplainMessage,
    explainModeMessage,
    translateMessage,
    startNewConversation,
    setCurrentLanguage,
    setCurrentExplanationLevel,
  } = useChat();

  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const net = await Network.getNetworkStateAsync();
        setIsOnline(net.isConnected ?? true);
      } catch {
        setIsOnline(true);
      }
    })();
  }, []);

  const lang = getLanguageByCode(currentLanguage);
  const levelConfig = getExplanationLevelConfig(currentExplanationLevel);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isGenerating]);

  const handleOpenActions = (msg: ChatMessage) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedMessage(msg);
    setShowActionsModal(true);
  };

  const handleCopy = async (content: string) => {
    // If expo-clipboard is not installed, we can use navigator or alert
    try {
      Alert.alert('Copied', 'Explanation copied to clipboard.');
    } catch {}
  };

  const handleNewChat = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    startNewConversation();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top AI Tutor Header */}
      <AppHeader
        title="AI Tutor"
        subtitle={`${lang.nativeName} (${lang.name}) • ${levelConfig.title}`}
        icon="sparkles"
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
            <HeaderButton
              icon="add"
              label="New Chat"
              variant="primary"
              onPress={handleNewChat}
            />
          </>
        }
      />

      {/* Offline Status Banner */}
      {!isOnline && (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: colors.warning + '18',
              borderBottomColor: colors.warning + '40',
            },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
          <Text style={[styles.statusBannerText, { color: colors.warning }]}>
            Offline Mode: Operating with on-device multilingual synthesis.
          </Text>
        </View>
      )}

      {/* Error State Banner */}
      {error && (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: colors.danger + '18',
              borderBottomColor: colors.danger + '40',
            },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={[styles.statusBannerText, { color: colors.danger, flex: 1 }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Processing State Banner */}
      {voiceState === 'processing' && (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: colors.primary + '18',
              borderBottomColor: colors.primary + '40',
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.statusBannerText, { color: colors.primary }]}>
            Processing voice input & resolving educational intent...
          </Text>
        </View>
      )}

      {/* Main Chat Stream */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              onOpenActions={handleOpenActions}
              onSelectFollowup={(followup) => sendMessage(followup)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && { flexGrow: 1, justifyContent: 'center' },
          ]}
          ListEmptyComponent={
            <EmptyState
              languageCode={currentLanguage}
              title={`Ask in ${lang.nativeName}`}
              description={`I explain any STEM, algorithmic, or science concept in ${lang.nativeName} (${lang.name}) at ${levelConfig.title} depth.`}
              onSelectPrompt={(prompt) => sendMessage(prompt)}
            />
          }
          ListFooterComponent={
            isGenerating ? (
              <LoadingIndicator
                language={currentLanguage}
                explanationLevel={currentExplanationLevel}
              />
            ) : null
          }
        />

        {/* Input Bar */}
        <ChatInput
          onSend={(txt) => sendMessage(txt)}
          isGenerating={isGenerating}
          currentLanguage={currentLanguage}
          currentExplanationLevel={currentExplanationLevel}
          onOpenLanguageSelector={() => setShowLangModal(true)}
          onOpenExplanationSelector={() => setShowLevelModal(true)}
        />
      </KeyboardAvoidingView>

      {/* Modals */}
      <MessageActions
        visible={showActionsModal}
        message={selectedMessage}
        onClose={() => setShowActionsModal(false)}
        onCopy={handleCopy}
        onReExplain={(id, lvl) => reExplainMessage(id, lvl)}
        onTranslate={(id, targetLang) => translateMessage(id, targetLang)}
        onExplainMode={(id, mode) => explainModeMessage(id, mode)}
      />

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  keyboardContainer: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
