
// src/screens/DataDebug.tsx

import { View, Text, ScrollView, Button } from 'react-native';
import { useState } from 'react';
import { collectDeviceData } from '../services/dataCollector';

export default function DataDebug() {
  const [data, setData] = useState<any>(null);

  const handleCollect = async () => {
    const result = await collectDeviceData();
    setData(result);
  };

  return (
    <ScrollView className="bg-black p-6 min-h-screen text-white">
      <Text className="text-2xl font-bold mb-4">Device Data Collector</Text>
      <Button title="Collect Device Info" onPress={handleCollect} />
      {data && (
        <View className="mt-4 space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <Text key={key} className="text-sm text-white">
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
