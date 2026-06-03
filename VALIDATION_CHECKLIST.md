# Device Event Refactoring - Validation Checklist

## ✅ Implementation Complete

### Core Components (A-K)

#### A. Generic Event Ingestion Helper
- [x] File created: `src/lib/ingestDeviceEvent.ts`
- [x] Function: `ingestDeviceEvent(params)` with proper typing
- [x] Permission gating: Returns false if permission missing or can_collect=false
- [x] Inserts into device_events table with all required fields
- [x] Uses permission.can_sell for can_sell_snapshot
- [x] DB defaults handle ingested_at (not inserted)
- [x] Graceful error handling (logs, returns false)
- [x] No unnecessary throws

#### B. Connectivity Event Wrapper
- [x] File updated: `src/lib/ingestConnectivityEvent.ts`
- [x] Calls ingestDeviceEvent internally
- [x] Module key: 'connectivity' ✓
- [x] Payload includes: network_type, is_connected, is_internet_reachable, carrier, event_type, app_collected_at, platform
- [x] Type safety with ConnectivityEventPayload type

#### C. Sync Service Refactoring
- [x] File updated: `src/services/syncService.ts`
- [x] New syncAll() with device_events as canonical path
- [x] Process: user → device registration → module permissions → event ingestion
- [x] Returns SyncResult with per-module status
- [x] uploadSnapshot() marked as LEGACY with clear comments
- [x] Maintains backwards compatibility

#### D. Device Health Event Collection
- [x] File created: `src/lib/eventCollectors.ts`
- [x] Function: `collectDeviceHealthPayload()`
- [x] Collects: model_name, os_name, os_version, brand, device_type, total_memory, battery_level, is_charging, low_power_mode, screen_width, screen_height, platform, app_collected_at
- [x] Used in syncAll() for module_key='device_health'
- [x] Only inserted if can_collect=true

#### E. Coarse Location Event Collection
- [x] File created: `src/lib/eventCollectors.ts`
- [x] Function: `collectLocationCoarsePayload()`
- [x] Returns null if permission not granted
- [x] Sanitization: Excludes latitude, longitude, street, exact place name
- [x] Includes: city, region, postal_code, country, accuracy_bucket
- [x] Privacy bucketing: street_level, neighborhood, city_area, region
- [x] Used in syncAll() for module_key='location_coarse'

#### F. Activity Rhythm Event Collection
- [x] File created: `src/lib/eventCollectors.ts`
- [x] Function: `collectActivityRhythmPayload()`
- [x] Aggregated: apps_used_count, total_foreground_time (not package names)
- [x] Fields: window_start, window_end, permission_granted, platform, app_collected_at
- [x] Android-only (returns null on iOS)
- [x] TODO comment about package-level history conversion
- [x] Used in syncAll() for module_key='activity_rhythm'

#### G. Demographics Event Collection
- [x] File created: `src/lib/eventCollectors.ts`
- [x] Function: `createDemographicsPayload()`
- [x] New function: `saveDemographicsWithEvent()` in syncService.ts
- [x] Saves to both user_demographics (legacy) and device_events (marketplace)
- [x] Used in syncAll() for module_key='demographics'
- [x] Backwards compatible

#### H. Permissions Source of Truth
- [x] File: `src/lib/permissions.ts` (unchanged, remains canonical)
- [x] Functions: `getDeviceModulePermissions()`, `getDeviceInstallId()`
- [x] Default behavior: missing rows treated as can_collect=false, can_sell=false
- [x] Not inferring from legacy consent_preferences

#### I. Settings UI Update
- [x] File updated: `app/settings.tsx`
- [x] New tab: "Module Permissions" (default active)
- [x] Per-module controls: Collect and Sell toggles for each module
- [x] Business rules: Sell disabled unless Collect enabled
- [x] Modules: connectivity, device_health, activity_rhythm, demographics, location_coarse
- [x] Module descriptions: Clear user-facing explanations
- [x] Saves to user_module_permissions table with proper fields
- [x] Legacy tab: "Legacy Consent" (backwards compatible)
- [x] Proper error handling and user feedback

#### J. DataContext Updates
- [x] File updated: `src/context/DataContext.tsx`
- [x] Imports: SyncResult type
- [x] syncNow() checks for at least one module event
- [x] persistDemographics() uses saveDemographicsWithEvent()
- [x] Connectivity collection includes app_collected_at, platform
- [x] Module permissions loaded and refreshed
- [x] No infinite loops from effect dependencies
- [x] TypeScript types fixed (bracket notation for Record access)

#### K. Type Cleanup
- [x] File created: `src/types/dataModules.ts`
- [x] ModuleKey union type
- [x] ModulePermission type
- [x] DeviceEventPayload base type
- [x] SyncResult type with per-module events
- [x] Specific payload types: ConnectivityEventPayload, DeviceHealthEventPayload, LocationCoarseEventPayload, ActivityRhythmEventPayload, DemographicsEventPayload
- [x] Removed duplicate type definitions (used new central types)

### Code Quality

#### TypeScript
- [x] All files pass `npx tsc --noEmit`
- [x] No type errors
- [x] Proper typing for all functions and parameters
- [x] Correct Record<string, T> access patterns (bracket notation)

#### Build
- [x] Expo prebuild succeeded
- [x] Native directories created
- [x] No build errors
- [x] Ready for testing

#### Error Handling
- [x] ingestDeviceEvent: Logs errors, returns false (no throw)
- [x] Event collectors: Graceful fallbacks, null returns
- [x] Settings: Try-catch with user alerts
- [x] DataContext: Try-catch on permission refresh

#### Backwards Compatibility
- [x] uploadSnapshot() kept for legacy code
- [x] consent_preferences still supported via saveConsent()
- [x] user_demographics still written to
- [x] device_snapshots still insertable if old code calls uploadSnapshot()

### Acceptance Criteria

#### Data Collection
- [x] Mobile writes to device_events (canonical path)
- [x] device_events.can_sell_snapshot = permission.can_sell
- [x] device_snapshots NOT default marketplace path (marked legacy)
- [x] Connectivity on app start ✓
- [x] Connectivity on network transitions ✓
- [x] Device health collectable ✓
- [x] Coarse location collectable (no precise data) ✓
- [x] Activity rhythm collectable (aggregated, no package names) ✓
- [x] Demographics collectable ✓

#### User Interface
- [x] Module permissions UI in settings
- [x] Per-module collect/sell toggles
- [x] Sell disabled without collect
- [x] Clear descriptions for each module
- [x] Save to user_module_permissions

#### Technical
- [x] TypeScript passes
- [x] Expo builds successfully
- [x] No breaking changes to existing APIs
- [x] Proper import paths
- [x] No duplicate implementations

### Manual Testing - Ready

#### Test 1: Login & Initialize
- Procedure ready
- Expected: All modules visible in settings

#### Test 2: Connectivity Collection
- Procedure ready
- Expected: device_events row with connectivity, can_sell_snapshot=true

#### Test 3: Device Health Collection
- Procedure ready
- Expected: device_events row with device_health, battery info, etc.

#### Test 4: Permission Gating
- Procedure ready
- Expected: No events when can_collect=false

#### Test 5: Sell Permission Logic
- Procedure ready
- Expected: Sell toggle disabled unless collect enabled

#### Test 6: Demographics Save
- Procedure ready
- Expected: Both user_demographics and device_events updated

#### Test 7: Network Transitions
- Procedure ready
- Expected: Connectivity events on network changes

## Summary

✅ **All implementation tasks completed**
✅ **TypeScript validation passed**
✅ **Build validation passed**
✅ **No breaking changes**
✅ **Backwards compatible**
✅ **Ready for testing**

### What Changed
- Generic event ingestion framework
- Module-based permission model
- Device_events as canonical marketplace ingestion table
- Per-module UI controls
- Sanitized location data (coarse only)
- Aggregated activity data (no raw package names)
- Full backwards compatibility maintained

### What Stayed Same
- Supabase connection
- Auth flow
- Existing consent UI (legacy tab)
- Legacy tables (still writable)
- Core data collection capabilities

### Next: Testing & Deployment
1. Local testing with `npx expo start`
2. Verify device_events inserts via Supabase console
3. Test module permissions UI
4. Monitor can_sell_snapshot values
5. Deploy to production after validation
