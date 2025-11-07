import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../contexts/ThemeContext';
import CustomDrawerContent from '../../components/CustomDrawerContent';

export default function DrawerLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 260,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
      }}
    >
      <Drawer.Screen name="editor" options={{ title: 'Editor' }} />
      <Drawer.Screen name="projects" options={{ title: 'Projects' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
    </Drawer>
  );
}