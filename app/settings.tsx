import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDataContext } from '../src/context/DataContext';
import { useState } from 'react';

export default function SettingsScreen() {
  const { consent, persistConsent } = useDataContext();
  const [draft, setDraft] = useState(consent);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.deviceInfo !== consent.deviceInfo ||
    draft.demographics !== consent.demographics ||
    draft.usageTelemetry !== consent.usageTelemetry;

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
    <View style={styles.container}>
      <Text style={styles.heading}>Data Sharing</Text>
      <Text style={styles.subtext}>
        Choose what data you contribute to Sovrn pools. You can change these at any time.
      </Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Device Info</Text>
          <Text style={styles.rowDesc}>Model, OS, screen size, battery</Text>
        </View>
        <Switch
          value={draft.deviceInfo}
          onValueChange={(v) => setDraft({ ...draft, deviceInfo: v })}
          trackColor={{ true: '#38bdf8', false: '#374151' }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Demographics</Text>
          <Text style={styles.rowDesc}>Age, industry, region, household</Text>
        </View>
        <Switch
          value={draft.demographics}
          onValueChange={(v) => setDraft({ ...draft, demographics: v })}
          trackColor={{ true: '#38bdf8', false: '#374151' }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Usage Telemetry</Text>
          <Text style={styles.rowDesc}>Network type, charging patterns</Text>
        </View>
        <Switch
          value={draft.usageTelemetry}
          onValueChange={(v) => setDraft({ ...draft, usageTelemetry: v })}
          trackColor={{ true: '#38bdf8', false: '#374151' }}
          thumbColor="#fff"
        />
      </View>

      {dirty && (
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footer}>
        Your data is always anonymized before being included in pooled datasets.
        We never sell individual records.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  heading: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  subtext: { color: '#9ca3af', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '500' },
  rowDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  footer: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 16,
    textAlign: 'center',
  },
});
