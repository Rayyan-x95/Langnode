import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import {
  ExplanationLevel,
  EXPLANATION_LEVELS,
  ExplanationLevelConfig,
} from '@/constants/explanationLevels';

interface ExplanationSelectorProps {
  visible: boolean;
  selectedLevel: ExplanationLevel;
  onSelect: (level: ExplanationLevel) => void;
  onClose: () => void;
}

export const ExplanationSelector: React.FC<ExplanationSelectorProps> = ({
  visible,
  selectedLevel,
  onSelect,
  onClose,
}) => {
  const { colors } = useTheme();

  const handleSelect = (level: ExplanationLevel) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onSelect(level);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Explanation Depth
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Tune the level of conceptual abstraction and mathematical rigor
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {EXPLANATION_LEVELS.map((lvl: ExplanationLevelConfig) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: isSelected
                        ? lvl.badgeColor + '15'
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? lvl.badgeColor : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(lvl.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: lvl.badgeColor + '25' },
                    ]}
                  >
                    <Ionicons
                      name={lvl.icon as any}
                      size={20}
                      color={lvl.badgeColor}
                    />
                  </View>

                  <View style={styles.info}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.levelTitle,
                          {
                            color: isSelected ? lvl.badgeColor : colors.text,
                          },
                        ]}
                      >
                        {lvl.title}
                      </Text>
                      <Text
                        style={[styles.subtitleTag, { color: colors.textMuted }]}
                      >
                        • {lvl.subtitle}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.description,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {lvl.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: isSelected
                          ? lvl.badgeColor
                          : 'transparent',
                        borderColor: isSelected
                          ? lvl.badgeColor
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  indicator: {
    width: 44,
    height: 4,
    backgroundColor: '#94A3B860',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    maxWidth: 280,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitleTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
