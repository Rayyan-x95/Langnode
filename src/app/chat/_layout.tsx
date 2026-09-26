import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function ChatLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
