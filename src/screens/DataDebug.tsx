
// src/screens/DataDebug.tsx

import { View, Text, ScrollView, Button, StyleSheet } from 'react-native';
import { useState } from 'react';
import { collectDeviceData } from '../services/dataCollector';

export default function DataDebug() {
  const [data, setData] = useState<any>(null);

  const handleCollect = async () => {
    const result = await collectDeviceData();
    setData(result);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Device Data Collector</Text>
      <Button title="Collect Device Info" onPress={handleCollect} />
      {data && (
        <View style={styles.results}>
          {Object.entries(data).map(([key, value]) => (
            <Text key={key} style={styles.resultText}>
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  results: {
    marginTop: 16,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
});
