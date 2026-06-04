/**
 * Module-specific event collectors.
 * Each function collects data for a specific module and returns the event payload.
 */

import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
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
      console.warn('collectLocationCoarsePayload import failed:', error);
      return null;
    }

    if (
      !Location ||
      typeof Location.requestForegroundPermissionsAsync !== 'function' ||
      typeof Location.getCurrentPositionAsync !== 'function'
    ) {
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const balancedAccuracy = Location.Accuracy?.Balanced;
    const positionOptions =
      typeof balancedAccuracy === 'number' ? { accuracy: balancedAccuracy } : {};
    const position = await Location.getCurrentPositionAsync(positionOptions);
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
        console.warn('collectLocationCoarsePayload reverse geocode failed:', error);
      }
    }

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

  if (Constants.appOwnership === 'expo') return null;

  // react-native-usage-stats is a custom native module and is not available in
  // Expo Go. Keep this disabled until the app runs in a custom dev/store build.
  return null;
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
