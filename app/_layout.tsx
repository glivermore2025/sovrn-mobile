import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

import { DataProvider } from '../src/context/DataContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '◉',
    'my-data': '◫',
    settings: '⚙',
    profile: '○',
  };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {icons[name] ?? '•'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  icon: { fontSize: 22, color: colors.textMuted },
  iconActive: { color: colors.white },
});

function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-data"
        options={{
          title: 'My Data',
          tabBarIcon: ({ focused }) => <TabIcon name="my-data" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="check-email" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="debug" options={{ href: null }} />
    </Tabs>
  );
}

function AuthLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;

      if (!code) return;

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) router.replace('/account');
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar style="light" />
            <AuthLinkHandler />
            <AppTabs />
          </SafeAreaView>
        </SafeAreaProvider>
      </DataProvider>
    </AuthProvider>
  );
}
