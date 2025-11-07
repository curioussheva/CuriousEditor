//services/documentService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  createdAt: string;
  category?: string;
  language?: string;
  mode?: 'code' | 'wysiwyg';
}

class DocumentService {
  private readonly DOCUMENT_PREFIX = 'document_';

  // Create or Update document
  async saveDocument(document: Document): Promise<Document> {
    try {
      const documentToSave = {
        ...document,
        lastModified: new Date().toISOString(),
        createdAt: document.createdAt || new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `${this.DOCUMENT_PREFIX}${document.id}`,
        JSON.stringify(documentToSave)
      );

      // Update recent documents list
      await this.updateRecentDocuments(document.id);

      return documentToSave;
    } catch (error) {
      console.error('Error saving document:', error);
      throw new Error('Failed to save document');
    }
  }

  // Get document by ID
  async getDocument(id: string): Promise<Document | null> {
    try {
      const saved = await AsyncStorage.getItem(`${this.DOCUMENT_PREFIX}${id}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  // Get all documents
  async getAllDocuments(): Promise<Document[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const documentKeys = keys.filter(key => key.startsWith(this.DOCUMENT_PREFIX));
      
      if (documentKeys.length === 0) return [];

      const documentsData = await AsyncStorage.multiGet(documentKeys);
      return documentsData
        .map(([key, value]) => {
          try {
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    } catch (error) {
      console.error('Error getting all documents:', error);
      return [];
    }
  }

  // Get most recent document
  async getRecentDocument(): Promise<Document | null> {
    try {
      const documents = await this.getAllDocuments();
      return documents.length > 0 ? documents[0] : null;
    } catch (error) {
      console.error('Error getting recent document:', error);
      return null;
    }
  }

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${this.DOCUMENT_PREFIX}${id}`);
      await this.removeFromRecentDocuments(id);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Recent documents management
  private async updateRecentDocuments(documentId: string): Promise<void> {
    try {
      const recentDocs = await this.getRecentDocumentsList();
      const updatedRecent = [
        documentId,
        ...recentDocs.filter(id => id !== documentId)
      ].slice(0, 10); // Keep only last 10 documents

      await AsyncStorage.setItem('recent_documents', JSON.stringify(updatedRecent));
    } catch (error) {
      console.error('Error updating recent documents:', error);
    }
  }

  private async getRecentDocumentsList(): Promise<string[]> {
    try {
      const recent = await AsyncStorage.getItem('recent_documents');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      return [];
    }
  }

  private async removeFromRecentDocuments(documentId: string): Promise<void> {
    try {
      const recentDocs = await this.getRecentDocumentsList();
      const updatedRecent = recentDocs.filter(id => id !== documentId);
      await AsyncStorage.setItem('recent_documents', JSON.stringify(updatedRecent));
    } catch (error) {
      console.error('Error removing from recent documents:', error);
    }
  }

  // Create new empty document
  createNewDocument(): Document {
    const timestamp = Date.now().toString();
    return {
      id: `doc_${timestamp}`,
      title: 'Untitled Document',
      content: '',
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: 'general',
      language: 'html',
      mode: 'code'
    };
  }

  // Check if document exists
  async documentExists(id: string): Promise<boolean> {
    const document = await this.getDocument(id);
    return document !== null;
  }
}

export const documentService = new DocumentService();