import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import ChatScreen from '../(tabs)/chat';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadConversation } = useChat();

  useEffect(() => {
    if (id) {
      loadConversation(id);
    }
  }, [id]);

  return <ChatScreen />;
}
