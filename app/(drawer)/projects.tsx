import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modificationTime?: number;
}

export default function ProjectsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(FileSystem.documentDirectory || '');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'files'>('projects');

  useEffect(() => {
    loadDocuments();
    if (activeTab === 'files') {
      loadFiles();
    }
  }, [currentPath, activeTab]);

  const loadDocuments = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const documentKeys = keys.filter(key => key.startsWith('document_'));
      const documentsData = await AsyncStorage.multiGet(documentKeys);
      const docs = documentsData.map(([key, value]) => JSON.parse(value || '{}'));
      docs.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      setDocuments(docs);
    } catch (error) {
      console.log('Error loading documents:', error);
    }
  };

  const loadFiles = async () => {
    if (activeTab !== 'files') return;
    
    setLoading(true);
    try {
      // Only access app's own directories
      const appDirs = [
        FileSystem.documentDirectory,
        FileSystem.cacheDirectory,
      ];

      let filesList: FileItem[] = [];
      
      for (const dir of appDirs) {
        if (!dir) continue;
        
        try {
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (dirInfo.exists && dirInfo.isDirectory) {
            const dirFiles = await FileSystem.readDirectoryAsync(dir);
            filesList = [
              ...filesList,
              ...dirFiles.map(file => ({
                name: file,
                path: dir + file,
                isDirectory: false,
                size: 0,
                modificationTime: Date.now()
              }))
            ];
          }
        } catch (error) {
          console.log(`Cannot access ${dir}:`, error);
        }
      }

      // Add sample files for demonstration
      if (filesList.length === 0) {
        filesList = [
          {
            name: "sample-document.txt",
            path: FileSystem.documentDirectory + "sample-document.txt",
            isDirectory: false,
            size: 1024,
            modificationTime: Date.now()
          },
          {
            name: "example.html",
            path: FileSystem.documentDirectory + "example.html", 
            isDirectory: false,
            size: 2048,
            modificationTime: Date.now()
          }
        ];
      }

      setFiles(filesList);
    } catch (error) {
      console.log('Error loading files:', error);
      // Show limited access message
      setFiles([
        {
          name: "file-access-info.txt",
          path: "info",
          isDirectory: false,
          size: 0,
          modificationTime: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = (document: Document) => {
    router.push({
      pathname: '/(drawer)/editor',
      params: { documentId: document.id }
    });
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const deleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`document_${documentId}`);
              loadDocuments();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const createNewDocument = () => {
    router.push('/(drawer)/editor');
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const openFile = async (file: FileItem) => {
    if (file.name === "file-access-info.txt") {
      Alert.alert(
        "File System Access",
        "Full file system access requires building the app with EAS Build or creating a development build.\n\n" +
        "In development with Expo Go, you can only access the app's own storage directory.\n\n" +
        "To access device files, build the app with: eas build --platform android",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (file.isDirectory) {
      setCurrentPath(file.path + '/');
    } else {
      try {
        // For sample files, create demo content
        if (file.name === "sample-document.txt") {
          const content = "This is a sample document.\n\nFull file system access requires building the app with EAS Build.";
          router.push({
            pathname: '/(drawer)/editor',
            params: { 
              content: content,
              title: file.name 
            }
          });
        } else if (file.name === "example.html") {
          const content = "<h1>Example HTML Document</h1><p>This demonstrates file opening functionality.</p>";
          router.push({
            pathname: '/(drawer)/editor',
            params: { 
              content: content,
              title: file.name 
            }
          });
        } else {
          const content = await FileSystem.readAsStringAsync(file.path);
          router.push({
            pathname: '/(drawer)/editor',
            params: { 
              content: content,
              title: file.name 
            }
          });
        }
      } catch (error) {
        Alert.alert('Error', `Cannot open file: ${file.name}`);
      }
    }
  };

  const importFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/html', 'application/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const content = await FileSystem.readAsStringAsync(result.uri);
        router.push({
          pathname: '/(drawer)/editor',
          params: { 
            content: content,
            title: result.name 
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import file');
    }
  };

  const navigateUp = () => {
    if (currentPath !== FileSystem.documentDirectory) {
      const parentPath = currentPath.split('/').slice(0, -2).join('/') + '/';
      setCurrentPath(parentPath);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentItem, { 
        backgroundColor: colors.surface, 
        borderColor: colors.border 
      }]}
      onPress={() => openDocument(item)}
      onLongPress={() => deleteDocument(item.id)}
    >
      <View style={styles.documentIcon}>
        <Ionicons name="document-text" size={24} color={colors.primary} />
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.documentDate, { color: colors.textSecondary }]}>
          Modified: {new Date(item.lastModified).toLocaleDateString()}
        </Text>
        <Text style={[styles.documentPreview, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[styles.fileItem, { 
        backgroundColor: colors.surface, 
        borderColor: colors.border 
      }]}
      onPress={() => openFile(item)}
      onLongPress={() => {
        Alert.alert(
          item.name,
          `Path: ${item.path}\nSize: ${item.size || 0} bytes\nType: ${item.isDirectory ? 'Folder' : 'File'}`,
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.fileIcon}>
        <Ionicons 
          name={item.isDirectory ? "folder" : "document"} 
          size={24} 
          color={item.isDirectory ? "#FF9500" : colors.primary} 
        />
      </View>
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.fileDetails, { color: colors.textSecondary }]}>
          {item.isDirectory ? 'Folder' : `${Math.round((item.size || 0) / 1024)} KB`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border 
        }]}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Project Explorer</Text>
          <TouchableOpacity onPress={createNewDocument} style={styles.newButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'projects' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'projects' && [styles.activeTabText, { color: colors.primary }]]}>
              My Documents
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'files' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => {
              setActiveTab('files');
              loadFiles();
            }}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'files' && [styles.activeTabText, { color: colors.primary }]]}>
              Device Files
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border 
        }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab === 'projects' ? 'documents' : 'files'}...`}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* File System Navigation */}
        {activeTab === 'files' && (
          <View style={[styles.pathNavigation, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }]}>
            <TouchableOpacity onPress={navigateUp} style={styles.backButton}>
              <Ionicons name="arrow-up" size={16} color={colors.primary} />
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Up</Text>
            </TouchableOpacity>
            <Text style={[styles.currentPath, { color: colors.textSecondary }]} numberOfLines={1}>
              {currentPath.replace('file://', '')}
            </Text>
            <TouchableOpacity onPress={importFile} style={styles.importButton}>
              <Ionicons name="download" size={16} color={colors.primary} />
              <Text style={[styles.importButtonText, { color: colors.primary }]}>Import</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {activeTab === 'projects' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Documents ({filteredDocuments.length})
            </Text>

            <FlatList
              data={filteredDocuments}
              renderItem={renderDocumentItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="document-text" size={64} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>No documents found</Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    {searchQuery ? 'Try a different search term' : 'Create your first document to get started'}
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Files ({filteredFiles.length})
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading files...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFiles}
                renderItem={renderFileItem}
                keyExtractor={(item) => item.path}
                style={styles.list}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="folder" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.text }]}>No files found</Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      {searchQuery ? 'Try a different search term' : 'No accessible files in this directory'}
                    </Text>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                      Try importing files using the Import button
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  pathNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  currentPath: {
    flex: 1,
    fontSize: 12,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  importButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  documentIcon: {
    marginRight: 12,
  },
  fileIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  fileInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  fileDetails: {
    fontSize: 12,
  },
  documentPreview: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});