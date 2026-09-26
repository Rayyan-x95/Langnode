import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { SUPPORTED_LANGUAGES, Language } from '@/constants/languages';

interface LanguageSelectorProps {
  visible: boolean;
  selectedLanguage: string;
  onSelect: (languageCode: string) => void;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  selectedLanguage,
  onSelect,
  onClose,
}) => {
  const { colors } = useTheme();

  const handleSelect = (code: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onSelect(code);
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
                Select Native Language
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Instructional content adapts to your cultural and linguistic comfort
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {SUPPORTED_LANGUAGES.map((lang: Language) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryLight
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langInfo}>
                    <Text
                      style={[
                        styles.nativeName,
                        {
                          color: isSelected ? colors.primary : colors.text,
                        },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.englishName,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {lang.name} • {lang.script} script
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : 'transparent',
                        borderColor: isSelected
                          ? colors.primary
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
          </ScrollView>
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
    maxHeight: '75%',
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
    marginBottom: 8,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  langInfo: {
    flex: 1,
  },
  nativeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  englishName: {
    fontSize: 12,
    fontWeight: '500',
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
