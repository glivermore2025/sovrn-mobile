import { View, Text, Pressable } from 'react-native';
import * as Linking from 'expo-linking';

export default function CheckEmail() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Check your email</Text>
      <Text style={{ color: '#aaa' }}>
        Tap the magic link we sent you to finish signing in.
      </Text>

      <Pressable
        onPress={() => Linking.openURL('mailto:')}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>Open email</Text>
      </Pressable>
    </View>
  );
}
