import { supabase } from './supabase';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type ModulePermission = {
  module_key: string;
  can_collect: boolean;
  can_sell: boolean;
  consent_version: string;
};

export function getDeviceInstallId(): string {
  return (
    Constants.installationId ?? `${Platform.OS}-${Device.modelName ?? 'unknown'}`
  );
}

export async function getDeviceModulePermissions(
  userId: string,
  deviceInstallId: string,
): Promise<Record<string, ModulePermission>> {
  const { data, error } = await supabase
    .from('user_module_permissions')
    .select('module_key, can_collect, can_sell, consent_version')
    .eq('user_id', userId)
    .eq('device_install_id', deviceInstallId);

  if (error) throw error;

  const out: Record<string, ModulePermission> = {};
  for (const row of data ?? []) {
    out[row.module_key] = row;
  }
  return out;
}
