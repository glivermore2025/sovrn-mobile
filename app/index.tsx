// app/index.tsx
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useData } from '../src/context/DataContext';

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value ?? '—')}</Text>
    </View>
  );
}

export default function IndexScreen() {
  const data = useData();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Your Device Snapshot</Text>
      <Text style={styles.subtext}>
        This is the kind of info Sovrn will eventually package (with your consent)
        to earn you money in pooled datasets.
      </Text>

      <View style={styles.card}>
        <Row label="Manufacturer" value={data.manufacturer} />
        <Row label="Model" value={data.modelName} />
        <Row label="OS" value={data.osName} />
        <Row label="OS Version" value={data.osVersion} />
        <Row
          label="Battery Level"
          value={
            data.batteryLevel !== null
              ? `${Math.round((data.batteryLevel ?? 0) * 100)}%`
              : '—'
          }
        />
        <Row
          label="Charging"
          value={
            data.isCharging === null
              ? '—'
              : data.isCharging
                ? 'Yes'
                : 'No'
          }
        />
        <Row label="Network" value={data.networkType ?? '—'} />
      </View>

      <Text style={styles.footer}>
        Soon: opt in to specific datasets, see your projected payout,
        and withdraw earnings.
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
  header: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
  },
  value: {
    color: 'white',
    fontSize: 14,
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
