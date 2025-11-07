// components/UnifiedToolbar.tsx
import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ScrollView,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UnifiedToolbarProps {
  // Formatting functions
  onFormat?: (command: string, value?: string) => void;
  onInsertLink?: () => void;
  onInsertImage?: () => void;
  onInsertTable?: () => void;
  
  // Enhanced toolbar functions
  onNewDocument?: () => void;
  onOpenTerminal?: () => void;
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  editorMode?: 'wysiwyg' | 'code' | 'split' | 'markdown';
  onToggleFormattingBar?: () => void;
  showFormattingBar?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: (query: string, replace?: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  // Status display
  showStatusBar?: boolean;
  wordCount?: number;
  characterCount?: number;
  
  colors?: {
    primary: string;
    text: string;
    textSecondary: string;
    surface: string;
    background: string;
    border: string;
  };
}

const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  // Formatting props
  onFormat,
  onInsertLink,
  onInsertImage,
  onInsertTable,
  
  // Enhanced props
  onNewDocument,
  onOpenTerminal,
  currentLanguage = 'html',
  editorMode = 'wysiwyg',
  onToggleFormattingBar,
  showFormattingBar = false,
  onUndo,
  onRedo,
  onSearch,
  canUndo = false,
  canRedo = false,
  
  // Status
  showStatusBar = true,
  wordCount,
  characterCount,
  
  colors = {
    primary: '#007AFF',
    text: '#000000',
    textSecondary: '#666666',
    surface: '#f8f9fa',
    background: '#ffffff',
    border: '#dee2e6'
  }
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  const ToolbarButton: React.FC<{
    icon: string;
    title?: string;
    onPress: () => void;
    isActive?: boolean;
    disabled?: boolean;
    useIcon?: boolean;
  }> = ({ icon, title, onPress, isActive = false, disabled = false, useIcon = false }) => (
    <TouchableOpacity 
      style={[
        styles.toolbarButton, 
        isActive && [styles.activeButton, { backgroundColor: colors.primary }],
        disabled && styles.disabledButton
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      {useIcon ? (
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={disabled ? colors.textSecondary : (isActive ? 'white' : colors.text)} 
        />
      ) : (
        <Text style={[
          styles.toolbarButtonText, 
          isActive && styles.activeButtonText,
          disabled && { color: colors.textSecondary }
        ]}>
          {icon}
        </Text>
      )}
      {title && (
        <Text style={[
          styles.toolbarButtonLabel,
          isActive && styles.activeButtonText,
          disabled && { color: colors.textSecondary }
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getModeDisplay = () => {
    switch (editorMode) {
      case 'wysiwyg': return { text: 'Visual Editor', icon: 'eye-outline' };
      case 'code': return { text: 'Code Editor', icon: 'code-outline' };
      case 'split': return { text: 'Split View', icon: 'copy-outline' };
      case 'markdown': return { text: 'Markdown', icon: 'document-text-outline' };
      default: return { text: 'Visual Editor', icon: 'eye-outline' };
    }
  };

  const modeInfo = getModeDisplay();

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
    }
    setShowSearchModal(false);
  };

  const handleReplace = () => {
    if (searchQuery.trim() && replaceQuery.trim() && onSearch) {
      onSearch(searchQuery, replaceQuery);
    }
    setShowSearchModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Main Toolbar - Clean and focused on actions */}
      <View style={[styles.mainToolbar, { borderBottomColor: colors.border }]}>
        {/* Left: Document Actions */}
        <View style={styles.toolbarGroup}>
          {onNewDocument && (
            <ToolbarButton
              icon="document-outline"
              title="New"
              onPress={onNewDocument}
              useIcon
            />
          )}
          
          <ToolbarButton
            icon="arrow-undo-outline"
            title="Undo"
            onPress={onUndo || (() => {})}
            disabled={!canUndo}
            useIcon
          />
          
          <ToolbarButton
            icon="arrow-redo-outline"
            title="Redo"
            onPress={onRedo || (() => {})}
            disabled={!canRedo}
            useIcon
          />
        </View>

        {/* Center: Quick Formatting (when in WYSIWYG mode) */}
        {editorMode === 'wysiwyg' && onFormat && (
          <View style={styles.toolbarGroup}>
            <ToolbarButton icon="B" onPress={() => onFormat('bold')} />
            <ToolbarButton icon="I" onPress={() => onFormat('italic')} />
            <ToolbarButton icon="U" onPress={() => onFormat('underline')} />
            <ToolbarButton icon="H1" onPress={() => onFormat('formatBlock', '<h1>')} />
            <ToolbarButton icon="•" onPress={() => onFormat('insertUnorderedList')} />
            <ToolbarButton icon="🔗" onPress={onInsertLink || (() => {})} />
          </View>
        )}

        {/* Right: Tools */}
        <View style={styles.toolbarGroup}>
          {onSearch && (
            <ToolbarButton
              icon="search-outline"
              title="Search"
              onPress={() => setShowSearchModal(true)}
              useIcon
            />
          )}
          
          {onToggleFormattingBar && editorMode === 'wysiwyg' && (
            <ToolbarButton
              icon="options-outline"
              title="Format"
              onPress={onToggleFormattingBar}
              isActive={showFormattingBar}
              useIcon
            />
          )}
          
          {onOpenTerminal && (
            <ToolbarButton
              icon="terminal-outline"
              title="Terminal"
              onPress={onOpenTerminal}
              useIcon
            />
          )}
        </View>
      </View>

      {/* Expandable Formatting Bar */}
      {showFormattingBar && onFormat && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.formattingBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.formattingBarContent}
        >
          <ToolbarButton icon="B" onPress={() => onFormat('bold')} />
          <ToolbarButton icon="I" onPress={() => onFormat('italic')} />
          <ToolbarButton icon="U" onPress={() => onFormat('underline')} />
          <ToolbarButton icon="S" onPress={() => onFormat('strikeThrough')} />
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <ToolbarButton icon="H1" onPress={() => onFormat('formatBlock', '<h1>')} />
          <ToolbarButton icon="H2" onPress={() => onFormat('formatBlock', '<h2>')} />
          <ToolbarButton icon="H3" onPress={() => onFormat('formatBlock', '<h3>')} />
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <ToolbarButton icon="•" onPress={() => onFormat('insertUnorderedList')} />
          <ToolbarButton icon="1." onPress={() => onFormat('insertOrderedList')} />
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <ToolbarButton icon="⫷" onPress={() => onFormat('justifyLeft')} />
          <ToolbarButton icon="⫸" onPress={() => onFormat('justifyRight')} />
          <ToolbarButton icon="☰" onPress={() => onFormat('justifyCenter')} />
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <ToolbarButton icon="❝" onPress={() => onFormat('formatBlock', '<blockquote>')} />
          <ToolbarButton icon="</>" onPress={() => onFormat('formatBlock', '<pre>')} />
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          {onInsertLink && <ToolbarButton icon="🔗" onPress={onInsertLink} />}
          {onInsertImage && <ToolbarButton icon="🖼️" onPress={onInsertImage} />}
          {onInsertTable && <ToolbarButton icon="📊" onPress={onInsertTable} />}
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <ToolbarButton icon="⎌" onPress={() => onFormat('undo')} />
          <ToolbarButton icon="↷" onPress={() => onFormat('redo')} />
          <ToolbarButton icon="✕" onPress={() => onFormat('removeFormat')} />
        </ScrollView>
      )}

      {/* Bottom Status Bar - Clean and informative */}
      {showStatusBar && (
        <View style={[styles.statusBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {/* Left: Editor Mode */}
          <View style={styles.statusSection}>
            <Ionicons name={modeInfo.icon as any} size={14} color={colors.textSecondary} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {modeInfo.text}
            </Text>
            {(editorMode === 'code' || editorMode === 'split') && (
              <View style={[styles.languageBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.languageText, { color: colors.primary }]}>
                  {currentLanguage.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Center: Document Stats (optional) */}
          <View style={styles.statusSection}>
            {(wordCount !== undefined || characterCount !== undefined) && (
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                {wordCount !== undefined && `Words: ${wordCount}`}
                {wordCount !== undefined && characterCount !== undefined && ' • '}
                {characterCount !== undefined && `Chars: ${characterCount}`}
              </Text>
            )}
          </View>

          {/* Right: Additional Status Info */}
          <View style={styles.statusSection}>
            {/* Can add line number, encoding, etc. here */}
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              UTF-8
            </Text>
          </View>
        </View>
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Search & Replace
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSearchModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputs}>
              <View style={styles.inputContainer}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  placeholder="Search for..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  placeholder="Replace with..."
                  placeholderTextColor={colors.textSecondary}
                  value={replaceQuery}
                  onChangeText={setReplaceQuery}
                />
              </View>
            </View>

            <View style={styles.searchButtons}>
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: colors.border }]}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={[styles.searchButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <Text style={styles.searchButtonText}>
                  Search
                </Text>
              </TouchableOpacity>
              
              {replaceQuery && (
                <TouchableOpacity 
                  style={[styles.searchButton, { backgroundColor: '#ff6b35' }]}
                  onPress={handleReplace}
                  disabled={!searchQuery.trim()}
                >
                  <Text style={styles.searchButtonText}>
                    Replace
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  mainToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  formattingBar: {
    backgroundColor: '#f8f9fa',
    maxHeight: 44,
  },
  formattingBarContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    height: 32,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsText: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  languageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 36,
    justifyContent: 'center',
  },
  activeButton: {
    // backgroundColor applied dynamically
  },
  disabledButton: {
    opacity: 0.4,
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#495057',
  },
  toolbarButtonLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  activeButtonText: {
    color: '#ffffff',
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchInputs: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
    width: 20,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  searchButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default UnifiedToolbar;