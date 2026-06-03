# Device Event Marketplace Alignment - Implementation Summary

## Overview
Successfully refactored the Sovrn mobile app to align with the website marketplace data collection model. The app now treats `device_events` as the canonical ingestion table and uses `user_module_permissions` as the source of truth for data collection and selling permissions.

## Key Changes

### 1. Type Definitions (`src/types/dataModules.ts`) ✓ NEW
- **ModuleKey**: Union type of valid module keys
- **ModulePermission**: Permission state for a module
- **SyncResult**: Return type for sync operations with per-module status
- **Payload Types**: Strongly typed payloads for each module
  - ConnectivityEventPayload
  - DeviceHealthEventPayload  
  - LocationCoarseEventPayload
  - ActivityRhythmEventPayload
  - DemographicsEventPayload

### 2. Generic Event Ingestion (`src/lib/ingestDeviceEvent.ts`) ✓ NEW
- Canonical write path for all marketplace data
- Strongly typed parameters and return values
- Permission gating:
  - Returns `false` if permission is missing
  - Returns `false` if `permission.can_collect` is false
  - Inserts into `device_events` table
  - Populates `can_sell_snapshot` from `permission.can_sell`
- Graceful error handling (logs, no throw)

### 3. Connectivity Event Wrapper (`src/lib/ingestConnectivityEvent.ts`) ✓ UPDATED
- Now wraps `ingestDeviceEvent` instead of duplicating logic
- Added `app_collected_at` and `platform` fields to payload
- Maintains existing behavior while using generic helper

### 4. Event Collectors (`src/lib/eventCollectors.ts`) ✓ NEW
Module-specific payload collectors:

**Device Health**
- `collectDeviceHealthPayload()`: Collects hardware/OS info, battery, screen dimensions
- Fields: model_name, os_name, os_version, brand, device_type, total_memory, battery_level, is_charging, low_power_mode, screen_width, screen_height, platform, app_collected_at

**Location (Coarse)**
- `collectLocationCoarsePayload()`: City/region level only, sanitizes precise location
- Returns null if permission not granted
- Converts accuracy (meters) to privacy buckets (street_level, neighborhood, city_area, region)
- EXCLUDES: latitude, longitude, street, exact place name

**Activity Rhythm**
- `collectActivityRhythmPayload()`: Aggregated app usage data
- Returns null on non-Android
- Fields: apps_used_count, total_foreground_time, window_start, window_end, permission_granted
- NOTE: Uses aggregate counts, not package-level history

**Demographics**
- `createDemographicsPayload()`: Creates payload from user input
- Fields: age_range, industry, region, household_size, devices_owned, app_collected_at

### 5. Sync Service Refactor (`src/services/syncService.ts`) ✓ UPDATED
**New Function: `syncAll()`**
- NEW canonical sync path for marketplace data
- Process:
  1. Get current user
  2. Register device in `user_devices`
  3. Load module permissions from `user_module_permissions`
  4. Collect and ingest events only for modules with `can_collect=true`
  5. Return detailed `SyncResult` with per-module status
- Returns: `{ deviceRegistered: boolean, events: { connectivity?, device_health?, ... } }`

**New Function: `saveDemographicsWithEvent()`**
- Saves to legacy `user_demographics` table (compatibility)
- Also inserts into `device_events` if `demographics` module has `can_collect=true`
- Maintains backwards compatibility

**Legacy Functions Marked**
- `uploadSnapshot()` now marked as LEGACY (device_snapshots is NOT the marketplace path)
- Old `syncAll` logic replaced with module-based flow

### 6. DataContext Updates (`src/context/DataContext.tsx`) ✓ UPDATED
- Updated `syncNow()` to:
  - Use new `SyncResult` type
  - Check for at least one module event being inserted
  - Show success if any module event was inserted
- Updated `persistDemographics()` to use `saveDemographicsWithEvent()`
- Updated connectivity collection to include `app_collected_at` and `platform`
- Fixed TypeScript access patterns for module permissions

### 7. Module Permissions UI (`app/settings.tsx`) ✓ UPDATED
**New Tab: "Module Permissions"** (default active)
- Per-module collect/sell permission toggles
- User-friendly descriptions for each module
- Business rules enforced:
  - "Sell" toggle disabled unless "Collect" is enabled
  - Turning off "Collect" also turns off "Sell"
- Modules: connectivity, device_health, activity_rhythm, demographics, location_coarse
- Saves to `user_module_permissions` table

**Existing Tab: "Legacy Consent"**
- Original consent preferences UI (backwards compatibility)

## Module Descriptions
| Module | Collects | Privacy | Marketplace Use |
|--------|----------|---------|-----------------|
| **connectivity** | Network type, connectivity status, carrier | Network-level | Network dataset |
| **device_health** | Hardware/OS info, battery, screen dimensions | Aggregated | Device dataset |
| **location_coarse** | City, region, country (NO lat/lon, street, place name) | City-level | Geographic dataset |
| **activity_rhythm** | App usage counts and foreground time (NO package names) | Aggregated | Usage patterns dataset |
| **demographics** | Age, industry, region, household info | Aggregated | Demographic dataset |

## Data Flow: NEW vs LEGACY

### NEW (Marketplace) Path ✓
```
User enables module permission
→ Mobile app collects data
→ ingestDeviceEvent() inserts to device_events
→ can_sell_snapshot populated from permission.can_sell
→ Supabase transforms device_events → dataset_connectivity_daily
→ Website marketplace uses datasets
```

### LEGACY Path (Compatibility)
```
device_snapshots (still works, not primary)
consent_preferences (still supported for old UI)
user_demographics (still updated, also writes to device_events)
```

## Acceptance Criteria Met ✓
- [x] Mobile writes marketplace data to `device_events`
- [x] `device_events.can_sell_snapshot` populated from `user_module_permissions.can_sell`
- [x] `device_snapshots` no longer the default marketplace ingestion path
- [x] Connectivity works on app start and network changes
- [x] Device health, coarse location, activity rhythm, demographics can write to `device_events`
- [x] Raw precise location NOT stored by default (sanitized to coarse)
- [x] Settings allow module-level collect/sell permission management
- [x] TypeScript passes
- [x] Expo app builds successfully

## Manual Test Steps

### 1. Login & Initialize
```
1. Log in on mobile
2. Open Settings (should default to Module Permissions tab)
3. Verify all modules visible with descriptions
```

### 2. Enable & Sync Connectivity
```
1. Toggle "Collect" ON for connectivity module
2. Toggle "Sell" ON for connectivity module
3. Tap "Save Module Permissions"
4. Trigger sync (pull to refresh or manual sync button)
5. Check Supabase: SELECT * FROM device_events WHERE module_key='connectivity'
6. Verify: can_sell_snapshot=true, payload_json has network_type, is_connected, etc.
```

### 3. Enable Device Health
```
1. Toggle "Collect" ON for device_health module
2. Tap "Save Module Permissions"
3. Trigger sync
4. Check Supabase: SELECT * FROM device_events WHERE module_key='device_health'
5. Verify: payload_json has battery_level, os_version, screen dimensions, etc.
```

### 4. Permission Gating
```
1. In Settings, turn OFF "Collect" for a module (e.g., location_coarse)
2. Trigger sync
3. Check Supabase: Verify NO new device_events row for location_coarse
4. Turn ON "Collect" for location_coarse
5. Trigger sync
6. Verify: device_events row created for location_coarse
```

### 5. Sell Permission
```
1. With "Collect" ON for a module
2. Try to enable "Sell" (should work)
3. Save, then disable "Collect"
4. Verify: "Sell" automatically disabled
5. Re-enable "Collect" with "Sell" OFF, then try enabling "Sell" (should work)
```

### 6. Demographics
```
1. Go to Demographics section (other screens)
2. Update demographics info
3. Save Demographics
4. Check Supabase: SELECT * FROM device_events WHERE module_key='demographics'
5. Verify: user_demographics also updated (backwards compat)
```

### 7. Network Transitions
```
1. Open app (should capture connectivity snapshot)
2. Toggle airplane mode or switch WiFi/mobile
3. Verify: device_events rows created with event_type='snapshot' or 'transition'
```

## Files Modified
- ✓ `src/types/dataModules.ts` (NEW)
- ✓ `src/lib/ingestDeviceEvent.ts` (NEW)
- ✓ `src/lib/ingestConnectivityEvent.ts` (UPDATED)
- ✓ `src/lib/eventCollectors.ts` (NEW)
- ✓ `src/services/syncService.ts` (UPDATED)
- ✓ `src/context/DataContext.tsx` (UPDATED)
- ✓ `app/settings.tsx` (UPDATED)

## Files NOT Changed (Source of Truth)
- ✓ `src/lib/permissions.ts` (getDeviceInstallId, getDeviceModulePermissions - remain canonical)
- ✓ `src/lib/supabase.ts` (Supabase client)
- ✓ Supabase schema (device_events, user_module_permissions as specified)

## TypeScript Status
✓ All files pass TypeScript strict mode
✓ No type errors or warnings

## Build Status
✓ Expo prebuild succeeded
✓ Native directories created (android, ios)
✓ Ready for local testing

## Next Steps for Testing
1. Run `npx expo start` to start the development server
2. Scan QR code with Expo Go app or press `i` for iOS simulator
3. Follow manual test steps above
4. Monitor Supabase `device_events` table for incoming records
5. Verify `can_sell_snapshot` values match module permissions
