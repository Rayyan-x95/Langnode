import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderTopColor: colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          ...(Platform.OS === 'web'
            ? {
                maxWidth: 720,
                width: '92%',
                alignSelf: 'center' as any,
                left: 0,
                right: 0,
                bottom: 16,
                borderRadius: 28,
                borderWidth: 1.5,
                borderColor: colors.border,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 12,
                position: 'absolute' as any,
                marginHorizontal: 'auto' as any,
                paddingHorizontal: 12,
              }
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
      <Tabs.Screen
        name="career"
        options={{
          title: 'Careers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
          },
        }}
      />
    </Tabs>
  );
}
