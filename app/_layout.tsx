// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataProvider } from '../src/context/DataContext'; // adjust if your path differs

export default function RootLayout() {
  return (
    <DataProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#fff',
              contentStyle: { backgroundColor: '#0a0a0a' },
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </DataProvider>
  );
}
