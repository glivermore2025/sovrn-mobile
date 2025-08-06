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
    deviceType: Device.deviceType,
    totalMemory: Device.totalMemory,
    installTime: Device.installTime,
    networkType: network.type,
    isInternetReachable: network.isInternetReachable,
    screen: { width, height },
    collectedAt: new Date().toISOString(),
  };
}

