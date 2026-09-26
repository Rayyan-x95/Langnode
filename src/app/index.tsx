import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SplashScreen() {
  const { isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing pulse for rings
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Background Ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Central Logo Symbol */}
        <View style={[styles.logoCircle, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Ionicons name="school" size={44} color="#FFFFFF" />
        </View>

        <Text style={[styles.brandName, { color: colors.text }]}>
          Lang<Text style={{ color: colors.primary }}>node</Text>
        </Text>

        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Adaptive AI Learning Across Indian Languages
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.langPillsRow}>
          {['English', 'தமிழ்', 'हिन्दी', 'తెలుగు', 'മലയാളം', 'ಕನ್ನಡ'].map(
            (l, idx) => (
              <Text key={idx} style={[styles.langDotText, { color: colors.textMuted }]}>
                {l}
              </Text>
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    opacity: 0.25,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  langPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 320,
  },
  langDotText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
