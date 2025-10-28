// app/index.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDataContext } from '../src/context/DataContext';

export default function DashboardScreen() {
  const { contributing, snapshot, refreshSnapshot } = useDataContext();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Data Value</Text>

      <Text style={styles.value}>$0.00</Text>
      <Text style={styles.smallNote}>Lifetime earnings (coming soon)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contribution Status</Text>
        <Text style={styles.cardBody}>
          {contributing ? '✅ Contributing to Sovrn pools' : '❌ Not contributing'}
        </Text>
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
          </>
        ) : (
          <Text style={styles.cardBody}>No snapshot yet</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={refreshSnapshot}>
          <Text style={styles.buttonText}>Refresh Snapshot</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, styles.syncButton]}>
        <Text style={styles.buttonText}>Sync Now (upload)</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        We never sell you. We sell aggregated pools. You get paid.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '600', marginBottom: 6 },
  value: { color: '#38bdf8', fontSize: 36, fontWeight: '700' },
  smallNote: { color: '#6b7280', fontSize: 12, marginBottom: 20 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardBody: { color: '#d1d5db', fontSize: 14, marginBottom: 4 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButton: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disclaimer: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});
