// components/AXSTerminal.tsx (Updated)
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermuxBridge from './TermuxBridge';

interface AXSTerminalProps {
  visible: boolean;
  onClose: () => void;
  editorRef: React.RefObject<any>;
  currentDocument?: any;
  onDocumentUpdate?: (content: string) => void;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error';
}

export default function AXSTerminal({ 
  visible, 
  onClose, 
  editorRef, 
  currentDocument,
  onDocumentUpdate 
}: AXSTerminalProps) {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [axsContext, setAxsContext] = useState<any>({});
  const [isTermuxAvailable, setIsTermuxAvailable] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      initializeAxsContext();
      checkTermux();
      if (scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [visible]);

  const checkTermux = async () => {
    const available = await TermuxBridge.checkTermuxAvailability();
    setIsTermuxAvailable(available);
    
    if (available) {
      addOutput('✅ Termux detected. Termux commands available.');
    } else {
      addOutput('⚠️  Termux not detected. Install Termux for shell access.');
    }
  };

  const addOutput = (output: string, type: 'output' | 'error' = 'output') => {
    setCommandHistory(prev => [...prev, {
      command: '',
      output,
      timestamp: new Date(),
      type,
    }]);
  };

  const initializeAxsContext = () => {
    setAxsContext({
      // Document context
      document: {
        title: currentDocument?.title || 'Untitled',
        content: currentDocument?.content || '',
        id: currentDocument?.id,
        getWordCount: () => {
          const text = currentDocument?.content || '';
          return text.trim() ? text.trim().split(/\s+/).length : 0;
        },
        getCharCount: () => (currentDocument?.content || '').length,
      },
      
      // Editor functions
      editor: {
        getSelection: async () => {
          return { text: '', start: 0, end: 0 };
        },
        replaceSelection: (text: string) => {
          editorRef.current?.formatText('insertText', text);
        },
        insertText: (text: string, position?: number) => {
          editorRef.current?.formatText('insertText', text);
        },
        getCursorPosition: () => ({ line: 0, ch: 0 }),
      },
      
      // Utility functions
      utils: {
        formatDate: (date?: Date) => (date || new Date()).toISOString(),
        generateId: () => Date.now().toString(),
        escapeHtml: (text: string) => text.replace(/[&<>"']/g, char => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char] || char)),
      },
      
      // Storage functions
      storage: {
        get: async (key: string) => {
          try {
            const value = await AsyncStorage.getItem(`axs_${key}`);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            return null;
          }
        },
        set: async (key: string, value: any) => {
          try {
            await AsyncStorage.setItem(`axs_${key}`, JSON.stringify(value));
            return true;
          } catch (error) {
            return false;
          }
        },
        delete: async (key: string) => {
          try {
            await AsyncStorage.removeItem(`axs_${key}`);
            return true;
          } catch (error) {
            return false;
          }
        },
      },

      // Termux functions (only available if Termux is installed)
      termux: {
        isAvailable: isTermuxAvailable,
        execute: async (command: string) => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.executeCommand(command);
        },
        share: async (filePath: string) => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.shareFile(filePath);
        },
        toast: async (message: string) => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.showToast(message);
        },
        vibrate: async (duration: number) => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.vibrate(duration);
        },
        battery: async () => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.getBatteryInfo();
        },
        deviceInfo: async () => {
          if (!isTermuxAvailable) {
            throw new Error('Termux not available');
          }
          return await TermuxBridge.getDeviceInfo();
        },
      },
    });
  };

  const executeAXSCommand = async (command: string) => {
    setInput('');
    
    const newEntry: CommandHistory = {
      command,
      output: '',
      timestamp: new Date(),
      type: 'command',
    };

    setCommandHistory(prev => [...prev, newEntry]);

    try {
      const result = await processAXSCommand(command);
      setCommandHistory(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 ? { ...item, output: result, type: 'output' } : item
        )
      );
    } catch (error) {
      setCommandHistory(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 ? { 
            ...item, 
            output: `Error: ${error instanceof Error ? error.message : String(error)}`,
            type: 'error'
          } : item
        )
      );
    }
  };

  const processAXSCommand = async (command: string): Promise<string> => {
    const trimmedCmd = command.trim();
    
    // Built-in commands
    if (trimmedCmd === 'clear') {
      setCommandHistory([]);
      return '';
    }
    
    if (trimmedCmd === 'help') {
      return `AXS Commands Available:
      
BUILT-IN COMMANDS:
- help: Show this help
- clear: Clear terminal
- ls: List available functions
- doc info: Show document information
- js <code>: Execute JavaScript
- termux status: Check Termux availability

DOCUMENT OPERATIONS:
- doc wordcount: Get word count
- doc charcount: Get character count
- doc title: Get document title
- insert <text>: Insert text at cursor

TERMUX COMMANDS (if installed):
- termux <command>: Execute shell command in Termux
- termux toast <msg>: Show toast message
- termux vibrate: Vibrate device
- termux battery: Get battery info
- termux info: Get device info

JAVASCRIPT EXAMPLES:
- js axs.document.getWordCount()
- js axs.termux.isAvailable
- js axs.termux.toast('Hello from AXS!')
- js 2 + 2
- js "Hello".toUpperCase()`;
    }
    
    if (trimmedCmd === 'ls') {
      const functions = Object.keys(axsContext).flatMap(category => 
        Object.keys(axsContext[category]).map(func => `${category}.${func}`)
      );
      return `Available functions:\n${functions.join('\n')}`;
    }
    
    if (trimmedCmd === 'doc info') {
      const doc = axsContext.document;
      return `Document: ${doc.title}
Word Count: ${doc.getWordCount()}
Character Count: ${doc.getCharCount()}
ID: ${doc.id || 'New Document'}`;
    }
    
    if (trimmedCmd === 'termux status') {
      return `Termux: ${isTermuxAvailable ? '✅ Available' : '❌ Not Available'}`;
    }
    
    if (trimmedCmd.startsWith('doc ')) {
      const subCmd = trimmedCmd.slice(4);
      switch (subCmd) {
        case 'wordcount':
          return `Word count: ${axsContext.document.getWordCount()}`;
        case 'charcount':
          return `Character count: ${axsContext.document.getCharCount()}`;
        case 'title':
          return `Title: ${axsContext.document.title}`;
        default:
          return `Unknown document command: ${subCmd}`;
      }
    }
    
    if (trimmedCmd.startsWith('insert ')) {
      const text = trimmedCmd.slice(7);
      axsContext.editor.insertText(text);
      return `Inserted: "${text}"`;
    }
    
    // Termux commands
    if (trimmedCmd.startsWith('termux ')) {
      const termuxCmd = trimmedCmd.slice(7);
      
      if (termuxCmd.startsWith('toast ')) {
        const message = termuxCmd.slice(6);
        await axsContext.termux.toast(message);
        return `Toast sent: "${message}"`;
      }
      
      if (termuxCmd === 'vibrate') {
        await axsContext.termux.vibrate(300);
        return 'Device vibrated';
      }
      
      if (termuxCmd === 'battery') {
        return await axsContext.termux.battery();
      }
      
      if (termuxCmd === 'info') {
        return await axsContext.termux.deviceInfo();
      }
      
      // Execute arbitrary shell command
      try {
        const result = await axsContext.termux.execute(termuxCmd);
        return result;
      } catch (error) {
        throw new Error(`Termux command failed: ${error}`);
      }
    }
    
    // JavaScript execution
    if (trimmedCmd.startsWith('js ')) {
      const jsCode = trimmedCmd.slice(3);
      return await executeJavaScript(jsCode);
    }
    
    // Try as JavaScript if it looks like code
    if (trimmedCmd.includes('(') || trimmedCmd.includes('=') || trimmedCmd.startsWith('"') || trimmedCmd.startsWith("'")) {
      return await executeJavaScript(trimmedCmd);
    }
    
    return `Unknown command: ${trimmedCmd}\nType 'help' for available commands`;
  };

  const executeJavaScript = async (code: string): Promise<string> => {
    try {
      // Create a safe execution environment
      const axs = { ...axsContext };
      
      // Define console for the executed code
      const console = {
        log: (...args: any[]) => {
          const output = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          setCommandHistory(prev => [...prev, {
            command: '',
            output: `→ ${output}`,
            timestamp: new Date(),
            type: 'output',
          }]);
        },
        error: (...args: any[]) => {
          const output = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          setCommandHistory(prev => [...prev, {
            command: '',
            output: `✗ ${output}`,
            timestamp: new Date(),
            type: 'error',
          }]);
        },
      };
      
      // Wrap the code in a function
      const wrappedCode = `
        try {
          return (function(axs, console) {
            ${code}
          })(axs, console);
        } catch (e) {
          throw e;
        }
      `;
      
      const result = eval(wrappedCode);
      
      if (result === undefined || result === null) {
        return 'undefined';
      }
      
      if (typeof result === 'object') {
        return JSON.stringify(result, null, 2);
      }
      
      return String(result);
    } catch (error) {
      throw new Error(`JavaScript Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSubmit = () => {
    if (input.trim()) {
      executeAXSCommand(input.trim());
    }
  };

  const installTermux = () => {
    Linking.openURL('https://f-droid.org/en/packages/com.termux/');
    addOutput('Opening Termux download page...');
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Terminal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.windowControls}>
            <View style={[styles.control, styles.close]} />
            <View style={[styles.control, styles.minimize]} />
            <View style={[styles.control, styles.maximize]} />
          </View>
          <Text style={styles.headerTitle}>
            AXS Terminal {isTermuxAvailable ? '🔗' : '📱'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Terminal Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.terminalContent}
        contentContainerStyle={styles.terminalContentContainer}
      >
        <Text style={styles.welcomeText}>
          AXS Terminal v2.0 with Termux Integration{'\n'}
          Termux: {isTermuxAvailable ? 'Connected ✅' : 'Not Connected ⚠️'}{'\n'}
          Type 'help' for available commands{'\n'}
        </Text>

        {commandHistory.map((entry, index) => (
          <View key={index} style={styles.commandEntry}>
            {entry.command ? (
              <Text style={styles.prompt}>
                <Text style={styles.dollar}>axs&gt; </Text>
                <Text style={styles.command}>{entry.command}</Text>
              </Text>
            ) : null}
            {entry.output ? (
              <Text style={[
                styles.output,
                entry.type === 'error' && styles.errorOutput
              ]}>
                {entry.output}
              </Text>
            ) : null}
          </View>
        ))}

        {/* Current Input Line */}
        <View style={styles.inputLine}>
          <Text style={styles.prompt}>
            <Text style={styles.dollar}>axs&gt; </Text>
          </Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Type a command..."
            placeholderTextColor="#666"
          />
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => executeAXSCommand('clear')}
        >
          <Ionicons name="trash-outline" size={16} color="#666" />
          <Text style={styles.quickActionText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => executeAXSCommand('help')}
        >
          <Ionicons name="help-circle-outline" size={16} color="#666" />
          <Text style={styles.quickActionText}>Help</Text>
        </TouchableOpacity>
        
        {!isTermuxAvailable && (
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={installTermux}
          >
            <Ionicons name="download-outline" size={16} color="#666" />
            <Text style={styles.quickActionText}>Install Termux</Text>
          </TouchableOpacity>
        )}
        
        {isTermuxAvailable && (
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => executeAXSCommand('termux battery')}
          >
            <Ionicons name="battery-charging" size={16} color="#666" />
            <Text style={styles.quickActionText}>Battery</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ... keep the same styles as before
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e1e1e',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  windowControls: {
    flexDirection: 'row',
    marginRight: 12,
  },
  control: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  close: {
    backgroundColor: '#ff5f57',
  },
  minimize: {
    backgroundColor: '#ffbd2e',
  },
  maximize: {
    backgroundColor: '#28ca42',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  terminalContent: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  terminalContentContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    color: '#00ff00',
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  commandEntry: {
    marginBottom: 8,
  },
  prompt: {
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
  },
  dollar: {
    color: '#87ceeb',
    fontWeight: 'bold',
  },
  command: {
    color: '#fff',
  },
  output: {
    color: '#d4d4d4',
    fontFamily: 'Courier New',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  errorOutput: {
    color: '#ff6b6b',
  },
  inputLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Courier New',
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    backgroundColor: '#404040',
    borderRadius: 6,
  },
  quickActionText: {
    color: '#d4d4d4',
    fontSize: 12,
    marginLeft: 4,
  },
});