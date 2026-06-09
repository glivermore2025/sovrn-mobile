// src/services/dataCollector.ts

import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Dimensions, Platform } from 'react-native';

export type LocationData = {
  timestamp: string;
  city: string | null;
  region: string | null;
  postalCodePrefix: string | null;
  country: string | null;
  accuracyBucket: string;
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

export async function collectLocationData(): Promise<LocationData | null> {
  try {
    if (
      typeof Location.requestForegroundPermissionsAsync !== 'function' ||
      typeof Location.getCurrentPositionAsync !== 'function'
    ) {
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const latitude = position.coords?.latitude;
    const longitude = position.coords?.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    let place: Record<string, any> = {};
    if (typeof Location.reverseGeocodeAsync === 'function') {
      try {
        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        place = geocoded?.[0] ?? {};
      } catch (error) {
        console.warn('collectLocationData reverse geocode failed:', error);
      }
    }

    return {
      timestamp: new Date(position.timestamp ?? Date.now()).toISOString(),
      city: place.city ?? null,
      region: place.region ?? null,
      postalCodePrefix: getPostalCodePrefix(place.postalCode),
      country: place.country ?? null,
      accuracyBucket: getCoarseAccuracyBucket(position.coords.accuracy ?? null),
    };
  } catch (error) {
    console.warn('collectLocationData error:', error);
    return null;
  }
}

function getPostalCodePrefix(postalCode?: string | null) {
  if (!postalCode) return null;
  return postalCode.replace(/\s+/g, '').slice(0, 3).toUpperCase();
}

function getCoarseAccuracyBucket(accuracy: number | null) {
  if (accuracy === null) return 'unknown';
  if (accuracy < 500) return 'city_area';
  if (accuracy < 5000) return 'metro_area';
  return 'region';
}

export async function collectAppUsageData(): Promise<AppUsageData | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  if (Constants.appOwnership === 'expo') return null;

  // react-native-usage-stats is a custom native module and is not available in
  // Expo Go. Keep this disabled until the app runs in a custom dev/store build.
  return null;
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

