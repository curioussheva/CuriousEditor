import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Modal, 
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import RichTextEditor, { EditorRef } from '../../components/RichTextEditor';
import EnhancedToolbar from '../../components/EnhancedToolbar';
import Terminal from '../../components/Terminal';
import AXSTerminal from '../../components/AXSTerminal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
  category?: string;
}

// Add status bar height helper
const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);
};

export default function EditorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const editorRef = useRef<EditorRef>(null);
  
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [showFileTypeModal, setShowFileTypeModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'link' | 'image' | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAXSTerminal, setShowAXSTerminal] = useState(false);
  
  // Editor settings state
  const [editorSettings, setEditorSettings] = useState({
    wordWrap: true,
    showLineNumbers: false,
    groupTags: true,
  });

  // Load settings when component mounts
  useEffect(() => {
    loadEditorSettings();
  }, []);

  const loadEditorSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('editor_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setEditorSettings({
          wordWrap: settings.wordWrap,
          showLineNumbers: settings.showLineNumbers,
          groupTags: settings.groupTags,
        });
      }
    } catch (error) {
      console.log('Error loading editor settings:', error);
    }
  };

  // Terminal handlers
  const handleOpenTerminal = () => {
    setShowTerminal(true);
  };

  const handleOpenAXS = () => {
    setShowAXSTerminal(true);
  };

  // Inside your component:
  const { colors } = useTheme();

  // Load document if editing existing one
  useEffect(() => {
    if (params.documentId) {
      loadDocument(params.documentId as string);
    } else {
      // Load most recent document or start fresh
      loadRecentDocument();
    }
  }, [params.documentId]);

  // Add this useEffect to handle file content from params
  useEffect(() => {
    if (params.content && params.title) {
      setTitle(params.title as string);
      editorRef.current?.setContent(params.content as string);
    }
  }, [params.content, params.title]);

  const loadRecentDocument = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const documentKeys = keys.filter(key => key.startsWith('document_'));
      if (documentKeys.length > 0) {
        // Get the most recent document
        const documentsData = await AsyncStorage.multiGet(documentKeys);
        const docs = documentsData.map(([key, value]) => JSON.parse(value || '{}'));
        docs.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        
        const recentDoc = docs[0];
        setDocument(recentDoc);
        setTitle(recentDoc.title);
        editorRef.current?.setContent(recentDoc.content);
      }
    } catch (error) {
      console.log('Error loading recent document:', error);
    }
  };

  const loadDocument = async (id: string) => {
    try {
      const saved = await AsyncStorage.getItem(`document_${id}`);
      if (saved) {
        const doc = JSON.parse(saved);
        setDocument(doc);
        setTitle(doc.title);
        editorRef.current?.setContent(doc.content);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load document');
    }
  };

  const handleContentChange = (html: string, text: string) => {
    setContent(html);
    setHasUnsavedChanges(true);
    
    // Update counts
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  };

  const handleSave = async () => {
    try {
      const documentId = document?.id || Date.now().toString();
      const documentToSave: Document = {
        id: documentId,
        title: title,
        content: content,
        lastModified: new Date().toISOString(),
        createdAt: document?.createdAt || new Date().toISOString(),
        category: document?.category || 'general'
      };

      await AsyncStorage.setItem(`document_${documentId}`, JSON.stringify(documentToSave));
      setDocument(documentToSave);
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Document saved successfully!');
      setShowSaveModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save document');
    }
  };

  // Updated file insertion handlers
  const handleInsertLink = () => {
    setCurrentAction('link');
    setShowFileTypeModal(true);
  };

  const handleInsertImage = () => {
    setCurrentAction('image');
    setShowFileTypeModal(true);
  };

  const handleFileTypeSelection = async (option: 'gallery' | 'camera' | 'files' | 'url') => {
    setShowFileTypeModal(false);
    
    switch (option) {
      case 'gallery':
        await pickFromGallery();
        break;
      case 'camera':
        await takePhoto();
        break;
      case 'files':
        await pickDocument();
        break;
      case 'url':
        // Fallback to URL input (you can keep your existing modal logic here if needed)
        Alert.alert('Info', 'URL input feature coming soon!');
        break;
    }
  };

  const pickFromGallery = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && currentAction === 'image') {
        editorRef.current?.insertImage(result.assets[0].uri);
        Alert.alert('Success', 'Image inserted successfully!');
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && currentAction === 'image') {
        editorRef.current?.insertImage(result.assets[0].uri);
        Alert.alert('Success', 'Photo inserted successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // All file types
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        
        if (currentAction === 'link') {
          // For links, create a link to the file
          editorRef.current?.createLink(file.uri, file.name || 'File');
          Alert.alert('Success', `Link to "${file.name}" inserted successfully!`);
        } else if (currentAction === 'image') {
          // For images, insert the image directly if it's an image file
          if (file.mimeType?.startsWith('image/')) {
            editorRef.current?.insertImage(file.uri);
            Alert.alert('Success', 'Image inserted successfully!');
          } else {
            Alert.alert('Error', 'Please select an image file');
          }
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleExport = async () => {
    const htmlContent = await editorRef.current?.getContent();
    const textContent = await editorRef.current?.getText();
    
    setShowExportModal(true);
  };

  const handleNewDocument = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Create new document anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'New Document', 
            style: 'destructive', 
            onPress: () => {
              editorRef.current?.clearContent();
              setTitle('Untitled Document');
              setDocument(null);
              setHasUnsavedChanges(false);
              setWordCount(0);
              setCharCount(0);
            }
          },
        ]
      );
    } else {
      editorRef.current?.clearContent();
      setTitle('Untitled Document');
      setDocument(null);
      setWordCount(0);
      setCharCount(0);
    }
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleExportHTML = async () => {
    const htmlContent = await editorRef.current?.getContent();
    Alert.alert(
      'HTML Export',
      `HTML content copied to clipboard!\n\nCharacter count: ${htmlContent?.length}`,
      [{ text: 'OK' }]
    );
    setShowExportModal(false);
  };

  const handleExportText = async () => {
    const textContent = await editorRef.current?.getText();
    Alert.alert(
      'Text Export',
      `Plain text copied to clipboard!\n\nCharacter count: ${textContent?.length}`,
      [{ text: 'OK' }]
    );
    setShowExportModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={colors.isDark ? 'light-content' : 'dark-content'} 
        translucent={true}
      />
      
      {/* Ultra Compact Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.surface, 
        borderBottomColor: colors.border,
        marginTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0,
      }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowSaveModal(true)} style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Ionicons name="pencil" size={12} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <View style={styles.stats}>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {wordCount}w
            </Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {charCount}c
            </Text>
          </View>
          <TouchableOpacity onPress={handleExport} style={styles.actionButton}>
            <Ionicons name="download" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowSaveModal(true)} 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.saveButtonText}>
              {hasUnsavedChanges ? 'Save' : 'Saved'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Toolbar */}
      <EnhancedToolbar 
        editorRef={editorRef}
        onInsertLink={handleInsertLink}
        onInsertImage={handleInsertImage}
        onNewDocument={handleNewDocument}
        onOpenTerminal={handleOpenTerminal}
        onOpenAXS={handleOpenAXS}
      />
      
      {/* Editor */}
      <View style={styles.editorContainer}>
        <RichTextEditor
          ref={editorRef}
          style={styles.editor}
          onChange={handleContentChange}
          placeholder="Start writing your document..."
          settings={editorSettings}
        />
      </View>

      {/* Terminal Components */}
      <Terminal 
        visible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
      
      <AXSTerminal 
        visible={showAXSTerminal}
        onClose={() => setShowAXSTerminal(false)}
        editorRef={editorRef}
        currentDocument={document}
        onDocumentUpdate={(content) => {
          setContent(content);
          setHasUnsavedChanges(true);
        }}
      />

      {/* Your existing modals */}
      {/* ... (keep all your existing modals) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    height: 44,
  },
  menuButton: {
    padding: 4,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stats: {
    marginRight: 8,
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 10,
  },
  actionButton: {
    padding: 4,
    marginRight: 8,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    flex: 1,
  },
});