import React from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { useDataContext } from '../src/context/DataContext';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function IndexScreen() {
  const router = useRouter();
  const { snapshot, contributing, syncing, lastSyncedAt, refreshSnapshot, syncNow } =
    useDataContext();
  const { session, initializing } = useAuth();

  React.useEffect(() => {
    if (!initializing && !session) {
      router.replace('/login');
    }
  }, [initializing, session, router]);

  if (initializing || !session) return null;

  const email = session.user.email ?? '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.authHeader}>
        <Text style={styles.authText}>Signed in as</Text>
        <Text style={styles.authEmail}>{email}</Text>
        <View style={styles.authLinks}>
          <Pressable
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
          >
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profile')}>
            <Text style={styles.link}>Profile</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/my-data')}>
            <Text style={styles.link}>My Data</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.heading}>Your Data Value</Text>
      <Text style={styles.earningsValue}>$0.00</Text>
      <Text style={styles.smallNote}>Lifetime earnings (coming soon)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contribution Status</Text>
        <Text style={styles.cardBody}>
          {contributing ? 'Contributing to Sovrn pools' : 'Not contributing yet'}
        </Text>
        {!contributing && (
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={styles.ctaLink}>Enable in Settings</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last Device Snapshot</Text>
        {snapshot ? (
          <>
            <Text style={styles.cardBody}>Device: {snapshot.modelName ?? 'Unknown'}</Text>
            <Text style={styles.cardBody}>OS: {snapshot.osVersion ?? 'Unknown'}</Text>
            <Text style={styles.cardBody}>
              Battery:{' '}
              {snapshot.batteryLevel != null
                ? Math.round(snapshot.batteryLevel * 100) + '%'
                : 'Unknown'}
              {snapshot.lowPowerMode ? ' (Low Power)' : ''}
            </Text>
            <Text style={styles.cardBody}>Network: {snapshot.networkType ?? 'Unknown'}</Text>
          </>
        ) : (
          <Text style={styles.cardBody}>No snapshot yet</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={refreshSnapshot}>
          <Text style={styles.buttonText}>Refresh Snapshot</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.syncButton, syncing && { opacity: 0.5 }]}
        onPress={syncNow}
        disabled={syncing}
      >
        <Text style={styles.buttonText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
      </TouchableOpacity>

      {lastSyncedAt && (
        <Text style={styles.syncNote}>
          Last synced: {new Date(lastSyncedAt).toLocaleString()}
        </Text>
      )}

      <Text style={styles.disclaimer}>
        We never sell you. We sell aggregated pools. You get paid.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  authHeader: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  authText: { color: '#9ca3af', fontSize: 12 },
  authEmail: { color: 'white', fontSize: 14, fontWeight: '500' },
  authLinks: { flexDirection: 'row', gap: 16, marginTop: 8 },
  signOut: { color: '#ef4444', fontSize: 12 },
  link: { color: '#60a5fa', fontSize: 12 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '600', marginBottom: 6 },
  earningsValue: { color: '#38bdf8', fontSize: 36, fontWeight: '700' },
  smallNote: { color: '#6b7280', fontSize: 12, marginBottom: 20 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardBody: { color: '#d1d5db', fontSize: 14, marginBottom: 4 },
  ctaLink: { color: '#38bdf8', fontSize: 13, marginTop: 8 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButton: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  syncNote: { color: '#6b7280', fontSize: 11, textAlign: 'center', marginTop: 6 },
  disclaimer: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});
