import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'auto' | 'ocean' | 'forest' | 'solarized';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
}

// ======================
// 🎨 THEME DEFINITIONS
// ======================

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#007AFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#FF3B30',
  success: '#34C759',
};

const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1c1c1e',
  primary: '#0A84FF',
  text: '#ffffff',
  textSecondary: '#98989f',
  border: '#38383a',
  error: '#FF453A',
  success: '#30D158',
};

// 🟦 Ocean theme
const oceanColors: ThemeColors = {
  background: '#0b132b',
  surface: '#1c2541',
  primary: '#5bc0be',
  text: '#ffffff',
  textSecondary: '#c0d6df',
  border: '#3a506b',
  error: '#ff6b6b',
  success: '#4ecdc4',
};

// 🌲 Forest theme
const forestColors: ThemeColors = {
  background: '#0e1e13',
  surface: '#18392b',
  primary: '#4caf50',
  text: '#f1f8e9',
  textSecondary: '#a5d6a7',
  border: '#2e7d32',
  error: '#ef5350',
  success: '#66bb6a',
};

// 🌅 Solarized theme
const solarizedColors: ThemeColors = {
  background: '#fdf6e3',
  surface: '#eee8d5',
  primary: '#268bd2',
  text: '#657b83',
  textSecondary: '#93a1a1',
  border: '#ccc2a6',
  error: '#dc322f',
  success: '#859900',
};

const allThemes: Record<Exclude<ThemeType, 'auto'>, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
  ocean: oceanColors,
  forest: forestColors,
  solarized: solarizedColors,
};

// ======================
// 🧩 CONTEXT PROVIDER
// ======================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('auto');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const getActualTheme = (): keyof typeof allThemes => {
    if (theme === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return theme === 'auto' ? 'light' : theme;
  };

  const activeTheme = getActualTheme();
  const colors = allThemes[activeTheme];
  const isDark = ['dark', 'ocean', 'forest'].includes(activeTheme);

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ======================
// 🔌 HOOK
// ======================

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};