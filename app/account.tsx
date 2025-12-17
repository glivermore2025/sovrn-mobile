import { View, Text, Pressable } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function Account() {
  const { session, initializing } = useAuth();
  const router = useRouter();

  if (initializing) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: '#fff' }}>Loading…</Text>
      </View>
    );
  }

  if (!session) {
    // If not logged in, go to login screen
    router.replace('/login');
    return null;
  }

  const email = session.user.email ?? '(no email)';

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Account</Text>
      <Text style={{ color: '#aaa' }}>Signed in as</Text>
      <Text style={{ color: '#fff', fontSize: 16 }}>{email}</Text>

      <Pressable
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
