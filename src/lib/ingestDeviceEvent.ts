/**
 * Generic device event ingestion helper.
 * Canonical write path for all marketplace-bound mobile data.
 *
 * Behavior:
 * - Returns false immediately if permission is missing or can_collect is false
 * - Inserts into device_events with full context
 * - Uses permission.can_sell for can_sell_snapshot
 * - Does not throw; logs errors and returns false
 */

import { supabase } from './supabase';
import type { ModuleKey, ModulePermission, DeviceEventPayload } from '../types/dataModules';

export async function ingestDeviceEvent(params: {
  userId: string;
  deviceInstallId: string;
  moduleKey: ModuleKey;
  permission: ModulePermission | null | undefined;
  payload: DeviceEventPayload;
  capturedAt?: string;
}): Promise<boolean> {
  const { userId, deviceInstallId, moduleKey, permission, payload, capturedAt } = params;

  // Gate 1: Permission required
  if (!permission) {
    return false;
  }

  // Gate 2: can_collect must be true
  if (!permission.can_collect) {
    return false;
  }

  try {
    const capturedAtValue = capturedAt || new Date().toISOString();

    const { error } = await supabase.from('device_events').insert({
      user_id: userId,
      device_install_id: deviceInstallId,
      module_key: moduleKey,
      captured_at: capturedAtValue,
      payload_json: payload,
      consent_version: permission.consent_version,
      can_sell_snapshot: permission.can_sell,
      // ingested_at is set by DB default
    });

    if (error) {
      console.warn(
        `ingestDeviceEvent error for module ${moduleKey}:`,
        error.message,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      `ingestDeviceEvent unexpected error for module ${moduleKey}:`,
      err,
    );
    return false;
  }
}
