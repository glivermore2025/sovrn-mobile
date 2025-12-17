import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';

import { DataProvider } from '../src/context/DataContext';
import { AuthProvider } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
            <StatusBar style="light" />
            <AuthLinkHandler />
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
    </AuthProvider>
  );
}

function AuthLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      // Expecting sovrn://auth?code=...&type=magiclink
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;

      if (!code) return;

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) router.replace('/account');
    };

    // cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // warm start
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => sub.remove();
  }, [router]);

  return null;
}
