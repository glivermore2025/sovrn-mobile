/**
 * Core types for module-based data collection and marketplace sync.
 * Source of truth for event ingestion model.
 */

export type ModuleKey =
  | 'connectivity'
  | 'device_health'
  | 'activity_rhythm'
  | 'demographics'
  | 'location_coarse';

export type ModulePermission = {
  module_key: string;
  can_collect: boolean;
  can_sell: boolean;
  consent_version: string;
};

/** Generic event payload - specific modules define their own shape */
export type DeviceEventPayload = Record<string, unknown>;

/** Result of a sync operation across all modules */
export type SyncResult = {
  deviceRegistered: boolean;
  deviceClaimRequired?: boolean;
  deviceClaimed?: boolean;
  events: {
    connectivity?: boolean;
    device_health?: boolean;
    location_coarse?: boolean;
    activity_rhythm?: boolean;
    demographics?: boolean;
  };
};

/** Connectivity event payload */
export type ConnectivityEventPayload = {
  network_type: string | null;
  is_connected: boolean | null;
  is_internet_reachable: boolean | null;
  carrier: string | null;
  event_type: 'snapshot' | 'transition';
  app_collected_at: string;
  platform: string;
};

/** Device health event payload */
export type DeviceHealthEventPayload = {
  model_name: string | null;
  os_name: string | null;
  os_version: string | null;
  brand: string | null;
  device_type: string | null;
  total_memory: number | null;
  battery_level: number | null;
  is_charging: boolean | null;
  low_power_mode: boolean | null;
  screen_width: number;
  screen_height: number;
  platform: string;
  app_collected_at: string;
};

/** Location event payload (coarse only) */
export type LocationCoarseEventPayload = {
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  accuracy_bucket?: string;
  platform: string;
  app_collected_at: string;
};

/** Activity rhythm event payload (aggregated app usage) */
export type ActivityRhythmEventPayload = {
  apps_used_count: number;
  total_foreground_time: number;
  window_start: string;
  window_end: string;
  permission_granted: boolean;
  platform: string;
  app_collected_at: string;
  // TODO: package-level app history should be converted to categories/aggregates before marketplace use
};

/** Demographics event payload */
export type DemographicsEventPayload = {
  age_range: string;
  industry: string;
  region: string;
  household_size: string;
  devices_owned: string[];
  app_collected_at: string;
};
