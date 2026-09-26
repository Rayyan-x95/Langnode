import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Custom storage adapter for Supabase using Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(typeof window !== 'undefined' ? window.localStorage?.getItem(key) ?? null : null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(key, value);
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem(key);
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Default or configurable Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-anon-key';

export const isSupabaseConfigured = () => {
  return (
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
    process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co'
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
