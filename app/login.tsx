import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, font } from '../src/theme';

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

    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <View style={s.top}>
          <Text style={s.brand}>sovrn</Text>
          <Text style={s.tagline}>Own your data. Get paid.</Text>
        </View>

        <View style={s.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            style={s.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!loading}
            style={s.input}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              s.button,
              loading && s.buttonDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={s.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>

        <Text style={s.footer}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },

  top: { alignItems: 'center', marginBottom: 48 },
  brand: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  tagline: { color: colors.textSecondary, fontSize: font.md },

  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    color: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: font.md,
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  footer: {
    color: colors.textMuted,
    fontSize: font.xs,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    lineHeight: 16,
  },
});
