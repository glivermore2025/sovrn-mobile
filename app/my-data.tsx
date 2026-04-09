import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDataContext } from '../src/context/DataContext';
import { useState } from 'react';

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
    <View style={styles.container}>
      <Text style={styles.heading}>About You</Text>

      <Text style={styles.label}>Age Range</Text>
      <TextInput
        style={styles.input}
        value={draft.ageRange}
        onChangeText={(t) => setDraft({ ...draft, ageRange: t })}
        placeholder="ex: 25-34"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Industry / Role</Text>
      <TextInput
        style={styles.input}
        value={draft.industry}
        onChangeText={(t) => setDraft({ ...draft, industry: t })}
        placeholder="ex: Healthcare analytics"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Region (ZIP or state)</Text>
      <TextInput
        style={styles.input}
        value={draft.region}
        onChangeText={(t) => setDraft({ ...draft, region: t })}
        placeholder="ex: 94107 or CO"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Household Size</Text>
      <TextInput
        style={styles.input}
        value={draft.householdSize}
        onChangeText={(t) => setDraft({ ...draft, householdSize: t })}
        placeholder="ex: 2"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Devices Owned</Text>
      <View style={styles.chipRow}>
        {['iPhone', 'Android Phone', 'PS5', 'Xbox', 'EV'].map((d) => {
          const active = draft.devicesOwned.includes(d);
          return (
            <TouchableOpacity
              key={d}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleDeviceOwned(d)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        onPress={saveDemographics}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.snapshotHeader}>
        <Text style={styles.heading}>Device Snapshot</Text>
        <TouchableOpacity onPress={refreshSnapshot}>
          <Text style={styles.refreshLink}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {snapshot ? (
        <>
          <Text style={styles.meta}>Model: {snapshot.modelName ?? 'Unknown'}</Text>
          <Text style={styles.meta}>OS: {snapshot.osVersion ?? 'Unknown'}</Text>
          <Text style={styles.meta}>
            Battery:{' '}
            {snapshot.batteryLevel != null
              ? Math.round(snapshot.batteryLevel * 100) + '%'
              : 'Unknown'}{' '}
            {snapshot.lowPowerMode ? '(Low Power)' : ''}
          </Text>
          <Text style={styles.meta}>
            Captured: {new Date(snapshot.timestamp).toLocaleString()}
          </Text>
        </>
      ) : (
        <Text style={styles.meta}>No snapshot captured yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { color: '#fff', fontSize: 14, fontWeight: '500', marginTop: 12 },
  input: {
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: {
    borderColor: '#4b5563',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  chipText: { color: '#d1d5db', fontSize: 12 },
  chipTextActive: { color: '#000', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 24,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshLink: { color: '#38bdf8', fontSize: 13 },
  meta: { color: '#9ca3af', fontSize: 13, marginBottom: 4 },
});
