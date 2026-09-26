/// <reference types="nativewind/types" />

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
}

declare module 'expo-status-bar' {
  import React from 'react';
  export interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    animated?: boolean;
    hidden?: boolean;
    backgroundColor?: string;
    translucent?: boolean;
  }
  export const StatusBar: React.FC<StatusBarProps>;
}

declare module 'expo-web-browser' {
  export function openBrowserAsync(url: string, options?: any): Promise<any>;
}

declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}
