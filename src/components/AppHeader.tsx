import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export interface AppHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  badge?: {
    text: string;
    color?: string;
    bgColor?: string;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconBgColor,
  iconColor = '#FFFFFF',
  badge,
  actions,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.headerWrapper, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.headerInner}>
        {/* Left: Brand / Section Icon & Titles */}
        <View style={styles.leftContainer}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: iconBgColor || colors.primary,
                shadowColor: iconBgColor || colors.primary,
              },
            ]}
          >
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <View style={styles.titlesBox}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
              {badge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: badge.bgColor || colors.primaryLight,
                      borderColor: badge.color ? badge.color + '40' : colors.border,
                    },
                  ]}
                >
                  {badge.icon && (
                    <Ionicons name={badge.icon} size={10} color={badge.color || colors.primary} />
                  )}
                  <Text style={[styles.badgeText, { color: badge.color || colors.primary }]}>
                    {badge.text}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Section Actions */}
        {actions && <View style={styles.rightContainer}>{actions}</View>}
      </View>
    </View>
  );
};

export const HeaderPill: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  labelColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  onPress: () => void;
}> = ({
  icon,
  iconColor,
  label,
  labelColor,
  backgroundColor,
  borderColor,
  onPress,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: backgroundColor || colors.primaryLight,
          borderColor: borderColor || colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={13} color={iconColor || colors.primary} />
      <Text style={[styles.pillText, { color: labelColor || colors.text }]}>{label}</Text>
      <Ionicons name="chevron-down" size={11} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

export const HeaderButton: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
}> = ({ icon, label, variant = 'primary', onPress }) => {
  const { colors } = useTheme();

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const bgColor = isPrimary
    ? colors.primary
    : isSecondary
    ? colors.secondary
    : colors.surface;
  const textColor = isPrimary || isSecondary ? '#FFFFFF' : colors.text;
  const borderColor = isPrimary
    ? colors.primary
    : isSecondary
    ? colors.secondary
    : colors.border;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Ionicons name={icon} size={14} color={textColor} style={{ marginRight: 5 }} />}
      <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const HeaderAvatar: React.FC<{
  name?: string;
  onPress: () => void;
}> = ({ name, onPress }) => {
  const { colors } = useTheme();
  const initial = name ? name[0].toUpperCase() : 'L';

  return (
    <TouchableOpacity
      style={[styles.avatar, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.avatarText}>{initial}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  titlesBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
