/**
 * Module-specific event collectors.
 * Each function collects data for a specific module and returns the event payload.
 */

import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Dimensions, Platform } from 'react-native';
import type {
  DeviceHealthEventPayload,
  LocationCoarseEventPayload,
  ActivityRhythmEventPayload,
  DemographicsEventPayload,
} from '../types/dataModules';

/**
 * Collect device health data.
 * Includes hardware/OS info, battery, screen dimensions.
 */
export async function collectDeviceHealthPayload(): Promise<DeviceHealthEventPayload> {
  const { width, height } = Dimensions.get('window');

  let batteryLevel: number | null = null;
  let isCharging: boolean | null = null;
  let lowPowerMode: boolean | null = null;

  try {
    batteryLevel = await Battery.getBatteryLevelAsync();
    const powerState = await Battery.getPowerStateAsync();
    const bs = (powerState as any)?.batteryState;
    isCharging =
      bs === Battery.BatteryState.CHARGING || bs === Battery.BatteryState.FULL
        ? true
        : bs === Battery.BatteryState.UNPLUGGED
          ? false
          : null;
    lowPowerMode = (powerState as any)?.lowPowerMode ?? null;
  } catch (err) {
    console.warn('collectDeviceHealthPayload battery error:', err);
  }

  return {
    model_name: Device.modelName ?? null,
    os_name: Device.osName ?? null,
    os_version: Device.osVersion ?? null,
    brand: Device.brand ?? null,
    device_type: Device.deviceType != null ? String(Device.deviceType) : null,
    total_memory: Device.totalMemory ?? null,
    battery_level: batteryLevel,
    is_charging: isCharging,
    low_power_mode: lowPowerMode,
    screen_width: Math.round(width),
    screen_height: Math.round(height),
    platform: Platform.OS,
    app_collected_at: new Date().toISOString(),
  };
}

/**
 * Collect coarse location data (city/region level, not precise).
 * Sanitizes precise location (lat/lon, street, exact place name).
 * Returns null if location permission not granted or unavailable.
 */
export async function collectLocationCoarsePayload(): Promise<LocationCoarseEventPayload | null> {
  try {
    let Location: any = null;

    try {
      const module = await import('expo-location');
      Location = module?.default ?? module;
    } catch (error) {
      console.warn('collectLocationCoarsePayload: expo-location unavailable');
      return null;
    }

    if (
      !Location ||
      typeof Location.requestForegroundPermissionsAsync !== 'function'
    ) {
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

    // Only include coarse location fields; exclude precise location
    return {
      city: place.city ?? null,
      region: place.region ?? null,
      postal_code: place.postalCode ?? null,
      country: place.country ?? null,
      accuracy_bucket: postalBucketFromAccuracy(position.coords.accuracy),
      platform: Platform.OS,
      app_collected_at: new Date().toISOString(),
      // SANITIZED OUT: latitude, longitude, street, name
    };
  } catch (error) {
    console.warn('collectLocationCoarsePayload error:', error);
    return null;
  }
}

/**
 * Convert accuracy (meters) to a coarse bucket for privacy.
 * E.g., 50m -> "city_block", 5km -> "neighborhood"
 */
function postalBucketFromAccuracy(accuracy: number | null): string {
  if (accuracy === null || accuracy === undefined) return 'unknown';
  if (accuracy < 500) return 'city_area';
  if (accuracy < 5000) return 'metro_area';
  return 'region';
}

/**
 * Collect activity rhythm data (aggregated app usage).
 * Returns null on non-Android or if permission not granted.
 * NOTE: Returns aggregate counts, not package-level history.
 */
export async function collectActivityRhythmPayload(): Promise<ActivityRhythmEventPayload | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    let UsageStats: any = null;

    try {
      const module = await import('react-native-usage-stats');
      UsageStats = module?.default ?? module;
    } catch {
      console.warn('collectActivityRhythmPayload: react-native-usage-stats unavailable');
      return null;
    }

    if (!UsageStats || typeof UsageStats.getAppStats !== 'function') {
      return null;
    }

    // Request permission if needed
    const permissionGranted =
      typeof UsageStats.getPermissionStatus === 'function'
        ? await UsageStats.getPermissionStatus()
        : false;

    if (!permissionGranted && typeof UsageStats.requestPermission === 'function') {
      await UsageStats.requestPermission();
    }

    const stats = await UsageStats.getAppStats();
    const appsArray = Array.isArray(stats) ? stats : [];

    // Calculate aggregates; do NOT store individual package names by default
    let totalForegroundTime = 0;
    for (const app of appsArray) {
      totalForegroundTime += app.totalTimeInForeground ?? 0;
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    return {
      apps_used_count: appsArray.length,
      total_foreground_time: totalForegroundTime,
      window_start: dayStart.toISOString(),
      window_end: now.toISOString(),
      permission_granted: permissionGranted,
      platform: Platform.OS,
      app_collected_at: now.toISOString(),
      // TODO: Consider storing anonymized package category instead of raw package names
    };
  } catch (error) {
    console.warn('collectActivityRhythmPayload error:', error);
    return null;
  }
}

/**
 * Create demographics event payload from user input.
 */
export function createDemographicsPayload(
  ageRange: string,
  industry: string,
  region: string,
  householdSize: string,
  devicesOwned: string[],
): DemographicsEventPayload {
  return {
    age_range: ageRange,
    industry,
    region,
    household_size: householdSize,
    devices_owned: devicesOwned,
    app_collected_at: new Date().toISOString(),
  };
}
