import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../../components/CustomDrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerHideStatusBarOnOpen: true,
        drawerStyle: {
          width: 300,
        },
      }}
    >
      <Drawer.Screen
        name="editor"
        options={{
          title: 'Editor',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="projects"
        options={{
          title: 'Projects',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
        }}
      />
// In your drawer layout, add:
<Drawer.Screen
  name="settings"
  options={{
    title: "Settings",
    drawerIcon: ({ size, color }) => (
      <Ionicons name="settings" size={size} color={color} />
    ),
  }}
/>          
          ),
        }}
      />
    </Drawer>
  );
}