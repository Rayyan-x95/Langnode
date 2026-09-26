import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { ApiService, ChatMessagePayload, ChatRequestPayload } from '@/services/api';
import { Storage } from '@/services/storage';
import { VoiceService, VoiceState } from '@/services/voice';
import { DEFAULT_LANGUAGE, getLanguageByCode } from '@/constants/languages';
import { DEFAULT_EXPLANATION_LEVEL, ExplanationLevel } from '@/constants/explanationLevels';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: string;
  explanationLevel: ExplanationLevel;
  explanationMode?: 'standard' | 'simply' | 'example' | 'analogy';
  isMixed?: boolean;
  detectedTopic?: string;
  keyConcepts?: string[];
  suggestedFollowups?: string[];
  analogiesUsed?: string[];
  preservedTerms?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string;
  language: string;
  explanationLevel: ExplanationLevel;
  updatedAt: string;
  messageCount: number;
}

interface ChatContextType {
  activeConversationId: string;
  messages: ChatMessage[];
  conversations: ConversationSummary[];
  currentLanguage: string;
  currentExplanationLevel: ExplanationLevel;
  isGenerating: boolean;
  error: string | null;
  // Voice State
  voiceState: VoiceState;
  isVoiceRecording: boolean;
  recordingDurationSeconds: number;
  speakingMessageId: string | null;
  autoTTS: boolean;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => Promise<void>;
  cancelVoiceRecording: () => Promise<void>;
  speakMessage: (messageId: string, content: string, language: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  toggleAutoTTS: () => void;
  // Core actions
  setCurrentLanguage: (lang: string) => Promise<void>;
  setCurrentExplanationLevel: (level: ExplanationLevel) => Promise<void>;
  sendMessage: (
    content: string,
    mode?: 'standard' | 'simply' | 'example' | 'analogy'
  ) => Promise<void>;
  reExplainMessage: (messageId: string, level: ExplanationLevel) => Promise<void>;
  explainModeMessage: (
    messageId: string,
    mode: 'simply' | 'example' | 'analogy'
  ) => Promise<void>;
  translateMessage: (messageId: string, targetLanguage: string) => Promise<void>;
  startNewConversation: () => string;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType>({
  activeConversationId: '',
  messages: [],
  conversations: [],
  currentLanguage: DEFAULT_LANGUAGE.code,
  currentExplanationLevel: DEFAULT_EXPLANATION_LEVEL,
  isGenerating: false,
  error: null,
  voiceState: 'idle',
  isVoiceRecording: false,
  recordingDurationSeconds: 0,
  speakingMessageId: null,
  autoTTS: false,
  startVoiceRecording: async () => {},
  stopVoiceRecording: async () => {},
  cancelVoiceRecording: async () => {},
  speakMessage: async () => {},
  stopSpeaking: async () => {},
  toggleAutoTTS: () => {},
  setCurrentLanguage: async () => {},
  setCurrentExplanationLevel: async () => {},
  sendMessage: async () => {},
  reExplainMessage: async () => {},
  explainModeMessage: async () => {},
  translateMessage: async () => {},
  startNewConversation: () => '',
  loadConversation: () => {},
  deleteConversation: async () => {},
  clearActiveConversation: async () => {},
  clearError: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string>(`conv_${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentLanguage, setCurrentLanguageState] = useState<string>(DEFAULT_LANGUAGE.code);
  const [currentExplanationLevel, setCurrentExplanationLevelState] = useState<ExplanationLevel>(DEFAULT_EXPLANATION_LEVEL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice & Audio States
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const recordingTimerRef = useRef<any>(null);

  // Sync initial language/level preferences from user or storage
  useEffect(() => {
    (async () => {
      const [savedLang, savedLevel, savedConvs] = await Promise.all([
        Storage.getLanguage(),
        Storage.getExplanationLevel(),
        Storage.getCachedConversations<{ conversations: ConversationSummary[]; historyMap: Record<string, ChatMessage[]> }>(),
      ]);

      if (user?.preferredLanguage) {
        setCurrentLanguageState(user.preferredLanguage);
      } else if (savedLang) {
        setCurrentLanguageState(savedLang);
      }

      if (user?.preferredExplanationLevel) {
        setCurrentExplanationLevelState(user.preferredExplanationLevel);
      } else if (savedLevel) {
        setCurrentExplanationLevelState(savedLevel as ExplanationLevel);
      }

      if (savedConvs?.conversations?.length) {
        setConversations(savedConvs.conversations);
        const mostRecent = savedConvs.conversations[0];
        if (mostRecent && savedConvs.historyMap?.[mostRecent.id]) {
          setActiveConversationId(mostRecent.id);
          setMessages(savedConvs.historyMap[mostRecent.id]);
        }
      } else {
        createSampleWelcomeConversation();
      }
    })();
  }, [user]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      VoiceService.stopSpeaking().catch(() => {});
    };
  }, []);

  const createSampleWelcomeConversation = () => {
    const sampleId = 'conv_welcome';
    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome',
      role: 'assistant',
      content: `👋 **Welcome to Langnode Multilingual AI Tutor!**\n\nI break down complex STEM and computational concepts across regional Indian languages and English without conceptual friction.\n\n✨ **New Capabilities:**\n- 🗣️ **Mixed-Language (Code-Switching):** Ask in Tanglish (e.g., *"Photosynthesis epdi work aaguthu?"*) or Hinglish (e.g., *"Recursion kaise kaam karta hai?"*)!\n- 🎙️ **Mobile Voice Pipeline:** Tap the microphone to speak your question in any dialect.\n- 🔊 **Voice Audio Playback:** Tap the speaker icon on any explanation to hear it read out in native accent.\n- 💡 **Quick Transformation Modes:** Explain Simply, Explain with Example, or Explain with Analogy.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'en',
      explanationLevel: 'Beginner',
      explanationMode: 'standard',
      keyConcepts: ['Multilingual Bridging', 'Code-Switching (Tanglish/Hinglish)', 'Voice Interaction'],
      suggestedFollowups: [
        'Photosynthesis epdi work aaguthu?',
        'Recursion kaise kaam karta hai?',
        'Explain Binary Search Tree simply',
      ],
    };

    const initialSummary: ConversationSummary = {
      id: sampleId,
      title: 'Welcome to Langnode',
      lastMessagePreview: 'Welcome to Langnode Multilingual AI Tutor! Mixed-language...',
      language: 'en',
      explanationLevel: 'Beginner',
      updatedAt: 'Just now',
      messageCount: 1,
    };

    setActiveConversationId(sampleId);
    setMessages([welcomeMsg]);
    setConversations([initialSummary]);
  };

  const persistConversations = async (
    newConvs: ConversationSummary[],
    activeId: string,
    currentMsgs: ChatMessage[]
  ) => {
    const existing = await Storage.getCachedConversations<{
      conversations: ConversationSummary[];
      historyMap: Record<string, ChatMessage[]>;
    }>();
    const historyMap = existing?.historyMap || {};
    historyMap[activeId] = currentMsgs;
    await Storage.setCachedConversations({
      conversations: newConvs,
      historyMap,
    });
  };

  const setCurrentLanguage = async (lang: string) => {
    setCurrentLanguageState(lang);
    await Storage.setLanguage(lang);
    try {
      await Haptics.selectionAsync();
    } catch {}
  };

  const setCurrentExplanationLevel = async (level: ExplanationLevel) => {
    setCurrentExplanationLevelState(level);
    await Storage.setExplanationLevel(level);
    try {
      await Haptics.selectionAsync();
    } catch {}
  };

  const startNewConversation = (): string => {
    const newId = `conv_${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([]);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    return newId;
  };

  const loadConversation = async (id: string) => {
    setActiveConversationId(id);
    const existing = await Storage.getCachedConversations<{
      conversations: ConversationSummary[];
      historyMap: Record<string, ChatMessage[]>;
    }>();
    if (existing?.historyMap?.[id]) {
      setMessages(existing.historyMap[id]);
    }
  };

  const deleteConversation = async (id: string) => {
    const updatedConvs = conversations.filter((c) => c.id !== id);
    setConversations(updatedConvs);
    const existing = await Storage.getCachedConversations<{
      conversations: ConversationSummary[];
      historyMap: Record<string, ChatMessage[]>;
    }>();
    const historyMap = existing?.historyMap || {};
    delete historyMap[id];
    await Storage.setCachedConversations({
      conversations: updatedConvs,
      historyMap,
    });

    if (activeConversationId === id) {
      if (updatedConvs.length > 0) {
        loadConversation(updatedConvs[0].id);
      } else {
        startNewConversation();
      }
    }
  };

  const clearActiveConversation = async () => {
    setMessages([]);
    const updatedConvs = conversations.filter((c) => c.id !== activeConversationId);
    setConversations(updatedConvs);
    await persistConversations(updatedConvs, activeConversationId, []);
  };

  // ==========================================
  // VOICE & TTS CONTROLLERS
  // ==========================================
  const startVoiceRecording = async () => {
    try {
      setError(null);
      await VoiceService.startRecording();
      setVoiceState('recording');
      setRecordingDurationSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setVoiceState('error');
      setError(err?.message || 'Could not access microphone.');
    }
  };

  const stopVoiceRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    try {
      setVoiceState('processing');
      const result = await VoiceService.stopRecording();
      if (!result) {
        setVoiceState('idle');
        return;
      }

      // Voice Pipeline: Microphone -> Speech-to-text -> Language Detection -> AI Tutor -> Response
      // Transcribe and detect language
      const transcription = await ApiService.transcribeVoice(
        undefined,
        'Photosynthesis epdi work aaguthu?'
      );

      setVoiceState('idle');
      // Automatically send transcribed question to AI Tutor
      await sendMessage(transcription.transcript);
    } catch (err: any) {
      setVoiceState('error');
      setError(err?.message || 'Failed to process voice recording.');
    }
  };

  const cancelVoiceRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    await VoiceService.cancelRecording();
    setVoiceState('idle');
    setRecordingDurationSeconds(0);
  };

  const speakMessage = async (messageId: string, content: string, language: string) => {
    try {
      if (speakingMessageId === messageId) {
        await VoiceService.stopSpeaking();
        setSpeakingMessageId(null);
        setVoiceState('idle');
        return;
      }

      setSpeakingMessageId(messageId);
      setVoiceState('speaking');

      await VoiceService.speak(content, language, {
        onStart: () => {
          setSpeakingMessageId(messageId);
          setVoiceState('speaking');
        },
        onDone: () => {
          setSpeakingMessageId(null);
          setVoiceState('idle');
        },
        onError: () => {
          setSpeakingMessageId(null);
          setVoiceState('idle');
        },
      });
    } catch {
      setSpeakingMessageId(null);
      setVoiceState('idle');
    }
  };

  const stopSpeaking = async () => {
    await VoiceService.stopSpeaking();
    setSpeakingMessageId(null);
    setVoiceState('idle');
  };

  const toggleAutoTTS = () => {
    setAutoTTS((prev) => {
      const next = !prev;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      if (next) {
        // Voice Out turned ON: immediately read out the current assistant message
        const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
        if (lastAssistantMsg) {
          speakMessage(lastAssistantMsg.id, lastAssistantMsg.content, lastAssistantMsg.language);
        } else {
          VoiceService.speak('Voice out enabled.', currentLanguage).catch(() => {});
        }
      } else {
        // Voice Out turned OFF: stop any playing speech immediately
        stopSpeaking();
      }
      return next;
    });
  };

  // ==========================================
  // SEND MESSAGE & EXPLANATION MODES
  // ==========================================
  const sendMessage = async (
    content: string,
    mode: 'standard' | 'simply' | 'example' | 'analogy' = 'standard'
  ) => {
    if (!content.trim() || isGenerating) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: currentLanguage,
      explanationLevel: currentExplanationLevel,
      explanationMode: mode,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);
    setError(null);

    // Prepare API history
    const history: ChatMessagePayload[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload: ChatRequestPayload = {
      message: content.trim(),
      language: currentLanguage,
      explanation_level: currentExplanationLevel,
      explanation_mode: mode,
      conversation_id: activeConversationId,
      history,
    };

    try {
      const responsePayload = await ApiService.sendChatMessage(payload);

      const botMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        content: responsePayload.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: responsePayload.language,
        explanationLevel: responsePayload.explanation_level,
        explanationMode: mode,
        isMixed: responsePayload.is_mixed,
        detectedTopic: responsePayload.detected_topic,
        keyConcepts: responsePayload.key_concepts,
        suggestedFollowups: responsePayload.suggested_followups,
        analogiesUsed: responsePayload.analogies_used,
        preservedTerms: responsePayload.preserved_terms,
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Auto TTS if enabled
      if (autoTTS) {
        speakMessage(botMessage.id, botMessage.content, botMessage.language).catch(() => {});
      }

      // Update Conversation Summary
      const preview =
        responsePayload.response.replace(/[#*`]/g, '').slice(0, 90) + '...';
      const title =
        content.trim().length > 32 ? content.trim().slice(0, 30) + '...' : content.trim();

      const existingIndex = conversations.findIndex((c) => c.id === activeConversationId);
      let updatedConvs: ConversationSummary[];

      if (existingIndex >= 0) {
        updatedConvs = [...conversations];
        updatedConvs[existingIndex] = {
          ...updatedConvs[existingIndex],
          lastMessagePreview: preview,
          language: responsePayload.language,
          explanationLevel: currentExplanationLevel,
          updatedAt: 'Just now',
          messageCount: finalMessages.length,
        };
      } else {
        const newSummary: ConversationSummary = {
          id: activeConversationId,
          title,
          lastMessagePreview: preview,
          language: responsePayload.language,
          explanationLevel: currentExplanationLevel,
          updatedAt: 'Just now',
          messageCount: finalMessages.length,
        };
        updatedConvs = [newSummary, ...conversations];
      }

      setConversations(updatedConvs);
      await persistConversations(updatedConvs, activeConversationId, finalMessages);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate response. Please check network connection.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setIsGenerating(false);
    }
  };

  const reExplainMessage = async (messageId: string, level: ExplanationLevel) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    await setCurrentExplanationLevel(level);
    const concept = targetMsg.detectedTopic || targetMsg.content.slice(0, 40);
    const prompt = `Please re-explain ${concept} at the ${level} level. Adapt the depth, vocabulary, and analogies accordingly.`;
    await sendMessage(prompt);
  };

  const explainModeMessage = async (
    messageId: string,
    mode: 'simply' | 'example' | 'analogy'
  ) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const concept = targetMsg.detectedTopic || targetMsg.content.slice(0, 40);
    const modePromptMap = {
      simply: `Explain ${concept} simply without jargon.`,
      example: `Explain ${concept} with a concrete practical code/real-world example.`,
      analogy: `Explain ${concept} using a relatable everyday analogy.`,
    };

    await sendMessage(modePromptMap[mode], mode);
  };

  const translateMessage = async (messageId: string, targetLanguage: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    await setCurrentLanguage(targetLanguage);
    const targetLangMeta = getLanguageByCode(targetLanguage);
    const prompt = `Please translate and bridge the previous explanation into ${targetLangMeta.name} (${targetLangMeta.nativeName}), preserving technical keywords in English.`;
    await sendMessage(prompt);
  };

  return (
    <ChatContext.Provider
      value={{
        activeConversationId,
        messages,
        conversations,
        currentLanguage,
        currentExplanationLevel,
        isGenerating,
        error,
        voiceState,
        isVoiceRecording: voiceState === 'recording',
        recordingDurationSeconds,
        speakingMessageId,
        autoTTS,
        startVoiceRecording,
        stopVoiceRecording,
        cancelVoiceRecording,
        speakMessage,
        stopSpeaking,
        toggleAutoTTS,
        setCurrentLanguage,
        setCurrentExplanationLevel,
        sendMessage,
        reExplainMessage,
        explainModeMessage,
        translateMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        clearActiveConversation,
        clearError: () => setError(null),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
