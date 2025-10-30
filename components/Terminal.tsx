// components/Terminal.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TerminalProps {
  visible: boolean;
  onClose: () => void;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

export default function Terminal({ visible, onClose }: TerminalProps) {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState('~');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, commandHistory]);

  const executeCommand = async (command: string) => {
    // Clear input
    setInput('');

    // Add command to history
    const newEntry: CommandHistory = {
      command,
      output: '',
      timestamp: new Date(),
    };

    setCommandHistory(prev => [...prev, newEntry]);

    // Simulate command execution
    setTimeout(() => {
      const output = processCommand(command);
      setCommandHistory(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 ? { ...item, output } : item
        )
      );
    }, 500);
  };

  const processCommand = (command: string): string => {
    const cmd = command.trim().toLowerCase();
    
    switch (cmd) {
      case '':
        return '';
      
      case 'clear':
        setCommandHistory([]);
        return '';
      
      case 'pwd':
        return currentDirectory;
      
      case 'ls':
        return `documents/\ndownloads/\npictures/\nprojects/`;
      
      case 'help':
        return `Available commands:
- clear: Clear terminal
- pwd: Show current directory
- ls: List files
- echo [text]: Print text
- date: Show current date
- whoami: Show current user
- help: Show this help message`;

      case 'date':
        return new Date().toString();
      
      case 'whoami':
        return 'user';
      
      default:
        if (cmd.startsWith('echo ')) {
          return cmd.slice(5);
        }
        if (cmd.startsWith('cd ')) {
          const newDir = cmd.slice(3);
          setCurrentDirectory(newDir || '~');
          return `Changed directory to ${newDir || '~'}`;
        }
        return `Command not found: ${command}\nType 'help' for available commands`;
    }
  };

  const handleSubmit = () => {
    if (input.trim()) {
      executeCommand(input.trim());
    }
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
          <Text style={styles.headerTitle}>Terminal</Text>
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
          Welcome to CuriousEditor Terminal v1.0{'\n'}
          Type 'help' for available commands{'\n'}
        </Text>

        {commandHistory.map((entry, index) => (
          <View key={index} style={styles.commandEntry}>
            <Text style={styles.prompt}>
              <Text style={styles.user}>user</Text>
              <Text style={styles.at}>@</Text>
              <Text style={styles.host}>curiouseditor</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.directory}>{currentDirectory}</Text>
              <Text style={styles.dollar}>$ </Text>
              <Text style={styles.command}>{entry.command}</Text>
            </Text>
            {entry.output ? (
              <Text style={styles.output}>{entry.output}</Text>
            ) : null}
          </View>
        ))}

        {/* Current Input Line */}
        <View style={styles.inputLine}>
          <Text style={styles.prompt}>
            <Text style={styles.user}>user</Text>
            <Text style={styles.at}>@</Text>
            <Text style={styles.host}>curiouseditor</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.directory}>{currentDirectory}</Text>
            <Text style={styles.dollar}>$ </Text>
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
          onPress={() => executeCommand('clear')}
        >
          <Ionicons name="trash-outline" size={16} color="#666" />
          <Text style={styles.quickActionText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => executeCommand('help')}
        >
          <Ionicons name="help-circle-outline" size={16} color="#666" />
          <Text style={styles.quickActionText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => executeCommand('ls')}
        >
          <Ionicons name="list-outline" size={16} color="#666" />
          <Text style={styles.quickActionText}>List</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  user: {
    color: '#00ff00',
  },
  at: {
    color: '#fff',
  },
  host: {
    color: '#00ff00',
  },
  colon: {
    color: '#fff',
  },
  directory: {
    color: '#87ceeb',
  },
  dollar: {
    color: '#fff',
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