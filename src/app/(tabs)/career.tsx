import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { CareerService, CareerRoleSummary, SkillCategoryInfo } from '@/services/careers';
import { AppHeader, HeaderButton } from '@/components/AppHeader';

export default function CareerHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [roles, setRoles] = useState<CareerRoleSummary[]>([]);
  const [categories, setCategories] = useState<SkillCategoryInfo[]>([]);
  const [availableRoleCategories, setAvailableRoleCategories] = useState<string[]>([]);
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('All');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, catsRes] = await Promise.all([
        CareerService.listRoles(searchQuery, selectedRoleCategory),
        CareerService.listCategories(),
      ]);
      setRoles(rolesRes.roles);
      setAvailableRoleCategories(['All', ...rolesRes.categories]);
      setCategories(catsRes);
    } catch (err) {
      console.warn('[CareerHomeScreen] Error fetching career data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedRoleCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRefreshing(true);
    await loadData();
  };

  const handleSelectRole = (role: CareerRoleSummary) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push({
      pathname: '/career/[id]',
      params: { id: role.id },
    } as any);
  };

  const handleSelectRoleCategory = (cat: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedRoleCategory(cat);
  };

  const handleSkillCategoryPress = (catName: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (selectedSkillCategory === catName) {
      setSelectedSkillCategory(null);
      setSearchQuery('');
    } else {
      setSelectedSkillCategory(catName);
      setSearchQuery(catName);
    }
  };

  const clearFilters = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSearchQuery('');
    setSelectedRoleCategory('All');
    setSelectedSkillCategory(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Standard AppHeader */}
      <AppHeader
        title="Career Pathways"
        subtitle="Competency Explorer & Skill Roadmaps"
        badge={{ text: '7 Tracks', icon: 'compass-outline' }}
        icon="compass"
        actions={
          <HeaderButton
            icon="speedometer-outline"
            label="Dashboard"
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push('/career/dashboard' as any);
            }}
          />
        }
      />

      {/* Main Content */}
      <FlatList
        data={roles}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search roles or skills (e.g. React, ML, Cloud)..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (selectedSkillCategory && text !== selectedSkillCategory) {
                    setSelectedSkillCategory(null);
                  }
                }}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedSkillCategory(null);
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Role Domain Horizontal Filter Chips */}
            <View style={styles.domainFiltersRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.domainFiltersContainer}
              >
                {availableRoleCategories.map((cat) => {
                  const isSelected = selectedRoleCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.domainChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSelectRoleCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.domainChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Skill Categories Section (9 Canonical Categories) */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="grid-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Skill Categories</Text>
                <Text style={[styles.sectionBadge, { color: colors.textSecondary }]}>
                  {categories.length} core areas
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.skillCategoriesScroll}
              >
                {categories.map((cat) => {
                  const isCatSelected = selectedSkillCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isCatSelected
                            ? colors.primaryLight
                            : colors.surfaceSubtle,
                          borderColor: isCatSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSkillCategoryPress(cat.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'bulb-outline'}
                        size={14}
                        color={isCatSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          {
                            color: isCatSelected ? colors.primary : colors.text,
                            fontWeight: isCatSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      <View
                        style={[
                          styles.categoryCountBadge,
                          {
                            backgroundColor: isCatSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryCountText,
                            { color: isCatSelected ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {cat.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Career Selection Section Header */}
            <View style={styles.rolesSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Available Career Paths ({roles.length})
              </Text>
              <Text style={[styles.rolesSub, { color: colors.textSecondary }]}>
                Select a career to explore the required competency landscape
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              },
            ]}
            onPress={() => handleSelectRole(item)}
            activeOpacity={0.85}
          >
            {/* Role Header */}
            <View style={styles.roleCardTop}>
              <View
                style={[
                  styles.roleIconWrapper,
                  {
                    backgroundColor: item.badge_color + '18',
                    borderColor: item.badge_color + '45',
                  },
                ]}
              >
                <Ionicons
                  name={(item.icon as any) || 'briefcase-outline'}
                  size={24}
                  color={item.badge_color}
                />
              </View>

              <View style={styles.roleCardTitleBox}>
                <View style={styles.roleNameRow}>
                  <Text style={[styles.roleName, { color: colors.text }]}>{item.name}</Text>
                </View>
                <View style={styles.roleBadgesRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryBadgeText, { color: colors.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.growthBadge,
                      {
                        backgroundColor: item.badge_color + '12',
                        borderColor: item.badge_color + '40',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons name="trending-up" size={11} color={item.badge_color} />
                    <Text style={[styles.growthBadgeText, { color: item.badge_color }]}>
                      {item.growth_outlook}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.chevronCircle,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.roleDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Footer Stats */}
            <View
              style={[
                styles.roleCardFooter,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.surfaceSubtle,
                },
              ]}
            >
              <View style={styles.footerStatItem}>
                <Ionicons name="layers" size={14} color={colors.primary} />
                <Text style={[styles.footerStatText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '800' }}>{item.total_skills}</Text> Skills
                </Text>
              </View>

              <View style={styles.footerStatItem}>
                <Ionicons name="star" size={14} color="#D97706" />
                <Text style={[styles.footerStatText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '800' }}>{item.essential_count}</Text> Essential
                </Text>
              </View>

              <View style={styles.footerStatItem}>
                <Ionicons name="cash" size={14} color="#059669" />
                <Text style={[styles.footerStatText, { color: colors.text, fontWeight: '700' }]}>
                  {item.avg_salary}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Loading competency landscapes...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={54} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Careers Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No career matching &quot;{searchQuery}&quot; in {selectedRoleCategory}.
              </Text>
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                onPress={clearFilters}
              >
                <Text style={styles.resetBtnText}>Clear Search &amp; Filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  myDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  domainFiltersRow: {
    marginBottom: 16,
  },
  domainFiltersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  domainChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  domainChipText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  listHeader: {
    marginBottom: 8,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBadge: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  skillCategoriesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    marginRight: 6,
  },
  categoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rolesSectionHeader: {
    marginBottom: 12,
  },
  rolesSub: {
    fontSize: 12,
    marginTop: 2,
  },
  roleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleCardTitleBox: {
    flex: 1,
  },
  roleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  growthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  roleCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerStatText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
