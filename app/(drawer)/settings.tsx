import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';

interface EditorSettings {
  fontSize: number;
  theme: 'light' | 'dark' | 'auto' | 'ocean' | 'forest' | 'solarized';
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, setTheme } = useTheme();
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    theme: 'auto',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('editor_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: EditorSettings) => {
    try {
      await AsyncStorage.setItem('editor_settings', JSON.stringify(newSettings));
      setSettings(newSettings);

      if (newSettings.theme !== settings.theme) {
        setTheme(newSettings.theme);
      }
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const changeFontSize = (increment: boolean) => {
    const newSize = increment ? settings.fontSize + 1 : settings.fontSize - 1;
    if (newSize >= 10 && newSize <= 24) {
      const newSettings = {
        ...settings,
        fontSize: newSize,
      };
      saveSettings(newSettings);
    }
  };

  const changeTheme = (theme: EditorSettings['theme']) => {
    const newSettings = {
      ...settings,
      theme,
    };
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: EditorSettings = {
              fontSize: 14,
              theme: 'auto',
            };
            saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        {/* About App Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About App</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>App Name</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              CuriousEditor
            </Text>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Version</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Developer</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              CuriousSheva
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.linkItem, { borderTopColor: colors.border }]}
            onPress={() => Linking.openURL('https://github.com/CuriousSheva')}
          >
            <Ionicons name="logo-github" size={20} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>GitHub</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          {/* Font size control */}
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Font Size</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Adjust text size in the editor
              </Text>
            </View>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity
                style={[styles.fontSizeButton, { backgroundColor: colors.primary }]}
                onPress={() => changeFontSize(false)}
                disabled={settings.fontSize <= 10}
              >
                <Text style={styles.fontSizeButtonText}>A-</Text>
              </TouchableOpacity>
              <Text style={[styles.fontSizeValue, { color: colors.text }]}>
                {settings.fontSize}px
              </Text>
              <TouchableOpacity
                style={[styles.fontSizeButton, { backgroundColor: colors.primary }]}
                onPress={() => changeFontSize(true)}
                disabled={settings.fontSize >= 24}
              >
                <Text style={styles.fontSizeButtonText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme selector */}
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Choose your preferred color theme
              </Text>
            </View>

            <View style={styles.themeButtons}>
              {(['light', 'dark', 'auto', 'ocean', 'forest', 'solarized'] as const).map(
                (theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeButton,
                      {
                        backgroundColor:
                          settings.theme === theme ? colors.primary : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => changeTheme(theme)}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        { color: settings.theme === theme ? '#fff' : colors.text },
                      ]}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>

        {/* Reset Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.error }]}
            onPress={resetSettings}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },

  section: { margin: 16, borderRadius: 12, overflow: 'hidden' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDescription: { fontSize: 14, opacity: 0.7 },

  fontSizeControls: { flexDirection: 'row', alignItems: 'center' },
  fontSizeButton: { padding: 8, borderRadius: 6, marginHorizontal: 4 },
  fontSizeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  fontSizeValue: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' },

  themeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
    marginTop: 8,
  },
  themeButtonText: { fontSize: 12, fontWeight: '600' },

  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
  },
  linkText: { fontSize: 14, fontWeight: '600' },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});