/**
 * Connectivity event ingestion.
 * Wrapper around generic ingestDeviceEvent for module_key='connectivity'.
 * Captures network state changes and snapshots.
 */

import { ingestDeviceEvent } from './ingestDeviceEvent';
import type { ModulePermission, ConnectivityEventPayload } from '../types/dataModules';
import { Platform } from 'react-native';

export async function ingestConnectivityEvent(params: {
  userId: string;
  deviceInstallId: string;
  permission: ModulePermission | null | undefined;
  payload: ConnectivityEventPayload;
}): Promise<boolean> {
  const { userId, deviceInstallId, permission, payload } = params;

  // Route through generic helper
  return ingestDeviceEvent({
    userId,
    deviceInstallId,
    moduleKey: 'connectivity',
    permission,
    payload: {
      network_type: payload.network_type,
      is_connected: payload.is_connected,
      is_internet_reachable: payload.is_internet_reachable,
      carrier: payload.carrier,
      event_type: payload.event_type,
      app_collected_at: payload.app_collected_at,
      platform: payload.platform || Platform.OS,
    },
  });
}
