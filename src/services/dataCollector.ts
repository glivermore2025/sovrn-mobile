// src/services/dataCollector.ts

import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Dimensions, Platform } from 'react-native';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  street: string | null;
  name: string | null;
  subregion: string | null;
};

export type AppUsageEntry = {
  packageName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  firstTimeStamp: number;
};

export type AppUsageData = {
  appsUsedCount: number;
  apps: AppUsageEntry[];
  windowStart: string;
  windowEnd: string;
  permissionGranted: boolean;
  platform: string;
};

function requireModule(moduleId: string) {
  try {
    const module = require(moduleId);
    return module?.default ?? module;
  } catch (error) {
    console.warn(`requireModule failed for ${moduleId}:`, error);
    return null;
  }
}

export async function collectLocationData(): Promise<LocationData | null> {
  try {
    let Location: any = requireModule('expo-location');
    if (!Location) {
      Location = requireModule('expo-location/build/Location');
    }
    if (!Location || typeof Location.requestForegroundPermissionsAsync !== 'function') {
      console.warn('collectLocationData warning: expo-location unavailable.');
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const geocoded = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const place = geocoded[0] ?? {};
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      timestamp: new Date(position.timestamp ?? Date.now()).toISOString(),
      city: place.city ?? null,
      region: place.region ?? null,
      postalCode: place.postalCode ?? null,
      country: place.country ?? null,
      street: place.street ?? null,
      name: place.name ?? null,
      subregion: place.subregion ?? null,
    };
  } catch (error) {
    console.warn('collectLocationData error:', error);
    return null;
  }
}

export async function collectAppUsageData(): Promise<AppUsageData | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const UsageStats = requireModule('react-native-usage-stats');
    if (!UsageStats || typeof UsageStats.checkPermission !== 'function') {
      return null;
    }

    const permissionGranted = await UsageStats.checkPermission();
    const windowEnd = Date.now();
    const windowStart = windowEnd - 1000 * 60 * 60 * 24;

    if (!permissionGranted) {
      return {
        appsUsedCount: 0,
        apps: [],
        windowStart: new Date(windowStart).toISOString(),
        windowEnd: new Date(windowEnd).toISOString(),
        permissionGranted: false,
        platform: 'android',
      };
    }

    const rawStats = await UsageStats.queryUsageStats(windowStart, windowEnd);
    if (!rawStats || !Array.isArray(rawStats)) {
      return {
        appsUsedCount: 0,
        apps: [],
        windowStart: new Date(windowStart).toISOString(),
        windowEnd: new Date(windowEnd).toISOString(),
        permissionGranted: true,
        platform: 'android',
      };
    }

    const apps = rawStats
      .map((item: any) => ({
        packageName: item.packageName,
        totalTimeInForeground: item.totalTimeInForeground ?? 0,
        lastTimeUsed: item.lastTimeUsed ?? 0,
        firstTimeStamp: item.firstTimeStamp ?? 0,
      }))
      .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);

    return {
      appsUsedCount: apps.length,
      apps,
      windowStart: new Date(windowStart).toISOString(),
      windowEnd: new Date(windowEnd).toISOString(),
      permissionGranted: true,
      platform: 'android',
    };
  } catch (error) {
    console.warn('collectAppUsageData error:', error);
    return null;
  }
}

export async function collectDeviceData() {
  const network = await Network.getNetworkStateAsync();
  const { width, height } = Dimensions.get('window');

  const [location, appUsage] = await Promise.all([
    collectLocationData(),
    collectAppUsageData(),
  ]);

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
    location,
    appUsage,
    collectedAt: new Date().toISOString(),
  };
}

