import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useDataContext } from '../src/context/DataContext';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, spacing, radius, font } from '../src/theme';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { demographics, persistDemographics } = useDataContext();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(session?.user?.user_metadata?.display_name ?? '');
  const [saving, setSaving] = useState(false);

  const email = session?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Profile updated.');
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.email}>{email}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Display Name</Text>
        <TextInput
          style={s.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <SettingsRow label="Member since" value={formatDate(session?.user?.created_at)} />
          <SettingsRow label="Auth provider" value={session?.user?.app_metadata?.provider ?? 'email'} last />
        </View>
      </View>

      <TouchableOpacity
        style={s.signOutBtn}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }}
      >
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingsRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: 40 },

  avatarWrap: { alignItems: 'center', marginBottom: spacing.xxxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: font.xxl, fontWeight: '700' },
  email: { color: colors.textSecondary, fontSize: font.md },

  section: { marginBottom: spacing.xxl },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: font.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  input: {
    backgroundColor: colors.card,
    color: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.md,
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  rowLabel: { color: colors.textSecondary, fontSize: font.md },
  rowValue: { color: colors.white, fontSize: font.md, fontWeight: '500' },

  signOutBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signOutText: { color: colors.danger, fontSize: font.md, fontWeight: '600' },
});
