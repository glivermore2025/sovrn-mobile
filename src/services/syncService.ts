import { supabase } from '../lib/supabase';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { LocationData, AppUsageData } from './dataCollector';
import { getDeviceModulePermissions } from '../lib/permissions';
import { ingestDeviceEvent } from '../lib/ingestDeviceEvent';
import {
  collectDeviceHealthPayload,
  collectLocationCoarsePayload,
  collectActivityRhythmPayload,
  createDemographicsPayload,
} from '../lib/eventCollectors';
import type { SyncResult } from '../types/dataModules';

export type DeviceSnapshot = {
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  brand: string | null;
  deviceType: string | null;
  totalMemory: number | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
  lowPowerMode: boolean | null;
  networkType: string | null;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  screenWidth: number;
  screenHeight: number;
  locationData: LocationData | null;
  appUsageData: AppUsageData | null;
  timestamp: string;
};

export type Demographics = {
  ageRange: string;
  industry: string;
  region: string;
  householdSize: string;
  devicesOwned: string[];
};

export type ConsentPreferences = {
  deviceInfo: boolean;
  demographics: boolean;
  usageTelemetry: boolean;
  locationData: boolean;
  appUsage: boolean;
};

export const EMPTY_DEMOGRAPHICS: Demographics = {
  ageRange: '',
  industry: '',
  region: '',
  householdSize: '',
  devicesOwned: [],
};

export const DEFAULT_CONSENT: ConsentPreferences = {
  deviceInfo: false,
  demographics: false,
  usageTelemetry: false,
  locationData: false,
  appUsage: false,
};

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export function getDeviceInstallId(): string {
  return (
    Constants.installationId ?? `${Platform.OS}-${Device.modelName ?? 'unknown'}`
  );
}

export async function collectSnapshot(
  consent: ConsentPreferences = DEFAULT_CONSENT,
): Promise<DeviceSnapshot> {
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
  } catch {}

  let networkType: string | null = null;
  let isConnected: boolean | null = null;
  let isInternetReachable: boolean | null = null;
  try {
    const net = await Network.getNetworkStateAsync();
    networkType = net?.type ?? null;
    isConnected = net?.isConnected ?? null;
    isInternetReachable = net?.isInternetReachable ?? null;
  } catch {}

  const dataCollector = await import('./dataCollector').catch((error) => {
    console.warn('Failed to load data collector module:', error);
    return null;
  });

  const [locationData, appUsageData] = await Promise.all([
    consent.locationData && dataCollector ? dataCollector.collectLocationData() : Promise.resolve(null),
    consent.appUsage && dataCollector ? dataCollector.collectAppUsageData() : Promise.resolve(null),
  ]);

  return {
    modelName: Device.modelName ?? null,
    osName: Device.osName ?? null,
    osVersion: Device.osVersion ?? null,
    brand: Device.brand ?? null,
    deviceType: Device.deviceType != null ? String(Device.deviceType) : null,
    totalMemory: Device.totalMemory ?? null,
    batteryLevel: batteryLevel ?? null,
    isCharging,
    lowPowerMode,
    networkType: networkType != null ? String(networkType) : null,
    isConnected,
    isInternetReachable,
    screenWidth: width,
    screenHeight: height,
    locationData,
    appUsageData,
    timestamp: new Date().toISOString(),
  };
}

export async function registerDevice(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const installId = getDeviceInstallId();

  const row = {
    user_id: userId,
    device_install_id: installId,
    device_platform: Platform.OS,
    device_model: Device.modelName ?? null,
    device_name: Device.deviceName ?? null,
    platform: Platform.OS,
    model: Device.modelName ?? null,
    os_name: Device.osName ?? null,
    os_version: Device.osVersion ?? null,
    app_version: Constants.expoConfig?.version ?? '1.0.0',
    last_seen_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_devices')
    .upsert(row, { onConflict: 'user_id,device_install_id' })
    .select('id')
    .single();

  if (error) {
    console.warn('registerDevice error:', error.message);
    const { data: existing } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_install_id', installId)
      .single();
    return existing?.id ?? null;
  }

  return data?.id ?? null;
}

export async function uploadSnapshot(
  deviceId: string,
  snapshot: DeviceSnapshot,
): Promise<boolean> {
  // LEGACY: This function is deprecated. Use syncAll() instead for marketplace ingestion.
  // Only kept for backwards compatibility with older code paths.
  const userId = await getSessionUserId();
  if (!userId) return false;

  const row: Record<string, unknown> = {
    user_id: userId,
    device_id: deviceId,
    battery_level: snapshot.batteryLevel,
    is_charging: snapshot.isCharging,
    network_type: snapshot.networkType,
    screen_width: Math.round(snapshot.screenWidth),
    screen_height: Math.round(snapshot.screenHeight),
    collected_at: snapshot.timestamp,
  };

  if (snapshot.locationData !== null) {
    row.location_data = snapshot.locationData;
  }
  if (snapshot.appUsageData !== null) {
    row.app_usage_data = snapshot.appUsageData;
  }

  let result = await supabase.from('device_snapshots').insert(row);
  if (result.error) {
    console.warn('uploadSnapshot error:', result.error.message);
    const fallback = await supabase.from('device_snapshots').insert({
      user_id: userId,
      device_id: deviceId,
      battery_level: snapshot.batteryLevel,
      is_charging: snapshot.isCharging,
      network_type: snapshot.networkType,
      screen_width: Math.round(snapshot.screenWidth),
      screen_height: Math.round(snapshot.screenHeight),
      collected_at: snapshot.timestamp,
    });
    if (fallback.error) {
      console.warn('uploadSnapshot fallback error:', fallback.error.message);
      return false;
    }
  }
  return true;
}

export async function saveDemographics(
  demographics: Demographics,
): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const { error } = await supabase.from('user_demographics').upsert({
    user_id: userId,
    age_range: demographics.ageRange,
    industry: demographics.industry,
    region: demographics.region,
    household_size: demographics.householdSize,
    devices_owned: demographics.devicesOwned,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('saveDemographics error:', error.message);
    return false;
  }
  return true;
}

export async function loadDemographics(): Promise<Demographics | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_demographics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    ageRange: data.age_range ?? '',
    industry: data.industry ?? '',
    region: data.region ?? '',
    householdSize: data.household_size ?? '',
    devicesOwned: data.devices_owned ?? [],
  };
}

export async function saveConsent(
  consent: ConsentPreferences,
): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const row: Record<string, unknown> = {
    user_id: userId,
    device_info: consent.deviceInfo,
    demographics: consent.demographics,
    usage_telemetry: consent.usageTelemetry,
    updated_at: new Date().toISOString(),
  };

  if (consent.locationData !== undefined) {
    row.location_data = consent.locationData;
  }
  if (consent.appUsage !== undefined) {
    row.app_usage = consent.appUsage;
  }

  let result = await supabase.from('consent_preferences').upsert(row);
  if (result.error) {
    console.warn('saveConsent error:', result.error.message);
    const fallback = await supabase.from('consent_preferences').upsert({
      user_id: userId,
      device_info: consent.deviceInfo,
      demographics: consent.demographics,
      usage_telemetry: consent.usageTelemetry,
      updated_at: new Date().toISOString(),
    });
    if (fallback.error) {
      console.warn('saveConsent fallback error:', fallback.error.message);
      return false;
    }
  }
  return true;
}

export async function loadConsent(): Promise<ConsentPreferences | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('consent_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    deviceInfo: data.device_info ?? false,
    demographics: data.demographics ?? false,
    usageTelemetry: data.usage_telemetry ?? false,
    locationData: data.location_data ?? false,
    appUsage: data.app_usage ?? false,
  };
}

/**
 * NEW: Module-based synchronization for marketplace data ingestion.
 * This is the canonical sync path for device_events.
 *
 * Process:
 * 1. Get current user
 * 2. Register device in user_devices
 * 3. Load module permissions from user_module_permissions
 * 4. Collect and ingest module events only for modules with can_collect=true
 * 5. Return detailed sync result with per-module status
 */
export async function syncAll(consent: ConsentPreferences): Promise<SyncResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { deviceRegistered: false, events: {} };
  }

  const deviceId = await registerDevice();
  if (!deviceId) {
    return { deviceRegistered: false, events: {} };
  }

  const deviceInstallId = getDeviceInstallId();
  const permissions = await getDeviceModulePermissions(userId, deviceInstallId);

  const result: SyncResult = {
    deviceRegistered: true,
    events: {},
  };

  // Collect connectivity event
  if (permissions.connectivity) {
    try {
      const state = await Network.getNetworkStateAsync();
      const payload = {
        network_type: state.type ? String(state.type).toLowerCase() : null,
        is_connected: state.isConnected ?? null,
        is_internet_reachable: state.isInternetReachable ?? null,
        carrier: (state as any)?.carrier ?? null,
        event_type: 'snapshot' as const,
        app_collected_at: new Date().toISOString(),
        platform: Platform.OS,
      };

      const success = await ingestDeviceEvent({
        userId,
        deviceInstallId,
        moduleKey: 'connectivity',
        permission: permissions.connectivity,
        payload,
      });

      result.events.connectivity = success;
    } catch (err) {
      console.warn('syncAll connectivity collection failed:', err);
      result.events.connectivity = false;
    }
  }

  // Collect device_health event
  if (permissions.device_health) {
    try {
      const payload = await collectDeviceHealthPayload();
      const success = await ingestDeviceEvent({
        userId,
        deviceInstallId,
        moduleKey: 'device_health',
        permission: permissions.device_health,
        payload,
      });
      result.events.device_health = success;
    } catch (err) {
      console.warn('syncAll device_health collection failed:', err);
      result.events.device_health = false;
    }
  }

  // Collect location_coarse event
  if (permissions.location_coarse) {
    result.events.location_coarse = false;
    try {
      if (!permissions.location_coarse.can_collect) {
        console.log('[Location] Skipping location_coarse sync: Collect is disabled.');
      } else {
        const payload = await collectLocationCoarsePayload();
        if (!payload) {
          console.warn(
            '[Location] No coarse location payload collected. Check device location permission and services.',
          );
        } else {
          console.log('[Location] Ingesting coarse location event', {
            city: payload.city,
            region: payload.region,
            country: payload.country,
            accuracy_bucket: payload.accuracy_bucket,
            can_sell_snapshot: permissions.location_coarse.can_sell,
          });

          const success = await ingestDeviceEvent({
            userId,
            deviceInstallId,
            moduleKey: 'location_coarse',
            permission: permissions.location_coarse,
            payload,
          });
          result.events.location_coarse = success;

          if (!success) {
            console.warn('[Location] location_coarse event was not inserted.');
          }
        }
      }
    } catch (err) {
      console.warn('syncAll location_coarse collection failed:', err);
      result.events.location_coarse = false;
    }
  }

  // Collect activity_rhythm event
  if (permissions.activity_rhythm) {
    try {
      const payload = await collectActivityRhythmPayload();
      if (payload) {
        const success = await ingestDeviceEvent({
          userId,
          deviceInstallId,
          moduleKey: 'activity_rhythm',
          permission: permissions.activity_rhythm,
          payload,
        });
        result.events.activity_rhythm = success;
      }
    } catch (err) {
      console.warn('syncAll activity_rhythm collection failed:', err);
      result.events.activity_rhythm = false;
    }
  }

  // Note: Demographics is handled separately via saveDemographicsWithEvent()
  // not as part of the general sync

  return result;
}

/**
 * Save demographics to both legacy table and device_events (if permitted).
 * Call this when user saves demographics from settings.
 */
export async function saveDemographicsWithEvent(
  demographics: Demographics,
): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) return false;

  // Always save to legacy table for compatibility
  const legacySaveSuccess = await saveDemographics(demographics);

  // Also ingest as device_events if permitted
  try {
    const deviceInstallId = getDeviceInstallId();
    const permissions = await getDeviceModulePermissions(userId, deviceInstallId);

    if (permissions.demographics) {
      const payload = createDemographicsPayload(
        demographics.ageRange,
        demographics.industry,
        demographics.region,
        demographics.householdSize,
        demographics.devicesOwned,
      );

      await ingestDeviceEvent({
        userId,
        deviceInstallId,
        moduleKey: 'demographics',
        permission: permissions.demographics,
        payload,
      });
    }
  } catch (err) {
    console.warn('saveDemographicsWithEvent device_events insert failed:', err);
  }

  return legacySaveSuccess;
}
