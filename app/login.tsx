import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, font } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const trimmedEmail = email.trim().toLowerCase();

  const handleSendSignupCode = async () => {
    if (!trimmedEmail.includes('@')) return Alert.alert('Enter a valid email');

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (error) return Alert.alert('Could not send code', error.message);

    setCodeSent(true);
    Alert.alert('Code sent', 'Check your email for a one-time Sovrn sign-up code.');
  };

  const handleVerifySignupCode = async () => {
    if (!trimmedEmail.includes('@')) return Alert.alert('Enter a valid email');
    const token = code.trim();
    if (token.length < 6) return Alert.alert('Enter the code from your email');

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token,
      type: 'email',
    });
    setLoading(false);

    if (error) return Alert.alert('Code verification failed', error.message);

    setCodeVerified(true);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSetSignupPassword = async () => {
    if (password.length < 6) return Alert.alert('Enter a password with at least 6 characters');
    if (password !== confirmPassword) return Alert.alert('Passwords do not match');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return Alert.alert('Could not save password', error.message);

    router.replace('/');
  };

  const handlePasswordLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) return Alert.alert('Enter a valid email');
    if (password.length < 6) return Alert.alert('Enter a password with at least 6 characters');

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    setLoading(false);

    if (error) return Alert.alert('Login failed', error.message);

    router.replace('/');
  };

  const handleAuth = () => {
    if (mode === 'signUp') {
      if (codeVerified) return handleSetSignupPassword();
      return codeSent ? handleVerifySignupCode() : handleSendSignupCode();
    }

    return handlePasswordLogin();
  };

  const toggleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setCode('');
    setCodeSent(false);
    setCodeVerified(false);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <View style={s.top}>
          <Text style={s.brand}>sovrn</Text>
          <Text style={s.tagline}>Control your data. Share on your terms.</Text>
        </View>

        <View style={s.form}>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setCodeSent(false);
              setCodeVerified(false);
              setCode('');
            }}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            style={s.input}
          />

          {mode === 'signIn' ? (
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!loading}
              style={s.input}
            />
          ) : codeVerified ? (
            <>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                editable={!loading}
                style={s.input}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                editable={!loading}
                style={s.input}
              />
            </>
          ) : codeSent ? (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Email code"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!loading}
              style={s.input}
            />
          ) : (
            <Text style={s.helperText}>
              We will send a one-time code to this email to create your account.
            </Text>
          )}

          <Pressable
            onPress={handleAuth}
            disabled={loading}
            style={({ pressed }) => [
              s.button,
              loading && s.buttonDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={s.buttonText}>
              {loading
                ? mode === 'signUp'
                  ? codeVerified
                    ? 'Saving password...'
                    : codeSent
                    ? 'Verifying code...'
                    : 'Sending code...'
                  : 'Signing in...'
                : mode === 'signUp'
                  ? codeVerified
                    ? 'Save Password'
                    : codeSent
                    ? 'Verify Code'
                    : 'Send Sign-Up Code'
                  : 'Sign In'}
            </Text>
          </Pressable>

          {mode === 'signUp' && codeSent && !codeVerified && (
            <Pressable
              onPress={handleSendSignupCode}
              disabled={loading}
              style={({ pressed }) => [s.modeButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={s.modeButtonText}>Send a new code</Text>
            </Pressable>
          )}

          <Pressable
            onPress={toggleMode}
            disabled={loading}
            style={({ pressed }) => [s.modeButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={s.modeButtonText}>
              {mode === 'signIn'
                ? 'New to Sovrn? Create an account'
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>

        <Text style={s.footer}>
          By continuing you agree to our{' '}
          <Text style={s.footerLink} onPress={() => Linking.openURL('https://getsovrn.com/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={s.footerLink} onPress={() => Linking.openURL('https://getsovrn.com/privacy')}>
            Privacy Policy
          </Text>
          .
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
  modeButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: font.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  modeButtonText: {
    color: colors.accent,
    fontSize: font.sm,
    fontWeight: '600',
  },

  footer: {
    color: colors.textMuted,
    fontSize: font.xs,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    lineHeight: 16,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '600',
  },
});
