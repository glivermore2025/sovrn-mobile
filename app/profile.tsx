// app/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date string
};

type DeviceRow = {
  id: string;
  device_install_id: string;
  device_name: string | null;
  platform: string | null;
  model: string | null;
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  last_seen_at: string;
  created_at: string;
};

function isAtLeast13(dobIso: string) {
  // dobIso: 'YYYY-MM-DD'
  const [y, m, d] = dobIso.split('-').map(Number);
  if (!y || !m || !d) return false;
  const dob = new Date(Date.UTC(y, m - 1, d));
  const now = new Date();

  // Compute age in years precisely (month/day aware)
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age >= 13;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, initializing } = useAuth();

  const email = session?.user.email ?? '';
  const userId = session?.user.id ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD

  const [devices, setDevices] = useState<DeviceRow[]>([]);

  const canSave = useMemo(() => {
    // If DOB is entered, enforce format + 13+
    if (dob.trim().length > 0) {
      const okFormat = /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
      if (!okFormat) return false;
      if (!isAtLeast13(dob.trim())) return false;
    }
    return true;
  }, [dob]);

  useEffect(() => {
    if (initializing) return;
    if (!session) {
      router.replace('/login');
      return;
    }

    const load = async () => {
      setLoading(true);

      const [{ data: profileData, error: profileErr }, { data: deviceData, error: deviceErr }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name, phone, date_of_birth')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_devices')
            .select(
              'id, device_install_id, device_name, platform, model, os_name, os_version, app_version, last_seen_at, created_at'
            )
            .eq('user_id', userId)
            .order('last_seen_at', { ascending: false }),
        ]);

      if (profileErr) console.warn(profileErr.message);
      if (deviceErr) console.warn(deviceErr.message);

      const p = profileData as ProfileRow | null;
      setFullName(p?.full_name ?? '');
      setPhone(p?.phone ?? '');
      setDob(p?.date_of_birth ?? '');

      setDevices((deviceData as DeviceRow[]) ?? []);

      setLoading(false);
    };

    load();
  }, [initializing, session, userId, router]);

  const saveProfile = async () => {
    if (!session) return;

    const dobTrim = dob.trim();
    if (dobTrim.length > 0) {
      const okFormat = /^\d{4}-\d{2}-\d{2}$/.test(dobTrim);
      if (!okFormat) return Alert.alert('Invalid DOB', 'Use YYYY-MM-DD format.');
      if (!isAtLeast13(dobTrim)) {
        return Alert.alert('Age requirement', 'You must be 13+ to use Sovrn.');
      }
    }

    setSaving(true);

    const payload: Partial<ProfileRow> = {
      user_id: userId,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      date_of_birth: dobTrim ? dobTrim : null,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });

    setSaving(false);

    if (error) return Alert.alert('Save failed', error.message);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#0a0a0a', padding: 24 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
        Profile
      </Text>

      <Text style={{ color: '#9ca3af', marginBottom: 16 }}>
        This information helps with identity verification and future 2FA.
      </Text>

      {/* Email (read-only) */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Email</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 12,
            padding: 12,
            backgroundColor: '#111827',
          }}
        >
          <Text style={{ color: '#fff' }}>{email || '—'}</Text>
        </View>
      </View>

      {/* Full name */}
      <Field label="Full name" value={fullName} setValue={setFullName} placeholder="John Smith" />

      {/* Phone */}
      <Field
        label="Phone number"
        value={phone}
        setValue={setPhone}
        placeholder="+1 555 123 4567"
        keyboardType="phone-pad"
      />

      {/* DOB */}
      <Field
        label="Date of birth"
        value={dob}
        setValue={setDob}
        placeholder="YYYY-MM-DD"
      />
      {dob.trim().length > 0 && !canSave && (
        <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: -6, marginBottom: 12 }}>
          DOB must be in YYYY-MM-DD format and you must be 13+.
        </Text>
      )}

      <Pressable
        onPress={saveProfile}
        disabled={saving || loading || !canSave}
        style={{
          backgroundColor: saving || loading || !canSave ? '#374151' : '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 6,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '800' }}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Text>
      </Pressable>

      {/* Devices log */}
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
        Devices log
      </Text>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>
        Devices that have signed in to your account. This helps audit datasets linked to you.
      </Text>

      {devices.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>No devices found yet.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {devices.map((d) => (
            <View
              key={d.id}
              style={{
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 12,
                padding: 12,
                backgroundColor: '#111827',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {(d.device_name || d.model || 'Unknown device') +
                  (d.platform ? ` (${d.platform})` : '')}
              </Text>

              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 12 }}>
                Install ID: {d.device_install_id}
              </Text>

              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 12 }}>
                OS: {(d.os_name || '—') + (d.os_version ? ` ${d.os_version}` : '')}
              </Text>

              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 12 }}>
                Last seen: {new Date(d.last_seen_at).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        style={{
          color: '#fff',
          borderColor: '#374151',
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          backgroundColor: '#111827',
        }}
      />
    </View>
  );
}
