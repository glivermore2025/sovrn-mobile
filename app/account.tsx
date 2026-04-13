import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, font } from '../src/theme';

export default function Account() {
  const { session, initializing } = useAuth();
  const router = useRouter();

  if (initializing) {
    return (
      <View style={s.center}>
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    router.replace('/login');
    return null;
  }

  const email = session.user.email ?? '(no email)';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <View style={s.container}>
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      <Text style={s.title}>Account</Text>

      <View style={s.card}>
        <Text style={s.label}>Email</Text>
        <Text style={s.value}>{email}</Text>
      </View>

      <Pressable
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }}
        style={({ pressed }) => [s.signOutBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={s.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxl },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: font.md },

  avatarWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: font.xxl, fontWeight: '700' },

  title: {
    color: colors.white,
    fontSize: font.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  label: { color: colors.textSecondary, fontSize: font.sm, marginBottom: spacing.xs },
  value: { color: colors.white, fontSize: font.lg, fontWeight: '500' },

  signOutBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: colors.danger, fontSize: font.md, fontWeight: '600' },
});
