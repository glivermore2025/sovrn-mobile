// app/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Sovrn Mobile</Text>
      <Text style={styles.sub}>
        ✅ App booted successfully
      </Text>
      <Text style={styles.sub}>
        Next step: data collection onboarding
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headline: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  sub: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});
