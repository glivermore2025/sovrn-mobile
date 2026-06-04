import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Network from 'expo-network';
import {
  collectSnapshot,
  registerDevice,
  uploadSnapshot,
  loadDemographics,
  saveDemographicsWithEvent,
  loadConsent,
  saveConsent as saveConsentRemote,
  syncAll,
  EMPTY_DEMOGRAPHICS,
  DEFAULT_CONSENT,
  getDeviceInstallId,
  getSessionUserId,
} from '../services/syncService';
import { getDeviceModulePermissions, ModulePermission } from '../lib/permissions';
import { ingestConnectivityEvent } from '../lib/ingestConnectivityEvent';
import type {
  DeviceSnapshot,
  Demographics,
  ConsentPreferences,
} from '../services/syncService';
import type { SyncResult } from '../types/dataModules';

type SyncFeedback = {
  timestamp: string;
  modules: Record<string, boolean>; // module key -> success
  message: string;
};

type DataContextValue = {
  snapshot: DeviceSnapshot | null;
  demographics: Demographics;
  consent: ConsentPreferences;
  contributing: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  lastSyncFeedback: SyncFeedback | null;
  deviceId: string | null;

  refreshSnapshot: () => Promise<void>;
  setDemographics: (d: Demographics) => void;
  persistDemographics: (d: Demographics) => Promise<boolean>;
  setConsent: (c: ConsentPreferences) => void;
  persistConsent: (c: ConsentPreferences) => Promise<boolean>;
  syncNow: () => Promise<boolean>;
  refreshModulePermissions: (userId: string) => Promise<Record<string, ModulePermission>>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);
  const [demographics, setDemographicsState] = useState<Demographics>(EMPTY_DEMOGRAPHICS);
  const [consent, setConsentState] = useState<ConsentPreferences>(DEFAULT_CONSENT);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncFeedback, setLastSyncFeedback] = useState<SyncFeedback | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [modulePermissions, setModulePermissions] = useState<Record<string, ModulePermission>>({});
  const appState = useRef(AppState.currentState);
  const lastConnectivityEventAt = useRef<number>(0); // milliseconds for throttling
  const deviceInstallId = getDeviceInstallId();

  // Derive contributing from module permissions (new model)
  // Fallback to legacy consent only if no module permissions loaded yet
  const contributing =
    Object.values(modulePermissions).some(
      (permission) => permission.can_collect || permission.can_sell,
    ) ||
    (Object.keys(modulePermissions).length === 0 &&
      (consent.deviceInfo ||
        consent.demographics ||
        consent.usageTelemetry ||
        consent.locationData ||
        consent.appUsage));

  const refreshModulePermissions = useCallback(
    async (userId: string) => {
      const permissions = await getDeviceModulePermissions(userId, deviceInstallId);
      setModulePermissions(permissions);
      return permissions;
    },
    [deviceInstallId],
  );

  const collectConnectivitySnapshot = useCallback(
    async (
      userId: string,
      permission: ModulePermission | null,
      eventType: 'snapshot' | 'transition' = 'snapshot',
    ) => {
      if (!permission?.can_collect) return;

      try {
        const state = await Network.getNetworkStateAsync();
        const now = Date.now();
        
        // Throttle connectivity events: skip if one was just inserted (unless network state changed)
        const timeSinceLastEvent = now - lastConnectivityEventAt.current;
        if (timeSinceLastEvent < 60000) {
          // Less than 60 seconds since last event
          // TODO: Could enhance this to compare network_type/is_connected to detect actual changes
          console.log(`[Throttle] Skipping connectivity event (${timeSinceLastEvent}ms since last)`);
          return;
        }

        const payload = {
          network_type: state.type ? String(state.type).toLowerCase() : null,
          is_connected: state.isConnected ?? null,
          is_internet_reachable: state.isInternetReachable ?? null,
          carrier: (state as any)?.carrier ?? null,
          event_type: eventType,
          app_collected_at: new Date().toISOString(),
          platform: Platform.OS,
        };

        // Log can_sell_snapshot behavior for debugging
        console.log('[Connectivity] Ingesting event', {
          network_type: payload.network_type,
          is_connected: payload.is_connected,
          can_sell_snapshot: permission.can_sell,
          event_type: eventType,
        });

        const success = await ingestConnectivityEvent({
          userId,
          deviceInstallId,
          permission,
          payload,
        });

        if (success) {
          lastConnectivityEventAt.current = now;
          console.log('[Connectivity] Event inserted successfully');
        } else {
          console.log('[Connectivity] Event insertion blocked by permission gating');
        }
      } catch (err) {
        console.warn('connectivity event capture failed:', err);
      }
    },
    [deviceInstallId],
  );

  useEffect(() => {
    const sendConnectivitySnapshot = async (eventType: 'snapshot' | 'transition') => {
      const userId = await getSessionUserId();
      if (!userId) return;

      let perms = modulePermissions;
      if (!perms['connectivity']) {
        perms = await refreshModulePermissions(userId);
      }

      await collectConnectivitySnapshot(
        userId,
        perms['connectivity'] ?? null,
        eventType,
      );
    };

    (async () => {
      try {
        const snap = await collectSnapshot(consent);
        setSnapshot(snap);
      } catch (err) {
        console.warn('Failed to collect initial snapshot:', err);
      }

      try {
        const remoteDemographics = await loadDemographics();
        if (remoteDemographics) setDemographicsState(remoteDemographics);
      } catch {}

      try {
        const remoteConsent = await loadConsent();
        if (remoteConsent) setConsentState(remoteConsent);
      } catch {}

      try {
        const id = await registerDevice();
        if (id) setDeviceId(id);
      } catch {}

      try {
        const userId = await getSessionUserId();
        if (userId) {
          const permissions = await refreshModulePermissions(userId);
          await collectConnectivitySnapshot(
            userId,
            permissions['connectivity'] ?? null,
            'snapshot',
          );
        }
      } catch (err) {
        console.warn('Failed to initialize connectivity permissions:', err);
      }
    })();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        await sendConnectivitySnapshot('snapshot');
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const networkSubscription = Network.addNetworkStateListener(async () => {
      await sendConnectivitySnapshot('snapshot');
    });

    return () => {
      appStateSubscription.remove();
      networkSubscription.remove?.();
    };
  }, [collectConnectivitySnapshot, consent, refreshModulePermissions]);

  const refreshSnapshot = useCallback(async () => {
    const snap = await collectSnapshot(consent);
    setSnapshot(snap);
  }, [consent]);

  const setDemographics = useCallback((d: Demographics) => {
    setDemographicsState(d);
  }, []);

  const persistDemographics = useCallback(async (d: Demographics) => {
    setDemographicsState(d);
    return saveDemographicsWithEvent(d);
  }, []);

  const setConsent = useCallback((c: ConsentPreferences) => {
    setConsentState(c);
  }, []);

  const persistConsent = useCallback(async (c: ConsentPreferences) => {
    setConsentState(c);
    return saveConsentRemote(c);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const result: SyncResult = await syncAll(consent);

      // Log sync result for debugging
      console.log('[Sync] Result:', {
        deviceRegistered: result.deviceRegistered,
        modules: result.events,
      });

      // Check which modules inserted successfully
      const successfulModules = Object.entries(result.events)
        .filter(([, success]) => success === true)
        .map(([module]) => module);

      const hasModuleEvents = successfulModules.length > 0;

      // Create feedback message
      let message = '';
      if (hasModuleEvents) {
        message = `Synced: ${successfulModules.join(', ')}`;
        setLastSyncedAt(new Date().toISOString());
        const snap = await collectSnapshot(consent);
        setSnapshot(snap);
      } else {
        message =
          'No module events synced. Enable Collect for at least one module in Settings.';
      }

      // Store detailed feedback
      const feedback: SyncFeedback = {
        timestamp: new Date().toISOString(),
        modules: result.events,
        message,
      };
      setLastSyncFeedback(feedback);

      console.log('[Sync] Feedback:', feedback);

      return hasModuleEvents;
    } finally {
      setSyncing(false);
    }
  }, [consent]);

  const value: DataContextValue = {
    snapshot,
    demographics,
    consent,
    contributing,
    syncing,
    lastSyncedAt,
    lastSyncFeedback,
    deviceId,
    refreshSnapshot,
    setDemographics,
    persistDemographics,
    setConsent,
    persistConsent,
    syncNow,
    refreshModulePermissions,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useDataContext must be used inside a <DataProvider>');
  }
  return ctx;
}

export const useData = useDataContext;
