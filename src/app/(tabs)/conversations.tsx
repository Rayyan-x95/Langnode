import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { ConversationCard } from '@/components/ConversationCard';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

import { AppHeader, HeaderButton } from '@/components/AppHeader';

export default function ConversationsScreen() {
  const router = useRouter();
  const {
    conversations,
    loadConversation,
    deleteConversation,
    startNewConversation,
    activeConversationId,
  } = useChat();
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessagePreview.toLowerCase().includes(search.toLowerCase());
    const matchesLang =
      selectedLangFilter === 'all' || c.language === selectedLangFilter;
    return matchesSearch && matchesLang;
  });

  const handleSelectConv = (id: string) => {
    loadConversation(id);
    router.push('/(tabs)/chat');
  };

  const handleNew = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    startNewConversation();
    router.push('/(tabs)/chat');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Standard AppHeader */}
      <AppHeader
        title="Conversation History"
        subtitle={`${conversations.length} saved learning ${conversations.length === 1 ? 'session' : 'sessions'}`}
        icon="time-outline"
        actions={
          <HeaderButton
            icon="add"
            label="New Chat"
            onPress={handleNew}
          />
        }
      />

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            isActive={item.id === activeConversationId}
            onPress={() => handleSelectConv(item.id)}
            onDelete={() => deleteConversation(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Search Input */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search concepts or sessions..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Language Filter Chips */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedLangFilter === 'all'
                        ? colors.primary
                        : colors.surfaceSubtle,
                    borderColor:
                      selectedLangFilter === 'all' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedLangFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedLangFilter === 'all' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  All Languages
                </Text>
              </TouchableOpacity>

              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLangFilter === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedLangFilter(lang.code)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No conversations found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {search
                ? `No sessions match "${search}"`
                : 'Start an AI Tutor chat to see your learning history here.'}
            </Text>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={handleNew}
            >
              <Text style={styles.startBtnText}>Start New Session</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 20,
  },
  startBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
