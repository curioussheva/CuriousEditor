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
  Platform
} from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RichTextEditor, { EditorRef } from '../../components/RichTextEditor';
import EnhancedToolbar from '../../components/EnhancedToolbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
//import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';


interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
  category?: string;
}

export default function EditorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const editorRef = useRef<EditorRef>(null);
  
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'url' | 'gallery' | 'camera'>('url');

  // Load document if editing existing one
  useEffect(() => {
    if (params.documentId) {
      loadDocument(params.documentId as string);
    } else {
      loadRecentDocument();
    }
    
    // Request permissions
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, [params.documentId]);

  const loadRecentDocument = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const documentKeys = keys.filter(key => key.startsWith('document_'));
      if (documentKeys.length > 0) {
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

  const handleInsertLink = () => {
    setShowLinkModal(true);
    setActiveTab('url');
  };

  const handleInsertImage = () => {
    setShowImageModal(true);
    setActiveTab('url');
  };

 
const confirmLink = () => {
  if (activeTab === 'url') {
    // Handle URL links
    if (linkUrl.trim()) {
      const url = linkUrl.trim();
      const text = linkText.trim() || url;
      
      if (editorRef.current) {
        editorRef.current.createLink(url, text);
      }
      
      setShowLinkModal(false);
      resetLinkModal();
    } else {
      alert('Please enter a URL');
    }
  } else {
    // Handle file links
    if (selectedFile) {
      // For files, you have several options:
      
      // Option 1: Use file URI directly (for local files in app)
      const fileUri = selectedFile.uri;
      const fileName = selectedFile.name;
      const displayText = linkText.trim() || fileName;
      
      if (editorRef.current) {
        // Create a link that points to the local file
        // Note: This only works for files within the app's sandbox
        editorRef.current.createLink(fileUri, displayText);
      }
      
      setShowLinkModal(false);
      resetLinkModal();
    } else {
      alert('Please select a file first');
    }
  }
};
const resetLinkModal = () => {
  setLinkUrl('');
  setLinkText('');
  setSelectedFile(null);
  setActiveTab('url');
};

  const confirmImage = () => {
    if (imageUrl) {
      editorRef.current?.insertImage(imageUrl);
      setShowImageModal(false);
      setImageUrl('');
    } else {
      Alert.alert('Error', 'Please enter an image URL');
    }
  };

  // NEW: Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        editorRef.current?.insertImage(result.assets[0].uri);
        setShowImageModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // NEW: Take photo with camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        editorRef.current?.insertImage(result.assets[0].uri);
        setShowImageModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // NEW: Pick file from filesystem
   const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // All file types
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      setSelectedFile({
        uri: file.uri,
        name: file.name || 'file',
        type: file.mimeType || 'application/octet-stream'
      });
      
      // Auto-fill link text with file name
      setLinkText(file.name || 'Download File');
      
      // For local files, we need to handle them differently
      // You might want to upload to a server first or use a data URL
      console.log('Selected file:', file);
    }
  } catch (error) {
    console.log('Error picking file:', error);
    alert('Error selecting file');
  }
};

  const handleExport = async () => {
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
//    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowSaveModal(true)} style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Ionicons name="pencil" size={14} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <View style={styles.stats}>
              <Text style={styles.statText}>{wordCount} words</Text>
              <Text style={styles.statText}>{charCount} chars</Text>
            </View>
            <TouchableOpacity onPress={handleExport} style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSaveModal(true)} style={styles.saveButton}>
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
        />
        
        {/* Editor */}
        <View style={styles.editorContainer}>
          <RichTextEditor
            ref={editorRef}
            style={styles.editor}
            onChange={handleContentChange}
            placeholder="Start writing your document..."
          />
        </View>

        {/* Enhanced Link Insertion Modal */}
<Modal visible={showLinkModal} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Insert Link</Text>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'url' && styles.activeTab]}
          onPress={() => setActiveTab('url')}
        >
          <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>
            URL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
          onPress={() => setActiveTab('gallery')}
        >
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
            File
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'url' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter URL (https://...)"
            value={linkUrl}
            onChangeText={setLinkUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Link text (optional)"
            value={linkText}
            onChangeText={setLinkText}
          />
        </>
      ) : (
        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.filePickButton} onPress={pickFile}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <Text style={styles.filePickText}>
              {selectedFile ? 'Change File' : 'Pick a file from your device'}
            </Text>
          </TouchableOpacity>
          
          {selectedFile && (
            <View style={styles.selectedFile}>
              <Ionicons name="document-attach" size={16} color="#666" />
              <Text style={styles.selectedFileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.selectedFileSize}>
                {/* You can add file size here if needed */}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => {
            setShowLinkModal(false);
            resetLinkModal();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modalButton, 
            styles.confirmButton,
            ((activeTab === 'url' && !linkUrl.trim()) || 
             (activeTab === 'gallery' && !selectedFile)) && styles.disabledButton
          ]}
          onPress={confirmLink}
          disabled={(activeTab === 'url' && !linkUrl.trim()) || 
                   (activeTab === 'gallery' && !selectedFile)}
        >
          <Text style={styles.confirmButtonText}>Insert</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
        {/* Enhanced Image Insertion Modal */}
        <Modal visible={showImageModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Insert Image</Text>
              
              {/* Tab Navigation */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'url' && styles.activeTab]}
                  onPress={() => setActiveTab('url')}
                >
                  <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>
                    URL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
                  onPress={() => setActiveTab('gallery')}
                >
                  <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
                    Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
                  onPress={() => setActiveTab('camera')}
                >
                  <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>
                    Camera
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'url' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter image URL"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  
                  <Text style={styles.helpText}>
                    Enter the full URL of an image (e.g., https://example.com/image.jpg)
                  </Text>
                </>
              ) : activeTab === 'gallery' ? (
                <TouchableOpacity style={styles.imageOption} onPress={pickImageFromGallery}>
                  <Ionicons name="images" size={32} color="#007AFF" />
                  <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                  <Text style={styles.imageOptionSubtext}>Select an image from your photo library</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#007AFF" />
                  <Text style={styles.imageOptionText}>Take Photo</Text>
                  <Text style={styles.imageOptionSubtext}>Use your camera to take a new photo</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowImageModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                {activeTab === 'url' && (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={confirmImage}
                  >
                    <Text style={styles.confirmButtonText}>Insert</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Export Modal */}
        <Modal visible={showExportModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export Document</Text>
              
              <Text style={styles.exportStats}>
                📊 Stats: {wordCount} words, {charCount} characters
              </Text>
              
              <TouchableOpacity style={styles.exportOption} onPress={handleExportHTML}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Export as HTML</Text>
                  <Text style={styles.exportOptionDesc}>Rich formatted content with HTML tags</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exportOption} onPress={handleExportText}>
                <Ionicons name="document" size={24} color="#007AFF" />
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Export as Plain Text</Text>
                  <Text style={styles.exportOptionDesc}>Clean text without formatting</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowExportModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Save/Title Modal */}
        <Modal visible={showSaveModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Document</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Document title"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSaveModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.confirmButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
//    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'colors.background',
  },
  container: {
    flex: 1,
    backgroundColor: '#colors.background',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'colors.background',
  },
  menuButton: {
    padding: 8,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stats: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  actionButton: {
    padding: 8,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  // New Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  // File Pick Button
  filePickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: '#f8f9ff',
  },
  filePickText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Image Options
  imageOption: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: '#f8f9ff',
  },
  imageOptionText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  imageOptionSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  exportStats: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 14,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  exportOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 12,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fileSection: {
    width: '100%',
  },
  filePickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F8FAFF',
    marginBottom: 12,
  },
  filePickText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedFileName: {
    flex: 1,
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  selectedFileSize: {
    color: '#666',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

