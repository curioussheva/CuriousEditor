import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { EditorRef } from './RichTextEditor';

interface ToolbarProps {
  editorRef: React.RefObject<EditorRef>;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onInsertTable?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  editorRef, 
  onInsertLink, 
  onInsertImage,
  onInsertTable 
}) => {
  const handleFormat = (command: string, value: string | null = null) => {
    editorRef.current?.formatText(command, value);
  };

  const ToolbarButton: React.FC<{
    icon: string;
    onPress: () => void;
    isActive?: boolean;
  }> = ({ icon, onPress, isActive = false }) => (
    <TouchableOpacity 
      style={[styles.toolbarButton, isActive && styles.activeButton]} 
      onPress={onPress}
    >
      <Text style={[styles.toolbarButtonText, isActive && styles.activeButtonText]}>
        {icon}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.toolbar}
      contentContainerStyle={styles.toolbarContent}
    >
      {/* Text Formatting */}
      <ToolbarButton icon="B" onPress={() => handleFormat('bold')} />
      <ToolbarButton icon="I" onPress={() => handleFormat('italic')} />
      <ToolbarButton icon="U" onPress={() => handleFormat('underline')} />
      <ToolbarButton icon="S" onPress={() => handleFormat('strikeThrough')} />
      
      <View style={styles.separator} />
      
      {/* Headers */}
      <ToolbarButton icon="H1" onPress={() => handleFormat('formatBlock', '<h1>')} />
      <ToolbarButton icon="H2" onPress={() => handleFormat('formatBlock', '<h2>')} />
      <ToolbarButton icon="H3" onPress={() => handleFormat('formatBlock', '<h3>')} />
      
      <View style={styles.separator} />
      
      {/* Lists */}
      <ToolbarButton icon="•" onPress={() => handleFormat('insertUnorderedList')} />
      <ToolbarButton icon="1." onPress={() => handleFormat('insertOrderedList')} />
      
      <View style={styles.separator} />
      
      {/* Alignment */}
      <ToolbarButton icon="⫷" onPress={() => handleFormat('justifyLeft')} />
      <ToolbarButton icon="⫸" onPress={() => handleFormat('justifyRight')} />
      <ToolbarButton icon="☰" onPress={() => handleFormat('justifyCenter')} />
      
      <View style={styles.separator} />
      
      {/* Special Formats */}
      <ToolbarButton icon="❝" onPress={() => handleFormat('formatBlock', '<blockquote>')} />
      <ToolbarButton icon="</>" onPress={() => handleFormat('formatBlock', '<pre>')} />
      
      <View style={styles.separator} />
      
       {/* Terminal */}
      <ToolbarButton icon="❝" onPress={onOpenAXS} />
      <View style={styles.separator} />
     
      {/* Media */}
      <ToolbarButton icon="🔗" onPress={onInsertLink} />
      <ToolbarButton icon="🖼️" onPress={onInsertImage} />
      <ToolbarButton icon="📊" onPress={() => onInsertTable ? onInsertTable() : editorRef.current?.insertTable()} />
      
      <View style={styles.separator} />
      
      {/* Actions */}
      <ToolbarButton icon="⎌" onPress={() => handleFormat('undo')} />
      <ToolbarButton icon="↷" onPress={() => handleFormat('redo')} />
      <ToolbarButton icon="✕" onPress={() => handleFormat('removeFormat')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    maxHeight: 50,
  },
  toolbarContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  activeButtonText: {
    color: '#ffffff',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#dee2e6',
    marginHorizontal: 6,
  },
});

export default Toolbar;