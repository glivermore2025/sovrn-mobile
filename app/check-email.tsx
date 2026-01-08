import { View, Text, Pressable } from 'react-native';
import * as Linking from 'expo-linking';

export default function CheckEmail() {
  const webRedirector = 'https://getsovrn.com/supabase-redirect';

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Check your email</Text>
      <Text style={{ color: '#aaa' }}>
        Tap the magic link we sent you to finish signing in. If it doesn't open the app,
        open the email in your device's browser (not the in-app mail preview), or use
        the button below to open the redirector page.
      </Text>

      <Pressable
        onPress={() => Linking.openURL('mailto:')}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>Open email</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(webRedirector)}
        style={{
          marginTop: 8,
          backgroundColor: '#111',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Open redirector in browser</Text>
      </Pressable>

      <Text style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
        Tip: Some email clients (e.g., Gmail in-app) use an embedded webview that may not
        forward custom-scheme redirects. Open the message in your system browser if the
        automatic flow doesn't work.
      </Text>
    </View>
  );
}
