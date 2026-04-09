import { supabase } from '../lib/supabase';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';

export type DeviceSnapshot = {
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
  lowPowerMode: boolean | null;
  networkType: string | null;
  screenWidth: number;
  screenHeight: number;
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
};

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function collectSnapshot(): Promise<DeviceSnapshot> {
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
  try {
    const net = await Network.getNetworkStateAsync();
    networkType = net?.type ?? null;
  } catch {}

  return {
    modelName: Device.modelName ?? null,
    osName: Device.osName ?? null,
    osVersion: Device.osVersion ?? null,
    batteryLevel: batteryLevel ?? null,
    isCharging,
    lowPowerMode,
    networkType: networkType != null ? String(networkType) : null,
    screenWidth: width,
    screenHeight: height,
    timestamp: new Date().toISOString(),
  };
}

export async function registerDevice(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const installId =
    Constants.installationId ??
    `${Platform.OS}-${Device.modelName ?? 'unknown'}`;

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
  const userId = await getSessionUserId();
  if (!userId) return false;

  const { error } = await supabase.from('device_snapshots').insert({
    user_id: userId,
    device_id: deviceId,
    battery_level: snapshot.batteryLevel,
    is_charging: snapshot.isCharging,
    network_type: snapshot.networkType,
    screen_width: snapshot.screenWidth,
    screen_height: snapshot.screenHeight,
    collected_at: snapshot.timestamp,
  });

  if (error) {
    console.warn('uploadSnapshot error:', error.message);
    return false;
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

  const { error } = await supabase.from('consent_preferences').upsert({
    user_id: userId,
    device_info: consent.deviceInfo,
    demographics: consent.demographics,
    usage_telemetry: consent.usageTelemetry,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('saveConsent error:', error.message);
    return false;
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
  };
}

export async function syncAll(): Promise<{
  deviceRegistered: boolean;
  snapshotUploaded: boolean;
}> {
  const deviceId = await registerDevice();
  if (!deviceId) return { deviceRegistered: false, snapshotUploaded: false };

  const snapshot = await collectSnapshot();
  const uploaded = await uploadSnapshot(deviceId, snapshot);

  return { deviceRegistered: true, snapshotUploaded: uploaded };
}
