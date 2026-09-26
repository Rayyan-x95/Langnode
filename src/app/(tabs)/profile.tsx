import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { ApiService } from '@/services/api';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ExplanationSelector } from '@/components/ExplanationSelector';
import { getLanguageByCode } from '@/constants/languages';
import { getExplanationLevelConfig } from '@/constants/explanationLevels';
import { AppHeader, HeaderPill } from '@/components/AppHeader';

export default function ProfileScreen() {
  const { user, signOut, updatePreferences } = useAuth();
  const { currentLanguage, currentExplanationLevel, setCurrentLanguage, setCurrentExplanationLevel } = useChat();
  const { colors } = useTheme();

  const [apiUrl, setApiUrl] = useState('');
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const lang = getLanguageByCode(currentLanguage);
  const levelConfig = getExplanationLevelConfig(currentExplanationLevel);

  useEffect(() => {
    ApiService.getBaseUrl().then(setApiUrl);
  }, []);

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiStatus(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await ApiService.setBaseUrl(apiUrl.trim());
      const res = await ApiService.checkHealth();
      if (res.connected) {
        setApiStatus(`Connected (${res.status})`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setApiStatus('Offline / Fallback Mode');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      setApiStatus('Connection failed');
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Reset Session', 'Are you sure you want to reset your learner profile to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Session',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {}
          await signOut();
          Alert.alert('Success', 'Guest profile session has been reset.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Standard AppHeader */}
      <AppHeader
        title="Profile & Settings"
        subtitle="Personalize your multilingual learning setup"
        icon="person-circle-outline"
        actions={
          <HeaderPill
            icon="language-outline"
            label={lang.name}
            onPress={() => setShowLangModal(true)}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'L'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Langnode Learner'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || 'learner@langnode.ai'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="flame" size={22} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user?.streakDays ?? 0} Days
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Learning Streak
            </Text>
          </View>

          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="ribbon" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {user?.conceptsMastered ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Concepts Mastered
            </Text>
          </View>
        </View>

        {/* Learning Preferences */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          Learning Calibration
        </Text>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLangModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="language" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Native Language
                </Text>
                <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                  {lang.nativeName} ({lang.name})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLevelModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: levelConfig.badgeColor + '20' }]}>
                <Ionicons name={levelConfig.icon as any} size={18} color={levelConfig.badgeColor} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Explanation Depth
                </Text>
                <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                  {levelConfig.title} • {levelConfig.subtitle}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Theme Settings - Light Mode Strictly Active */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.themeInfoRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sunny" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Light Mode Active
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary + '50',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>
                    STANDARD
                  </Text>
                </View>
              </View>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                Warm Orange &amp; Azure Blue high-contrast educational palette
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>
        </View>

        {/* FastAPI Backend URL Settings */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          FastAPI AI Backend
        </Text>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: 16,
            },
          ]}
        >
          <Text style={[styles.backendLabel, { color: colors.textSecondary }]}>
            Backend Server Host (FastAPI)
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="server-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.backendInput, { color: colors.text }]}
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:8000"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.apiActions}>
            <TouchableOpacity
              style={[styles.testPingBtn, { backgroundColor: colors.primary }]}
              onPress={handleTestApi}
              disabled={isTestingApi}
            >
              <Text style={styles.testPingText}>
                {isTestingApi ? 'Pinging...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>

            {apiStatus && (
              <Text
                style={[
                  styles.statusText,
                  {
                    color: apiStatus.includes('Connected')
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {apiStatus}
              </Text>
            )}
          </View>
        </View>

        {/* Device Information */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          Device Information
        </Text>
        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              padding: 14,
            },
          ]}
        >
          <View style={styles.deviceInfoRow}>
            <Text style={[styles.deviceInfoKey, { color: colors.textMuted }]}>
              Device
            </Text>
            <Text style={[styles.deviceInfoVal, { color: colors.text }]}>
              {Device.modelName || 'Expo Mobile Client'}
            </Text>
          </View>
          <View style={styles.deviceInfoRow}>
            <Text style={[styles.deviceInfoKey, { color: colors.textMuted }]}>
              OS
            </Text>
            <Text style={[styles.deviceInfoVal, { color: colors.text }]}>
              {Device.osName} {Device.osVersion}
            </Text>
          </View>
          <View style={styles.deviceInfoRow}>
            <Text style={[styles.deviceInfoKey, { color: colors.textMuted }]}>
              Platform Target
            </Text>
            <Text style={[styles.deviceInfoVal, { color: colors.text }]}>
              Expo Go Native
            </Text>
          </View>
        </View>

        {/* Reset Session Button */}
        <TouchableOpacity
          style={[
            styles.signOutBtn,
            {
              backgroundColor: colors.danger + '15',
              borderColor: colors.danger + '40',
            },
          ]}
          onPress={handleSignOut}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>
            Reset Profile Data
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <LanguageSelector
        visible={showLangModal}
        selectedLanguage={currentLanguage}
        onSelect={(l) => {
          setCurrentLanguage(l);
          updatePreferences(l, currentExplanationLevel);
        }}
        onClose={() => setShowLangModal(false)}
      />

      <ExplanationSelector
        visible={showLevelModal}
        selectedLevel={currentExplanationLevel}
        onSelect={(lvl) => {
          setCurrentExplanationLevel(lvl);
          updatePreferences(currentLanguage, lvl);
        }}
        onClose={() => setShowLevelModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  backendLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  backendInput: {
    flex: 1,
    fontSize: 14,
  },
  apiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testPingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  testPingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  deviceInfoKey: {
    fontSize: 13,
  },
  deviceInfoVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
