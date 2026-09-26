import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

export interface VoiceRecordingResult {
  uri: string;
  durationMs: number;
}

export interface SpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

// BCP-47 language tag mappings for supported regional languages
export const TTS_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
};

export class VoiceService {
  private static recording: Audio.Recording | null = null;
  private static isRecordingActive = false;
  private static recordingStartTime = 0;

  /**
   * Check and request microphone permissions
   */
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const response = await Audio.requestPermissionsAsync();
      return response.granted;
    } catch (error) {
      console.warn('[VoiceService] Permission request error:', error);
      return false;
    }
  }

  static async getMicrophonePermission(): Promise<boolean> {
    try {
      const response = await Audio.getPermissionsAsync();
      return response.granted;
    } catch {
      return false;
    }
  }

  /**
   * Start recording audio using expo-av
   */
  static async startRecording(
    onStatusUpdate?: (status: Audio.RecordingStatus) => void
  ): Promise<boolean> {
    try {
      // 1. Permission check
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error('Microphone permission not granted');
      }

      // 2. Stop any existing TTS or active recording
      await this.stopSpeaking();
      if (this.recording) {
        await this.cancelRecording();
      }

      // 3. Audio Mode Setup for iOS/Android
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 4. Create and prepare recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onStatusUpdate,
        100 // update interval ms
      );

      this.recording = recording;
      this.isRecordingActive = true;
      this.recordingStartTime = Date.now();

      // Trigger tactile haptic confirmation
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch (error) {
      this.isRecordingActive = false;
      this.recording = null;
      console.error('[VoiceService] Failed to start recording:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }

  /**
   * Stop recording and retrieve audio URI and duration
   */
  static async stopRecording(): Promise<VoiceRecordingResult | null> {
    if (!this.recording || !this.isRecordingActive) {
      return null;
    }

    try {
      this.isRecordingActive = false;
      const durationMs = Date.now() - this.recordingStartTime;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (!uri) {
        return null;
      }

      return {
        uri,
        durationMs,
      };
    } catch (error) {
      this.recording = null;
      this.isRecordingActive = false;
      console.error('[VoiceService] Failed to stop recording:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }

  /**
   * Cancel and discard current recording
   */
  static async cancelRecording(): Promise<void> {
    if (!this.recording) return;

    try {
      this.isRecordingActive = false;
      await this.recording.stopAndUnloadAsync();
      this.recording = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      this.recording = null;
      this.isRecordingActive = false;
      console.warn('[VoiceService] Cancel recording error:', error);
    }
  }

  /**
   * Check if currently recording
   */
  static isRecording(): boolean {
    return this.isRecordingActive;
  }

  private static activeKeepAliveInterval: any = null;
  private static activeUtterance: any = null;

  private static clearWebKeepAlive(): void {
    if (this.activeKeepAliveInterval) {
      clearInterval(this.activeKeepAliveInterval);
      this.activeKeepAliveInterval = null;
    }
  }

  /**
   * Clean text for natural speech synthesis
   */
  static cleanTextForSpeech(text: string): string {
    return text
      // Replace code blocks with concise spoken description
      .replace(/```[\s\S]*?```/g, ' Code example omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown symbols
      .replace(/[*#_~>|]/g, '')
      // Strip emojis which cause TTS engines in browsers to pause or error
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
      // Clean bullet points and list formatting to natural pauses
      .replace(/\n\s*[-*•]\s*/g, '. ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Text-to-Speech playback with dual-engine support:
   * Direct Web Speech API for browsers (with Chrome unpause & voice fallback)
   * and expo-speech for native iOS/Android.
   */
  static async speak(
    text: string,
    languageCode = 'en',
    options?: SpeechOptions
  ): Promise<void> {
    try {
      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText) return;

      // ==========================================
      // WEB PLATFORM SPEECH SYNTHESIS ENGINE
      // ==========================================
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synth = window.speechSynthesis;

        // Clean any active audio
        this.clearWebKeepAlive();
        synth.cancel();
        synth.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.pitch = options?.pitch ?? 1.0;
        utterance.rate = options?.rate ?? 1.0;

        // Intelligent Voice Selection
        const ttsLang = TTS_LANGUAGE_MAP[languageCode] || 'en-US';
        const voices = synth.getVoices();

        if (voices.length > 0) {
          const langLower = ttsLang.toLowerCase().replace('_', '-');
          const langPrefix = langLower.split('-')[0];

          // 1. Exact language tag match
          let matchedVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === langLower);

          // 2. Language prefix match (e.g. 'ta', 'hi', 'en')
          if (!matchedVoice) {
            matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
          }

          // 3. Indian accent English if Indian regional language voice is absent
          if (!matchedVoice && langPrefix !== 'en') {
            matchedVoice = voices.find((v) => v.lang.toLowerCase().includes('in'));
          }

          // 4. Default or first voice
          if (!matchedVoice) {
            matchedVoice =
              voices.find((v) => v.default) ||
              voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
              voices[0];
          }

          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
          } else {
            utterance.lang = ttsLang;
          }
        } else {
          utterance.lang = ttsLang;
        }

        // Store reference to prevent V8 garbage collection mid-speech
        this.activeUtterance = utterance;
        (window as any).__langnodeUtterance = utterance;

        let hasFinished = false;
        const finish = (err?: Error) => {
          if (hasFinished) return;
          hasFinished = true;
          this.clearWebKeepAlive();
          this.activeUtterance = null;
          if (err) {
            options?.onError?.(err);
          } else {
            options?.onDone?.();
          }
        };

        utterance.onstart = () => {
          options?.onStart?.();
          // Keepalive interval for Chrome's 15-second speech cutoff bug
          this.activeKeepAliveInterval = setInterval(() => {
            if (synth.speaking && !synth.paused) {
              synth.pause();
              synth.resume();
            }
          }, 8000);
        };

        utterance.onend = () => {
          finish();
        };

        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
            finish();
          } else {
            console.warn('[VoiceService] Web TTS error:', e.error);
            finish(new Error(e.error || 'Speech error'));
          }
        };

        synth.speak(utterance);
        // Force unpause to ensure immediate playback in Chrome
        synth.resume();
        return;
      }

      // ==========================================
      // NATIVE PLATFORM (iOS / Android) EXPO-SPEECH
      // ==========================================
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      const ttsLang = TTS_LANGUAGE_MAP[languageCode] || 'en-US';

      Speech.speak(cleanText, {
        language: ttsLang,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? (Platform.OS === 'ios' ? 0.95 : 1.0),
        onStart: options?.onStart,
        onDone: options?.onDone,
        onError: (err) => {
          console.warn('[VoiceService] TTS speech error:', err);
          options?.onError?.(new Error(err.toString()));
        },
      });
    } catch (error) {
      console.error('[VoiceService] Speech execution error:', error);
      options?.onError?.(error as Error);
    }
  }

  /**
   * Stop currently active speech playback
   */
  static async stopSpeaking(): Promise<void> {
    try {
      this.clearWebKeepAlive();
      this.activeUtterance = null;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        return;
      }

      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch (error) {
      console.warn('[VoiceService] Stop speaking error:', error);
    }
  }

  /**
   * Query if speech is active
   */
  static async isSpeaking(): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        return window.speechSynthesis.speaking;
      }
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}
