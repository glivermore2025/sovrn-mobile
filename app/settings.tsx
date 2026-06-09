import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDataContext } from '../src/context/DataContext';
import { useEffect, useState, useCallback } from 'react';
import { colors, spacing, radius, font } from '../src/theme';
import {
  getDeviceInstallId,
  getDeviceModulePermissions,
} from '../src/lib/permissions';
import {
  getSessionUserId,
} from '../src/services/syncService';
import { supabase } from '../src/lib/supabase';
import type { ModuleKey } from '../src/types/dataModules';

type ModulePermissionDraft = {
  can_collect: boolean;
  can_sell: boolean;
};

const MODULE_DESCRIPTIONS: Record<ModuleKey, { title: string; desc: string }> = {
  connectivity: {
    title: 'Network Activity',
    desc: 'Your network type, connectivity status, and carrier information.',
  },
  device_health: {
    title: 'Device Health',
    desc: 'Battery level, OS version, device model, memory, and screen size.',
  },
  location_coarse: {
    title: 'Location (City Level)',
    desc: 'City, region, and country - never precise street address.',
  },
  activity_rhythm: {
    title: 'App Usage Patterns',
    desc: 'How many apps you use and total daily foreground time.',
  },
  demographics: {
    title: 'Demographics',
    desc: 'Age, industry, region, household info for better data matching.',
  },
};

export default function SettingsScreen() {
  const { consent, persistConsent } = useDataContext();
  const [draft, setDraft] = useState(consent);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'consent' | 'modules'>('modules');
  const [modules, setModules] = useState<Record<ModuleKey, ModulePermissionDraft>>({
    connectivity: { can_collect: false, can_sell: false },
    device_health: { can_collect: false, can_sell: false },
    activity_rhythm: { can_collect: false, can_sell: false },
    demographics: { can_collect: false, can_sell: false },
    location_coarse: { can_collect: false, can_sell: false },
  });
  const [moduleSaving, setModuleSaving] = useState(false);

  useEffect(() => {
    setDraft(consent);
  }, [consent]);

  // Load module permissions on mount
  useEffect(() => {
    const loadModulePerms = async () => {
      try {
        const userId = await getSessionUserId();
        const deviceInstallId = getDeviceInstallId();
        if (!userId) return;

        const { data } = await supabase
          .from('user_module_permissions')
          .select('module_key, can_collect, can_sell')
          .eq('user_id', userId)
          .eq('device_install_id', deviceInstallId);

        if (data) {
          const newModules = { ...modules };
          for (const row of data) {
            const key = row.module_key as ModuleKey;
            if (key in newModules) {
              newModules[key] = {
                can_collect: row.can_collect,
                can_sell: row.can_sell,
              };
            }
          }
          setModules(newModules);
        }
      } catch (err) {
        console.warn('Failed to load module permissions:', err);
      }
    };
    loadModulePerms();
  }, []);

  const dirty =
    draft.deviceInfo !== consent.deviceInfo ||
    draft.demographics !== consent.demographics ||
    draft.usageTelemetry !== consent.usageTelemetry ||
    draft.locationData !== consent.locationData ||
    draft.appUsage !== consent.appUsage;

  async function handleSaveConsent() {
    setSaving(true);
    const ok = await persistConsent(draft);
    setSaving(false);
    if (ok) {
      Alert.alert('Saved', 'Your consent preferences have been updated.');
    } else {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  }

  const handleModuleCollectToggle = useCallback((moduleKey: ModuleKey, value: boolean) => {
    setModules((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        can_collect: value,
        // If turning off collect, also turn off sell
        can_sell: value ? prev[moduleKey].can_sell : false,
      },
    }));
  }, []);

  const handleModuleSellToggle = useCallback((moduleKey: ModuleKey, value: boolean) => {
    setModules((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        // Can only enable sell if collect is already enabled
        can_sell: prev[moduleKey].can_collect ? value : false,
      },
    }));
  }, []);

  async function handleSaveModules() {
    setModuleSaving(true);
    try {
      const userId = await getSessionUserId();
      const deviceInstallId = getDeviceInstallId();
      if (!userId) {
        Alert.alert('Error', 'Not logged in');
        setModuleSaving(false);
        return;
      }

      const updates = Object.entries(modules).map(([moduleKey, perms]) => ({
        user_id: userId,
        device_install_id: deviceInstallId,
        module_key: moduleKey,
        can_collect: perms.can_collect,
        can_sell: perms.can_sell,
        consent_version: 'v1.0',
      }));

      const { error } = await supabase
        .from('user_module_permissions')
        .upsert(updates, { onConflict: 'user_id,device_install_id,module_key' });

      if (error) {
        console.warn('Save modules error:', error.message);
        Alert.alert('Error', 'Could not save module settings.');
      } else {
        Alert.alert('Saved', 'Your module permissions have been updated.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setModuleSaving(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.title}>Settings</Text>

      {/* Tab Selector */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'modules' && s.tabActive]}
          onPress={() => setTab('modules')}
        >
          <Text style={[s.tabText, tab === 'modules' && s.tabTextActive]}>
            Module Permissions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'consent' && s.tabActive]}
          onPress={() => setTab('consent')}
        >
          <Text style={[s.tabText, tab === 'consent' && s.tabTextActive]}>
            Legacy Consent
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'modules' ? (
        <>
          <Text style={s.subtitle}>
            Choose which data modules Sovrn can collect and include in aggregated marketplace insights.
          </Text>

          <View style={s.card}>
            {(Object.keys(modules) as ModuleKey[]).map((moduleKey, idx) => (
              <View key={moduleKey}>
                <ModulePermissionRow
                  moduleKey={moduleKey}
                  title={MODULE_DESCRIPTIONS[moduleKey].title}
                  description={MODULE_DESCRIPTIONS[moduleKey].desc}
                  canCollect={modules[moduleKey].can_collect}
                  canSell={modules[moduleKey].can_sell}
                  onCollectToggle={(v) =>
                    handleModuleCollectToggle(moduleKey, v)
                  }
                  onSellToggle={(v) => handleModuleSellToggle(moduleKey, v)}
                />
                {idx < Object.keys(modules).length - 1 && (
                  <View style={s.divider} />
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, moduleSaving && { opacity: 0.4 }]}
            onPress={handleSaveModules}
            disabled={moduleSaving}
          >
            <Text style={s.saveBtnText}>
              {moduleSaving ? 'Saving...' : 'Save Module Permissions'}
            </Text>
          </TouchableOpacity>

          <View style={s.infoCard}>
            <Text style={s.infoIcon}>ℹ️</Text>
            <Text style={s.infoText}>
              - "Collect" enables Sovrn to gather this data from your device.
              {'\n'}- "Share" allows Sovrn to include de-identified, aggregated outputs from this module in marketplace insights.
              {'\n'}- You cannot share a module unless collection is enabled first.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={s.subtitle}>
            Choose what you contribute (legacy). Change anytime.
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
              onPress={handleSaveConsent}
              disabled={saving}
            >
              <Text style={s.saveBtnText}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={s.infoCard}>
            <Text style={s.infoIcon}>🔒</Text>
            <Text style={s.infoText}>
              Your data is anonymized and aggregated before being included in
              pooled datasets. We never provide buyers with individual records.
            </Text>
          </View>
        </>
      )}
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

function ModulePermissionRow({
  moduleKey,
  title,
  description,
  canCollect,
  canSell,
  onCollectToggle,
  onSellToggle,
}: {
  moduleKey: ModuleKey;
  title: string;
  description: string;
  canCollect: boolean;
  canSell: boolean;
  onCollectToggle: (v: boolean) => void;
  onSellToggle: (v: boolean) => void;
}) {
  return (
    <View style={s.moduleRow}>
      <View style={s.moduleHeader}>
        <Text style={s.moduleTitle}>{title}</Text>
        <Text style={s.moduleDesc}>{description}</Text>
      </View>
      <View style={s.moduleToggles}>
        <View style={s.moduleToggle}>
          <Text style={s.toggleLabel}>Collect</Text>
          <Switch
            value={canCollect}
            onValueChange={onCollectToggle}
            trackColor={{ true: colors.accent, false: colors.surface }}
            thumbColor={colors.white}
          />
        </View>
        <View style={s.moduleToggle}>
          <Text style={[s.toggleLabel, !canCollect && s.toggleLabelDisabled]}>
            Share
          </Text>
          <Switch
            value={canSell && canCollect}
            onValueChange={onSellToggle}
            disabled={!canCollect}
            trackColor={{ true: colors.accent, false: colors.surface }}
            thumbColor={colors.white}
          />
        </View>
      </View>
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
    marginBottom: spacing.lg,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: font.md,
    marginBottom: spacing.lg,
  },

  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: font.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.white,
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

  moduleRow: {
    paddingVertical: spacing.md,
  },
  moduleHeader: {
    marginBottom: spacing.md,
  },
  moduleTitle: {
    color: colors.white,
    fontSize: font.md,
    fontWeight: '500',
  },
  moduleDesc: {
    color: colors.textTertiary,
    fontSize: font.sm,
    marginTop: 2,
  },
  moduleToggles: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  moduleToggle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  toggleLabel: {
    color: colors.white,
    fontSize: font.sm,
    fontWeight: '500',
  },
  toggleLabelDisabled: {
    color: colors.textTertiary,
  },

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
