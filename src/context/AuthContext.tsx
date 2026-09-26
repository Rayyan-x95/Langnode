import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '@/services/storage';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { DEFAULT_LANGUAGE } from '@/constants/languages';
import { DEFAULT_EXPLANATION_LEVEL, ExplanationLevel } from '@/constants/explanationLevels';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  preferredExplanationLevel: ExplanationLevel;
  streakDays?: number;
  conceptsMastered?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    name: string,
    email: string,
    password: string,
    language?: string,
    level?: ExplanationLevel
  ) => Promise<{ error?: string }>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (language?: string, level?: ExplanationLevel) => Promise<void>;
  updatePreferences: (language?: string, level?: ExplanationLevel) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isOnboarded: false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInDemo: async () => {},
  signOut: async () => {},
  completeOnboarding: async () => {},
  updatePreferences: async () => {},
});

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest_learner_01',
  name: 'Langnode Learner',
  email: 'learner@langnode.ai',
  preferredLanguage: DEFAULT_LANGUAGE.code,
  preferredExplanationLevel: DEFAULT_EXPLANATION_LEVEL,
  streakDays: 1,
  conceptsMastered: 0,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_GUEST_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(true);

  const loadInitialState = async () => {
    try {
      const [, savedUser, savedLang, savedLevel] = await Promise.all([
        Storage.isOnboardingCompleted(),
        Storage.getUser<UserProfile>(),
        Storage.getLanguage(),
        Storage.getExplanationLevel(),
      ]);

      setIsOnboarded(true);

      if (savedUser) {
        setUser({
          ...savedUser,
          preferredLanguage: savedLang || savedUser.preferredLanguage || DEFAULT_LANGUAGE.code,
          preferredExplanationLevel: (savedLevel as ExplanationLevel) || savedUser.preferredExplanationLevel || DEFAULT_EXPLANATION_LEVEL,
        });
      } else if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Learner',
            email: session.user.email || '',
            preferredLanguage: savedLang || DEFAULT_LANGUAGE.code,
            preferredExplanationLevel: (savedLevel as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL,
            streakDays: 3,
            conceptsMastered: 12,
          };
          setUser(profile);
          await Storage.setUser(profile);
        } else {
          setUser({
            ...DEFAULT_GUEST_USER,
            preferredLanguage: savedLang || DEFAULT_LANGUAGE.code,
            preferredExplanationLevel: (savedLevel as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL,
          });
        }
      } else {
        setUser({
          ...DEFAULT_GUEST_USER,
          preferredLanguage: savedLang || DEFAULT_LANGUAGE.code,
          preferredExplanationLevel: (savedLevel as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL,
        });
      }
    } catch (err) {
      console.warn('[AuthProvider] Initialization error:', err);
      setUser(DEFAULT_GUEST_USER);
      setIsOnboarded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialState();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }
        if (data.session?.user) {
          const profile: UserProfile = {
            id: data.session.user.id,
            name: data.session.user.user_metadata?.name || email.split('@')[0],
            email: email,
            preferredLanguage: (await Storage.getLanguage()) || DEFAULT_LANGUAGE.code,
            preferredExplanationLevel: ((await Storage.getExplanationLevel()) as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL,
            streakDays: 3,
            conceptsMastered: 12,
          };
          setUser(profile);
          await Storage.setUser(profile);
          setIsLoading(false);
          return {};
        }
      }

      // Offline / Demo authentication fallback
      const profile: UserProfile = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        preferredLanguage: (await Storage.getLanguage()) || DEFAULT_LANGUAGE.code,
        preferredExplanationLevel: ((await Storage.getExplanationLevel()) as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL,
        streakDays: 1,
        conceptsMastered: 0,
      };
      setUser(profile);
      await Storage.setUser(profile);
      await Storage.setAuthToken(`mock_token_${Date.now()}`);
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err?.message || 'Failed to sign in' };
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    language?: string,
    level?: ExplanationLevel
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const chosenLang = language || (await Storage.getLanguage()) || DEFAULT_LANGUAGE.code;
      const chosenLevel = level || ((await Storage.getExplanationLevel()) as ExplanationLevel) || DEFAULT_EXPLANATION_LEVEL;

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, preferredLanguage: chosenLang, preferredExplanationLevel: chosenLevel },
          },
        });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            name,
            email,
            preferredLanguage: chosenLang,
            preferredExplanationLevel: chosenLevel,
            streakDays: 1,
            conceptsMastered: 0,
          };
          setUser(profile);
          await Storage.setUser(profile);
          await Storage.setLanguage(chosenLang);
          await Storage.setExplanationLevel(chosenLevel);
          setIsLoading(false);
          return {};
        }
      }

      // Offline / Local registration
      const profile: UserProfile = {
        id: `user_${Date.now()}`,
        name,
        email,
        preferredLanguage: chosenLang,
        preferredExplanationLevel: chosenLevel,
        streakDays: 1,
        conceptsMastered: 0,
      };
      setUser(profile);
      await Storage.setUser(profile);
      await Storage.setLanguage(chosenLang);
      await Storage.setExplanationLevel(chosenLevel);
      await Storage.setAuthToken(`mock_token_${Date.now()}`);
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err?.message || 'Failed to sign up' };
    }
  };

  const signInDemo = async () => {
    const demoUser: UserProfile = {
      id: 'demo_learner_01',
      name: 'Priya Sharma',
      email: 'priya.learner@langnode.ai',
      preferredLanguage: 'ta',
      preferredExplanationLevel: 'Beginner',
      streakDays: 7,
      conceptsMastered: 24,
    };
    setUser(demoUser);
    await Storage.setUser(demoUser);
    await Storage.setLanguage(demoUser.preferredLanguage);
    await Storage.setExplanationLevel(demoUser.preferredExplanationLevel);
    await Storage.setAuthToken('demo_token');
    await Storage.setOnboardingCompleted(true);
    setIsOnboarded(true);
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      await Storage.removeAuthToken();
      await Storage.removeUser();
      setUser(DEFAULT_GUEST_USER);
      setIsOnboarded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (language?: string, level?: ExplanationLevel) => {
    if (language) {
      await Storage.setLanguage(language);
    }
    if (level) {
      await Storage.setExplanationLevel(level);
    }
    await Storage.setOnboardingCompleted(true);
    setIsOnboarded(true);
  };

  const updatePreferences = async (language?: string, level?: ExplanationLevel) => {
    if (language) {
      await Storage.setLanguage(language);
    }
    if (level) {
      await Storage.setExplanationLevel(level);
    }
    if (user) {
      const updated: UserProfile = {
        ...user,
        preferredLanguage: language || user.preferredLanguage,
        preferredExplanationLevel: level || user.preferredExplanationLevel,
      };
      setUser(updated);
      await Storage.setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnboarded,
        signIn,
        signUp,
        signInDemo,
        signOut,
        completeOnboarding,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
