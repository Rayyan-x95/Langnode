import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'langnode_auth_token',
  USER_DATA: 'langnode_user_data',
  LANGUAGE: 'langnode_selected_language',
  EXPLANATION_LEVEL: 'langnode_explanation_level',
  ONBOARDING_DONE: 'langnode_onboarding_completed',
  THEME_MODE: 'langnode_theme_mode',
  API_BASE_URL: 'langnode_api_base_url',
  CONVERSATIONS_CACHE: 'langnode_conversations_cache',
  LAST_CAREER_ROLE: 'langnode_last_career_role',
};

// Memory fallback for environments where SecureStore may not be available
const memoryStorage: Record<string, string> = {};

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      memoryStorage[key] = value;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[SecureStore] Error writing key ${key}:`, error);
    memoryStorage[key] = value;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key) || memoryStorage[key] || null;
      }
      return memoryStorage[key] || null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Error reading key ${key}:`, error);
    return memoryStorage[key] || null;
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      delete memoryStorage[key];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Error deleting key ${key}:`, error);
    delete memoryStorage[key];
  }
}

export const Storage = {
  // Auth
  async getAuthToken(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },
  async setAuthToken(token: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  },
  async removeAuthToken(): Promise<void> {
    return deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },

  // User
  async getUser<T>(): Promise<T | null> {
    const raw = await getItemAsync(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setUser<T>(user: T): Promise<void> {
    return setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    return deleteItemAsync(STORAGE_KEYS.USER_DATA);
  },

  // Preferences
  async getLanguage(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.LANGUAGE);
  },
  async setLanguage(langCode: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.LANGUAGE, langCode);
  },

  async getExplanationLevel(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.EXPLANATION_LEVEL);
  },
  async setExplanationLevel(level: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.EXPLANATION_LEVEL, level);
  },

  // Onboarding
  async isOnboardingCompleted(): Promise<boolean> {
    const val = await getItemAsync(STORAGE_KEYS.ONBOARDING_DONE);
    return val === 'true';
  },
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    return setItemAsync(STORAGE_KEYS.ONBOARDING_DONE, completed ? 'true' : 'false');
  },

  // Theme - Light mode permanently enforced
  async getThemeMode(): Promise<'light'> {
    return 'light';
  },
  async setThemeMode(mode?: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.THEME_MODE, 'light');
  },

  // API URL
  async getApiBaseUrl(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.API_BASE_URL);
  },
  async setApiBaseUrl(url: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.API_BASE_URL, url);
  },

  // Career Role Preference
  async getLastCareerRoleId(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.LAST_CAREER_ROLE);
  },
  async setLastCareerRoleId(roleId: string): Promise<void> {
    return setItemAsync(STORAGE_KEYS.LAST_CAREER_ROLE, roleId);
  },

  // Cache
  async getCachedConversations<T>(): Promise<T | null> {
    const raw = await getItemAsync(STORAGE_KEYS.CONVERSATIONS_CACHE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setCachedConversations<T>(data: T): Promise<void> {
    return setItemAsync(STORAGE_KEYS.CONVERSATIONS_CACHE, JSON.stringify(data));
  },

  // Generic key-value helpers
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await getItemAsync(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    return setItemAsync(key, JSON.stringify(value));
  },
};
