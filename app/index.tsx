import React from 'react';
import { Alert, ScrollView, Text, View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { useDataContext } from '../src/context/DataContext';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, radius, font } from '../src/theme';

export default function IndexScreen() {
  const router = useRouter();
  const {
    snapshot,
    contributing,
    syncing,
    lastSyncedAt,
    lastSyncFeedback,
    deviceId,
    deviceClaimRequired,
    refreshSnapshot,
    syncNow,
    claimCurrentDevice,
  } =
    useDataContext();
  const { session, initializing } = useAuth();

  React.useEffect(() => {
    if (!initializing && !session) {
      router.replace('/login');
    }
  }, [initializing, session, router]);

  if (initializing || !session) return null;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.logo}>sovrn</Text>

      <View style={s.heroCard}>
        <Text style={s.heroLabel}>Estimated Value</Text>
        <Text style={s.heroAmount}>$0.00</Text>
        <Text style={s.heroPending}>$0.00 pending</Text>
      </View>

      <View style={s.statusRow}>
        <View style={s.statusItem}>
          <View style={[s.dot, contributing ? s.dotActive : s.dotInactive]} />
          <Text style={s.statusText}>
            {contributing ? 'Contributing' : 'Not Contributing'}
          </Text>
        </View>
        <View style={s.statusItem}>
          <View
            style={[
              s.dot,
              deviceClaimRequired
                ? s.dotWarning
                : deviceId
                  ? s.dotActive
                  : s.dotInactive,
            ]}
          />
          <Text style={s.statusText}>
            {deviceClaimRequired
              ? 'Claim Required'
              : deviceId
                ? 'Device Linked'
                : 'No Device'}
          </Text>
        </View>
      </View>

      {!contributing && (
        <TouchableOpacity style={s.ctaButton} onPress={() => router.push('/settings')}>
          <Text style={s.ctaText}>Review Sharing Controls</Text>
        </TouchableOpacity>
      )}

      {deviceClaimRequired && (
        <View style={s.claimCard}>
          <Text style={s.claimTitle}>Device claim required</Text>
          <Text style={s.claimText}>
            This device was previously linked to another Sovrn account. Claim it
            for this account before syncing new device data.
          </Text>
          <Text style={s.claimFinePrint}>
            Past data stays with the account that collected it. Future data from
            this device will count for this account after you claim it.
          </Text>
          <TouchableOpacity
            style={s.claimButton}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                'Claim this device?',
                'Future data from this device will count for this account. Past data will stay with the account that collected it.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Claim Device',
                    onPress: () => {
                      void claimCurrentDevice();
                    },
                  },
                ],
              );
            }}
          >
            <Text style={s.claimButtonText}>Claim Device</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Device Snapshot</Text>
          <Pressable onPress={refreshSnapshot}>
            <Text style={s.actionLink}>Refresh</Text>
          </Pressable>
        </View>

        {snapshot ? (
          <View style={s.card}>
            <InfoRow label="Device" value={snapshot.modelName ?? 'Unknown'} />
            <InfoRow label="OS" value={snapshot.osVersion ?? 'Unknown'} />
            <InfoRow
              label="Battery"
              value={
                snapshot.batteryLevel != null
                  ? Math.round(snapshot.batteryLevel * 100) + '%'
                  : 'Unknown'
              }
            />
            <InfoRow label="Network" value={snapshot.networkType ?? 'Unknown'} last />
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.emptyText}>No snapshot captured yet</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[s.syncButton, syncing && s.buttonDisabled]}
        onPress={syncNow}
        disabled={syncing}
        activeOpacity={0.7}
      >
        <Text style={s.syncButtonText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.previewButton}
        onPress={() => router.push('/buyer')}
        activeOpacity={0.7}
      >
        <Text style={s.previewButtonText}>Buyer Preview</Text>
      </TouchableOpacity>

      {lastSyncedAt && (
        <Text style={s.syncNote}>
          Last synced {new Date(lastSyncedAt).toLocaleString()}
        </Text>
      )}

      {lastSyncFeedback && (
        <Text style={s.syncNote}>{lastSyncFeedback.message}</Text>
      )}

      <Text style={s.tagline}>Your data, your controls.</Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: 40 },

  logo: {
    color: colors.white,
    fontSize: font.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.xxl,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroLabel: { color: colors.textSecondary, fontSize: font.sm, marginBottom: spacing.xs },
  heroAmount: {
    color: colors.white,
    fontSize: font.hero,
    fontWeight: '700',
    letterSpacing: -2,
  },
  heroPending: {
    color: colors.textTertiary,
    fontSize: font.sm,
    marginTop: spacing.xs,
  },

  statusRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.accent },
  dotInactive: { backgroundColor: colors.textMuted },
  dotWarning: { backgroundColor: colors.warning },
  statusText: { color: colors.textSecondary, fontSize: font.sm },

  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ctaText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.white, fontSize: font.lg, fontWeight: '600' },
  actionLink: { color: colors.accent, fontSize: font.sm, fontWeight: '500' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  infoLabel: { color: colors.textSecondary, fontSize: font.md },
  infoValue: { color: colors.white, fontSize: font.md, fontWeight: '500' },
  emptyText: { color: colors.textTertiary, fontSize: font.md, textAlign: 'center', padding: spacing.lg },

  claimCard: {
    backgroundColor: colors.card,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  claimTitle: { color: colors.white, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.sm },
  claimText: { color: colors.textSecondary, fontSize: font.md, lineHeight: 21, marginBottom: spacing.sm },
  claimFinePrint: { color: colors.textTertiary, fontSize: font.sm, lineHeight: 19, marginBottom: spacing.md },
  claimButton: {
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimButtonText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },

  syncButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  syncButtonText: { color: colors.white, fontSize: font.md, fontWeight: '600' },
  previewButtonText: { color: colors.bg, fontSize: font.md, fontWeight: '600' },

  syncNote: {
    color: colors.textMuted,
    fontSize: font.xs,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },

  tagline: {
    color: colors.textMuted,
    fontSize: font.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
