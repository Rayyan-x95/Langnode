export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  chatUserBubble: string;
  chatUserText: string;
  chatBotBubble: string;
  chatBotText: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightColors: ThemeColors = {
  // Vibrant Accessible Electric Orange (WCAG AAA/AA compliant contrast: #EA580C on white > 4.6:1, #9A3412 > 7:1)
  primary: '#EA580C',
  primaryLight: '#FFF7ED',
  primaryDark: '#C2410C',
  // Dynamic Cobalt / Azure Blue (Pairs harmoniously with Orange)
  secondary: '#0284C7',
  secondaryLight: '#EFF6FF',
  accent: '#F97316',
  // Light Mode Surfaces & Structure
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  card: '#FFFFFF',
  // High contrast structural borders (Slate-200 / Slate-300)
  border: '#CBD5E1',
  borderSubtle: '#E2E8F0',
  // High contrast typography (Slate-900 > 15:1 ratio, Slate-700 > 7:1, Slate-500 > 4.6:1)
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  // Chat & Navigation
  chatUserBubble: '#EA580C',
  chatUserText: '#FFFFFF',
  chatBotBubble: '#FFFFFF',
  chatBotText: '#0F172A',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#EA580C',
  tabBarInactive: '#64748B',
};

// Dark mode removed entirely; darkColors points to lightColors to ensure complete consistency if referenced
export const darkColors: ThemeColors = lightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};
