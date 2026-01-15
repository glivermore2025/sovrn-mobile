import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) return Alert.alert('Enter a valid email');
    if (!password) return Alert.alert('Enter a password');

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    setLoading(false);

    if (error) return Alert.alert('Login failed', error.message);

    // Session will be set by AuthContext listener, which will navigate to home
    router.replace('/');
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
        editable={!loading}
        style={{
          color: '#fff',
          borderColor: '#333',
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        placeholderTextColor="#888"
        secureTextEntry
        editable={!loading}
        style={{
          color: '#fff',
          borderColor: '#333',
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      />

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#333' : '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Text>
      </Pressable>

      <Text style={{ color: '#aaa', fontSize: 12 }}>
        Enter your email and password to sign in.
      </Text>
    </View>
  );
}
