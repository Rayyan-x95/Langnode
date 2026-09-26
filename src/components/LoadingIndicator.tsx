import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig, ExplanationLevel } from '@/constants/explanationLevels';

interface LoadingIndicatorProps {
  language?: string;
  explanationLevel?: ExplanationLevel;
  customMessage?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  language = 'en',
  explanationLevel = 'Beginner',
  customMessage,
}) => {
  const { colors } = useTheme();
  const lang = getLanguageByCode(language);
  const levelConfig = getExplanationLevelConfig(explanationLevel);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.primary + '20',
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[styles.mainText, { color: colors.text }]}>
            {customMessage ||
              `AI Tutor is synthesizing in ${lang.nativeName} (${lang.name})...`}
          </Text>
          <Animated.View style={{ opacity: pulseAnim }}>
            <Text style={[styles.subText, { color: colors.primary }]}>
              {levelConfig.title} Level • {levelConfig.subtitle}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxWidth: '90%',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  subText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
