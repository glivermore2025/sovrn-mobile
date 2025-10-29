// App.tsx
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
        Sovrn Mobile
      </Text>
      <Text style={{ color: '#888', marginTop: 8 }}>
        Base app loaded ✅
      </Text>
    </View>
  );
}
