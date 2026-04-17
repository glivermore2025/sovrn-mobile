import { supabase } from './supabase';

type ConnectivityPayload = {
  network_type: string | null;
  is_connected: boolean | null;
  is_internet_reachable: boolean | null;
  carrier: string | null;
  event_type: 'snapshot' | 'transition';
};

export async function ingestConnectivityEvent(params: {
  userId: string;
  deviceInstallId: string;
  permission:
    | {
        can_collect: boolean;
        can_sell: boolean;
        consent_version: string;
      }
    | null;
  payload: ConnectivityPayload;
}) {
  const { userId, deviceInstallId, permission, payload } = params;

  if (!permission?.can_collect) return;

  const { error } = await supabase.from('device_events').insert({
    user_id: userId,
    device_install_id: deviceInstallId,
    module_key: 'connectivity',
    captured_at: new Date().toISOString(),
    payload_json: payload,
    consent_version: permission.consent_version,
    can_sell_snapshot: permission.can_sell,
  });

  if (error) throw error;
}
