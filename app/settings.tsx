import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDataContext } from '../src/context/DataContext';
import { useEffect, useState } from 'react';
import { colors, spacing, radius, font } from '../src/theme';

export default function SettingsScreen() {
  const { consent, persistConsent } = useDataContext();
  const [draft, setDraft] = useState(consent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(consent);
  }, [consent]);

  const dirty =
    draft.deviceInfo !== consent.deviceInfo ||
    draft.demographics !== consent.demographics ||
    draft.usageTelemetry !== consent.usageTelemetry ||
    draft.locationData !== consent.locationData ||
    draft.appUsage !== consent.appUsage;

  async function handleSave() {
    setSaving(true);
    const ok = await persistConsent(draft);
    setSaving(false);
    if (ok) {
      Alert.alert('Saved', 'Your consent preferences have been updated.');
    } else {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.title}>Data Sharing</Text>
      <Text style={s.subtitle}>
        Choose what you contribute. Change anytime.
      </Text>

      <View style={s.card}>
        <ConsentToggle
          title="Device Info"
          description="Model, OS, screen size, battery, device memory"
          value={draft.deviceInfo}
          onToggle={(v) => setDraft({ ...draft, deviceInfo: v })}
        />
        <View style={s.divider} />
        <ConsentToggle
          title="Usage Telemetry"
          description="Network, charging patterns, performance"
          value={draft.usageTelemetry}
          onToggle={(v) => setDraft({ ...draft, usageTelemetry: v })}
        />
        <View style={s.divider} />
        <ConsentToggle
          title="Location Data"
          description="City/state or nearby location when allowed"
          value={draft.locationData}
          onToggle={(v) => setDraft({ ...draft, locationData: v })}
        />
        <View style={s.divider} />
        <ConsentToggle
          title="App Usage"
          description="Daily app counts and session patterns when permitted"
          value={draft.appUsage}
          onToggle={(v) => setDraft({ ...draft, appUsage: v })}
          last
        />
      </View>

      {dirty && (
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
        </TouchableOpacity>
      )}

      <View style={s.infoCard}>
        <Text style={s.infoIcon}>🔒</Text>
        <Text style={s.infoText}>
          Your data is always anonymized before being included in pooled datasets. We never sell individual records.
        </Text>
      </View>
    </ScrollView>
  );
}

function ConsentToggle({
  title,
  description,
  value,
  onToggle,
  last,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={s.toggleText}>
        <Text style={s.toggleTitle}>{title}</Text>
        <Text style={s.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.accent, false: colors.surface }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: 40 },

  title: {
    color: colors.white,
    fontSize: font.xxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: font.md,
    marginBottom: spacing.xxl,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleText: { flex: 1, marginRight: spacing.lg },
  toggleTitle: { color: colors.white, fontSize: font.md, fontWeight: '500' },
  toggleDesc: { color: colors.textTertiary, fontSize: font.sm, marginTop: 2 },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  saveBtnText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoIcon: { fontSize: 20 },
  infoText: {
    color: colors.textTertiary,
    fontSize: font.sm,
    flex: 1,
    lineHeight: 18,
  },
});
