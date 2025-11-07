import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

export default function CustomDrawerContent() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const menus = [
    { label: 'Editor', route: '/(drawer)/editor', icon: '📝' },
    { label: 'Projects', route: '/(drawer)/projects', icon: '📁' },
    { label: 'Settings', route: '/(drawer)/settings', icon: '⚙️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DrawerContentScrollView
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>
            CuriousEditor
          </Text>
        </View>

        {/* MENU */}
        <View style={styles.menuContainer}>
          {menus.map((item) => {
            const active = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.menuItem,
                  active && {
                    backgroundColor: isDark
                      ? colors.surface
                      : `${colors.primary}22`,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary,
                  },
                ]}
                onPress={() => router.push(item.route)}
              >
                <Text
                  style={[
                    styles.menuIcon,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {item.icon}
                </Text>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://curioussheva.dev/about')
          }
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            About CuriousSheva
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerVersion, { color: colors.textSecondary }]}>
          v1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
  },
});