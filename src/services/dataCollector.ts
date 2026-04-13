// src/services/dataCollector.ts

import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Dimensions } from 'react-native';

export async function collectDeviceData() {
  const network = await Network.getNetworkStateAsync();
  const { width, height } = Dimensions.get('window');

  return {
    osName: Device.osName,
    osVersion: Device.osVersion,
    brand: Device.brand,
    model: Device.modelName,
    deviceName: Device.deviceName,
    deviceType: String(Device.deviceType),
    totalMemory: Device.totalMemory,
    networkType: network.type,
    isConnected: network.isConnected,
    isInternetReachable: network.isInternetReachable,
    screen: {
      width,
      height,
      scale: Dimensions.get('window').scale,
    },
    collectedAt: new Date().toISOString(),
  };
}

