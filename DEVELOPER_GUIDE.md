# Device Events & Module Permissions - Developer Guide

## Quick Reference

### Data Ingestion Path

```
User Permission (user_module_permissions)
  ↓ [can_collect = true?]
  ↓ YES
Device Event Collection (module-specific)
  ↓ [collect payload]
  ↓
Generic Event Ingester (ingestDeviceEvent)
  ↓ [check permission.can_sell]
  ↓
Database Insert (device_events)
  ↓ [can_sell_snapshot = permission.can_sell]
  ↓
✓ Marketplace Ready
```

### Core Functions

#### Check Permissions
```typescript
import { getDeviceModulePermissions } from '../lib/permissions';

const permissions = await getDeviceModulePermissions(userId, deviceInstallId);
// Returns: Record<string, ModulePermission>
// { 
//   connectivity: { can_collect: true, can_sell: false, ... },
//   device_health: { can_collect: false, can_sell: false, ... },
//   ...
// }
```

#### Ingest an Event
```typescript
import { ingestDeviceEvent } from '../lib/ingestDeviceEvent';

const success = await ingestDeviceEvent({
  userId,
  deviceInstallId,
  moduleKey: 'connectivity',
  permission: permissions.connectivity,
  payload: { network_type: 'wifi', is_connected: true, ... },
  capturedAt: new Date().toISOString(), // optional
});
```

#### Get Module Permission
```typescript
const connectivityPerm = permissions['connectivity'];
if (!connectivityPerm) {
  console.log('Module not found - treat as can_collect=false');
  return;
}
```

### Module Modules

| Module | Type | Use Case | Permission Check |
|--------|------|----------|------------------|
| `connectivity` | Network | Network status data | Required for network events |
| `device_health` | Hardware | Device info | Required for device data |
| `location_coarse` | Location | City/region only | Required for location data |
| `activity_rhythm` | Usage | Aggregated app usage | Required for usage data |
| `demographics` | Profile | User profile info | Required for demographics |

### Data Types

#### ModuleKey
```typescript
type ModuleKey = 
  | 'connectivity'
  | 'device_health'
  | 'activity_rhythm'
  | 'demographics'
  | 'location_coarse';
```

#### ModulePermission
```typescript
type ModulePermission = {
  module_key: string;
  can_collect: boolean;
  can_sell: boolean;
  consent_version: string;
};
```

#### SyncResult
```typescript
type SyncResult = {
  deviceRegistered: boolean;
  events: {
    connectivity?: boolean;
    device_health?: boolean;
    location_coarse?: boolean;
    activity_rhythm?: boolean;
    demographics?: boolean;
  };
};
```

### Payload Examples

#### Connectivity Payload
```typescript
{
  network_type: 'wifi',              // or '4g', '5g', null
  is_connected: true,
  is_internet_reachable: true,
  carrier: 'Verizon',
  event_type: 'snapshot',            // or 'transition'
  app_collected_at: '2026-06-03T...',
  platform: 'ios'                    // or 'android'
}
```

#### Device Health Payload
```typescript
{
  model_name: 'iPhone 14 Pro',
  os_name: 'iOS',
  os_version: '17.5.1',
  brand: 'Apple',
  device_type: 'PHONE',
  total_memory: 6442450944,           // bytes
  battery_level: 0.85,                // 0-1
  is_charging: false,
  low_power_mode: false,
  screen_width: 390,
  screen_height: 844,
  platform: 'ios',
  app_collected_at: '2026-06-03T...'
}
```

#### Location Coarse Payload
```typescript
{
  city: 'San Francisco',
  region: 'CA',
  postal_code: '94105',
  country: 'US',
  accuracy_bucket: 'city_area',       // or 'neighborhood', etc.
  platform: 'ios',
  app_collected_at: '2026-06-03T...'
  // EXCLUDED: latitude, longitude, street, name
}
```

#### Activity Rhythm Payload (Android)
```typescript
{
  apps_used_count: 23,
  total_foreground_time: 3600000,     // milliseconds
  window_start: '2026-06-03T00:00:00Z',
  window_end: '2026-06-03T18:30:45Z',
  permission_granted: true,
  platform: 'android',
  app_collected_at: '2026-06-03T...'
  // NOT STORED: individual package names
}
```

#### Demographics Payload
```typescript
{
  age_range: '25-34',
  industry: 'Technology',
  region: 'West Coast',
  household_size: '2',
  devices_owned: ['smartphone', 'laptop'],
  app_collected_at: '2026-06-03T...'
}
```

## Adding a New Module

### 1. Define Type
```typescript
// src/types/dataModules.ts
export type MyModuleEventPayload = {
  field1: string;
  field2: number;
  app_collected_at: string;
};

// Add to ModuleKey union
export type ModuleKey = 
  | 'connectivity'
  | 'my_module'  // NEW
  | ...;
```

### 2. Create Collector
```typescript
// src/lib/eventCollectors.ts
export async function collectMyModulePayload(): Promise<MyModuleEventPayload> {
  // Collect data
  return {
    field1: 'value',
    field2: 42,
    app_collected_at: new Date().toISOString(),
  };
}
```

### 3. Integrate into Sync
```typescript
// src/services/syncService.ts - in syncAll()
if (permissions.my_module) {
  try {
    const payload = await collectMyModulePayload();
    const success = await ingestDeviceEvent({
      userId,
      deviceInstallId,
      moduleKey: 'my_module',
      permission: permissions.my_module,
      payload,
    });
    result.events.my_module = success;
  } catch (err) {
    console.warn('my_module collection failed:', err);
    result.events.my_module = false;
  }
}
```

### 4. Add to Settings UI
```typescript
// app/settings.tsx
const MODULE_DESCRIPTIONS: Record<ModuleKey, ...> = {
  my_module: {
    title: 'My Module',
    desc: 'Description of what it collects',
  },
  ...
};
```

## Important Rules

### ✅ DO
- Use `ingestDeviceEvent()` for all marketplace data
- Check `can_collect` before collecting
- Include `app_collected_at` timestamp
- Include `platform` in payloads
- Sanitize sensitive data (like precise location)
- Use aggregate data instead of raw records
- Handle errors gracefully (log, return false)

### ❌ DON'T
- Insert directly into `device_events` (use helper)
- Bypass permission checks
- Store precise location data
- Store raw package names (use aggregates)
- Throw errors from collection functions
- Forget `can_sell_snapshot` in `device_events`
- Assume legacy tables are current

## Testing a New Feature

### 1. Verify Permissions Loaded
```typescript
const permissions = await getDeviceModulePermissions(userId, installId);
console.log('Permissions:', permissions);
// Should show { connectivity: {...}, device_health: {...}, ... }
```

### 2. Collect Payload
```typescript
const payload = await collectMyModulePayload();
console.log('Payload:', payload);
// Should be complete and valid
```

### 3. Ingest Event
```typescript
const success = await ingestDeviceEvent({
  userId,
  deviceInstallId,
  moduleKey: 'my_module',
  permission: permissions.my_module,
  payload,
});
console.log('Ingested:', success);
// Should be true if can_collect=true, false otherwise
```

### 4. Check Supabase
```sql
SELECT * FROM device_events 
WHERE module_key='my_module' 
ORDER BY captured_at DESC 
LIMIT 5;
```

Expected columns:
- `id`: UUID
- `user_id`: Same as passed
- `device_install_id`: Same as passed
- `module_key`: 'my_module'
- `captured_at`: Same as in payload
- `payload_json`: Full payload object
- `consent_version`: From permission
- `can_sell_snapshot`: From permission.can_sell
- `ingested_at`: Set by database

## Troubleshooting

### No Events Inserted
1. Check permission: `permission.can_collect === true`?
2. Check user logged in: `userId` not null?
3. Check payload: Valid JSON?
4. Check error logs: `console.warn` messages?

### Events Have can_sell_snapshot=false
- User toggled "Sell" OFF in settings
- This is expected behavior
- Can't be changed after insertion (immutable in DB)

### Events Missing Fields
- Collector didn't include field
- Add to payload in collector function
- Re-test after fix

### Location Shows null Values
- Permission not granted
- Device doesn't support location
- This is expected (returns null gracefully)

## API Reference

### ingestDeviceEvent
```typescript
async function ingestDeviceEvent(params: {
  userId: string;
  deviceInstallId: string;
  moduleKey: ModuleKey;
  permission: ModulePermission | null | undefined;
  payload: DeviceEventPayload;
  capturedAt?: string;
}): Promise<boolean>
```
Returns `true` on success, `false` on permission gating or error.

### getDeviceModulePermissions
```typescript
async function getDeviceModulePermissions(
  userId: string,
  deviceInstallId: string
): Promise<Record<string, ModulePermission>>
```
Returns record with one entry per module. Missing modules: treat as `can_collect=false`.

### Collector Functions
- `collectDeviceHealthPayload(): Promise<DeviceHealthEventPayload>`
- `collectLocationCoarsePayload(): Promise<LocationCoarseEventPayload | null>`
- `collectActivityRhythmPayload(): Promise<ActivityRhythmEventPayload | null>` (Android only)
- `createDemographicsPayload(...): DemographicsEventPayload`

All include `app_collected_at` and `platform` automatically.

## Schema Reference

### device_events Table
```sql
id              uuid primary key
user_id         uuid not null
device_install_id text not null
module_key      text not null
captured_at     timestamptz not null
payload_json    jsonb not null
consent_version text not null
can_sell_snapshot boolean not null
ingested_at     timestamptz not null (default: now())

-- Unique constraint on (user_id, device_install_id, module_key) per captured_at
```

### user_module_permissions Table
```sql
id              uuid primary key
user_id         uuid not null
device_install_id text not null
module_key      text not null
can_collect     boolean not null default false
can_sell        boolean not null default false
consent_version text not null default 'v1.0'
updated_at      timestamptz not null default now()

-- Unique constraint on (user_id, device_install_id, module_key)
```
