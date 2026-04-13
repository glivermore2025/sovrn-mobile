import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useDataContext } from '../src/context/DataContext';
import { useState } from 'react';
import { colors, spacing, radius, font } from '../src/theme';

export default function MyDataScreen() {
  const { demographics, persistDemographics, snapshot, refreshSnapshot } = useDataContext();

  const [draft, setDraft] = useState(demographics);
  const [saving, setSaving] = useState(false);

  async function saveDemographics() {
    setSaving(true);
    const ok = await persistDemographics(draft);
    setSaving(false);
    if (ok) {
      Alert.alert('Saved', 'Your profile has been synced.');
    } else {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  }

  function toggleDeviceOwned(deviceName: string) {
    setDraft((prev) => {
      const has = prev.devicesOwned.includes(deviceName);
      return {
        ...prev,
        devicesOwned: has
          ? prev.devicesOwned.filter((d) => d !== deviceName)
          : [...prev.devicesOwned, deviceName],
      };
    });
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.title}>My Data</Text>
      <Text style={s.subtitle}>Tell us about yourself to increase your data value.</Text>

      <View style={s.card}>
        <Text style={s.fieldLabel}>Age Range</Text>
        <TextInput
          style={s.input}
          value={draft.ageRange}
          onChangeText={(t) => setDraft({ ...draft, ageRange: t })}
          placeholder="e.g. 25-34"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={s.fieldLabel}>Industry / Role</Text>
        <TextInput
          style={s.input}
          value={draft.industry}
          onChangeText={(t) => setDraft({ ...draft, industry: t })}
          placeholder="e.g. Healthcare analytics"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={s.fieldLabel}>Region</Text>
        <TextInput
          style={s.input}
          value={draft.region}
          onChangeText={(t) => setDraft({ ...draft, region: t })}
          placeholder="e.g. 94107 or CO"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={s.fieldLabel}>Household Size</Text>
        <TextInput
          style={s.input}
          value={draft.householdSize}
          onChangeText={(t) => setDraft({ ...draft, householdSize: t })}
          placeholder="e.g. 2"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Text style={s.sectionLabel}>Devices Owned</Text>
      <View style={s.chipRow}>
        {['iPhone', 'Android Phone', 'PS5', 'Xbox', 'EV'].map((d) => {
          const active = draft.devicesOwned.includes(d);
          return (
            <TouchableOpacity
              key={d}
              style={[s.chip, active && s.chipActive]}
              onPress={() => toggleDeviceOwned(d)}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[s.saveBtn, saving && { opacity: 0.4 }]}
        onPress={saveDemographics}
        disabled={saving}
      >
        <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </TouchableOpacity>

      <View style={s.snapshotSection}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Device Snapshot</Text>
          <TouchableOpacity onPress={refreshSnapshot}>
            <Text style={s.refreshLink}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {snapshot ? (
          <View style={s.snapshotCard}>
            <SnapshotRow label="Model" value={snapshot.modelName ?? 'Unknown'} />
            <SnapshotRow label="OS" value={snapshot.osVersion ?? 'Unknown'} />
            <SnapshotRow
              label="Battery"
              value={
                snapshot.batteryLevel != null
                  ? Math.round(snapshot.batteryLevel * 100) + '%'
                  : 'Unknown'
              }
            />
            <SnapshotRow
              label="Captured"
              value={new Date(snapshot.timestamp).toLocaleString()}
              last
            />
          </View>
        ) : (
          <View style={s.snapshotCard}>
            <Text style={s.emptyText}>No snapshot captured yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SnapshotRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.snapRow, !last && s.snapRowBorder]}>
      <Text style={s.snapLabel}>{label}</Text>
      <Text style={s.snapValue}>{value}</Text>
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
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: font.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: font.md,
  },

  sectionLabel: {
    color: colors.textSecondary,
    fontSize: font.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  chip: {
    borderColor: colors.surfaceHover,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textSecondary, fontSize: font.sm },
  chipTextActive: { color: colors.bg, fontWeight: '600' },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  saveBtnText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  snapshotSection: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.white, fontSize: font.lg, fontWeight: '600' },
  refreshLink: { color: colors.accent, fontSize: font.sm, fontWeight: '500' },

  snapshotCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  snapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  snapRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  snapLabel: { color: colors.textSecondary, fontSize: font.md },
  snapValue: { color: colors.white, fontSize: font.md, fontWeight: '500' },
  emptyText: { color: colors.textTertiary, fontSize: font.md, textAlign: 'center', padding: spacing.lg },
});
