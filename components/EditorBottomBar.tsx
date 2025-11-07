// components/EditorBottomBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface EditorBottomBarProps {
  editorMode: 'wysiwyg' | 'code' | 'split';
  onEditorModeChange: (mode: 'wysiwyg' | 'code' | 'split') => void;
  wordCount: number;
  characterCount: number;
  onOpenTerminal?: () => void;
}

const EditorBottomBar: React.FC<EditorBottomBarProps> = ({
  editorMode,
  onEditorModeChange,
  wordCount,
  characterCount,
  onOpenTerminal,
}) => {
  const { colors } = useTheme();

  const ModeButton: React.FC<{
    mode: 'wysiwyg' | 'code' | 'split';
    icon: string;
    label: string;
  }> = ({ mode, icon, label }) => (
    <TouchableOpacity
      style={[
        styles.modeButton,
        editorMode === mode && [styles.activeModeButton, { backgroundColor: colors.primary }]
      ]}
      onPress={() => onEditorModeChange(mode)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={editorMode === mode ? '#fff' : colors.textSecondary} 
      />
      <Text style={[
        styles.modeButtonText,
        { color: editorMode === mode ? '#fff' : colors.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {/* Left: Editor Mode Switcher */}
      <View style={styles.modeSwitcher}>
        <ModeButton mode="wysiwyg" icon="eye-outline" label="Visual" />
        <ModeButton mode="split" icon="copy-outline" label="Split" />
        <ModeButton mode="code" icon="code-outline" label="Code" />
      </View>

      {/* Center: Document Statistics */}
      <View style={styles.stats}>
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>
          {wordCount} words • {characterCount} chars
        </Text>
      </View>

      {/* Right: Additional Actions */}
      <View style={styles.actions}>
        {onOpenTerminal && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onOpenTerminal}
          >
            <Ionicons name="terminal-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              Terminal
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    height: 48,
  },
  modeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  activeModeButton: {
    // backgroundColor applied dynamically
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stats: {
    flex: 1,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '400',
  },
});

export default EditorBottomBar;