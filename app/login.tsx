import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) return Alert.alert('Enter a valid email');

    setLoading(true);
    // Use a stable HTTPS redirector in production which forwards the Supabase
    // token fragment to the app via the custom scheme. For local development
    // we fall back to the Expo deep link; ensure any URLs you use are added
    // to Supabase's Redirect URLs.
    const appSchemeRedirect = 'sovrnmobile://auth';
    const webRedirector = 'https://getsovrn.com/supabase-redirect'; // <-- deploy this page to your site

    // Use the Expo dev deep link during development (so clicking the email opens
    // Expo Go), and use the web redirector in production as a robust fallback.
    const devRedirect = Linking.createURL('auth');
    const redirectTo = __DEV__ ? devRedirect : webRedirector;
    console.info('Sending magic link with redirect:', redirectTo);

    // NOTE: If you test locally, add the dev redirect URL shown in logs to
    // Supabase's Redirect URLs so the verify endpoint will accept it.

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) return Alert.alert('Login failed', error.message);

    router.push('/check-email');
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Sign in</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          color: '#fff',
          borderColor: '#333',
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      />

      <Pressable
        onPress={sendLink}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#333' : '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>
          {loading ? 'Sending…' : 'Send magic link'}
        </Text>
      </Pressable>

      <Text style={{ color: '#aaa' }}>
        We’ll email you a sign-in link. Tapping it will bring you back into the app.
      </Text>
    </View>
  );
}
