import React, { createContext, useContext, useEffect } from 'react';
import { lightColors, ThemeColors } from '@/constants/theme';
import { Storage } from '@/services/storage';

export type ThemeMode = 'light';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode?: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  themeMode: 'light',
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Ensure storage records light mode as the default and only mode
    Storage.setThemeMode('light');
  }, []);

  const setThemeMode = async (_mode?: string) => {
    // Strictly maintain light mode
    await Storage.setThemeMode('light');
  };

  return (
    <ThemeContext.Provider
      value={{
        colors: lightColors,
        isDark: false,
        themeMode: 'light',
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

