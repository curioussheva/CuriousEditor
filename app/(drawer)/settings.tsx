// app/(drawer)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';

interface EditorSettings {
  wordWrap: boolean;
  showLineNumbers: boolean;
  groupTags: boolean;
  autoSave: boolean;
  spellCheck: boolean;
  fontSize: number;
  theme: 'light' | 'dark' | 'auto';
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, setTheme } = useTheme();
  const [settings, setSettings] = useState<EditorSettings>({
    wordWrap: true,
    showLineNumbers: false,
    groupTags: true,
    autoSave: true,
    spellCheck: true,
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
      
      // Apply theme changes immediately
      if (newSettings.theme !== settings.theme) {
        setTheme(newSettings.theme);
      }
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const toggleSetting = (key: keyof EditorSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    saveSettings(newSettings);
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

  const changeTheme = (theme: 'light' | 'dark' | 'auto') => {
    const newSettings = {
      ...settings,
      theme,
    };
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: EditorSettings = {
              wordWrap: true,
              showLineNumbers: false,
              groupTags: true,
              autoSave: true,
              spellCheck: true,
              fontSize: 14,
              theme: 'auto',
            };
            saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onToggle,
    type = 'switch'
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    type?: 'switch' | 'select';
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Editor Settings</Text>
        </View>

        {/* Editor Behavior */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Editor Behavior</Text>
          
          <SettingItem
            title="Word Wrap"
            description="Wrap long lines to fit the editor width"
            value={settings.wordWrap}
            onToggle={() => toggleSetting('wordWrap')}
          />
          
          <SettingItem
            title="Show Line Numbers"
            description="Display line numbers in code views"
            value={settings.showLineNumbers}
            onToggle={() => toggleSetting('showLineNumbers')}
          />
          
          <SettingItem
            title="Group HTML Tags"
            description="Visually group related HTML tags"
            value={settings.groupTags}
            onToggle={() => toggleSetting('groupTags')}
          />
          
          <SettingItem
            title="Auto Save"
            description="Automatically save changes periodically"
            value={settings.autoSave}
            onToggle={() => toggleSetting('autoSave')}
          />
          
          <SettingItem
            title="Spell Check"
            description="Highlight spelling errors in the editor"
            value={settings.spellCheck}
            onToggle={() => toggleSetting('spellCheck')}
          />
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Font Size</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Adjust the text size in the editor
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

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Choose your preferred color theme
              </Text>
            </View>
            <View style={styles.themeButtons}>
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeButton,
                    { backgroundColor: colors.background },
                    settings.theme === theme && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => changeTheme(theme)}
                >
                  <Text style={[
                    styles.themeButtonText,
                    settings.theme === theme && styles.activeThemeButtonText
                  ]}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
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
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeButton: {
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  fontSizeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fontSizeValue: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  themeButtons: {
    flexDirection: 'row',
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeThemeButtonText: {
    color: 'white',
  },
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