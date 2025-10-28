// app/_layout.tsx
import { Tabs } from 'expo-router';
import { DataProvider } from '../src/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function RootLayout() {
  return (
    <DataProvider>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: '#0a0a0a',
            borderTopColor: '#1f2937',
          },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#6b7280',
          headerTitleStyle: { color: '#fff' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === 'ios' ? 'speedometer' : 'speedometer-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-data"
          options={{
            title: 'My Data',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === 'ios' ? 'albums' : 'albums-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === 'ios' ? 'settings' : 'settings-outline'} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </DataProvider>
  );
}
