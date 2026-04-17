import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import {
  collectSnapshot,
  registerDevice,
  uploadSnapshot,
  loadDemographics,
  saveDemographics as saveDemographicsRemote,
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

type DataContextValue = {
  snapshot: DeviceSnapshot | null;
  demographics: Demographics;
  consent: ConsentPreferences;
  contributing: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  deviceId: string | null;

  refreshSnapshot: () => Promise<void>;
  setDemographics: (d: Demographics) => void;
  persistDemographics: (d: Demographics) => Promise<boolean>;
  setConsent: (c: ConsentPreferences) => void;
  persistConsent: (c: ConsentPreferences) => Promise<boolean>;
  syncNow: () => Promise<boolean>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);
  const [demographics, setDemographicsState] = useState<Demographics>(EMPTY_DEMOGRAPHICS);
  const [consent, setConsentState] = useState<ConsentPreferences>(DEFAULT_CONSENT);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [modulePermissions, setModulePermissions] = useState<Record<string, ModulePermission>>({});
  const appState = useRef(AppState.currentState);
  const deviceInstallId = getDeviceInstallId();

  const contributing =
    consent.deviceInfo ||
    consent.demographics ||
    consent.usageTelemetry ||
    consent.locationData ||
    consent.appUsage;

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
        const payload = {
          network_type: state.type ? String(state.type).toLowerCase() : null,
          is_connected: state.isConnected ?? null,
          is_internet_reachable: state.isInternetReachable ?? null,
          carrier: (state as any)?.carrier ?? null,
          event_type: eventType,
        };

        await ingestConnectivityEvent({
          userId,
          deviceInstallId,
          permission,
          payload,
        });
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

      const permissions =
        modulePermissions.connectivity ??
        (await refreshModulePermissions(userId));

      await collectConnectivitySnapshot(
        userId,
        permissions.connectivity ?? null,
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
            permissions.connectivity ?? null,
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
  }, [collectConnectivitySnapshot, consent, modulePermissions.connectivity, refreshModulePermissions]);

  const refreshSnapshot = useCallback(async () => {
    const snap = await collectSnapshot(consent);
    setSnapshot(snap);
  }, [consent]);

  const setDemographics = useCallback((d: Demographics) => {
    setDemographicsState(d);
  }, []);

  const persistDemographics = useCallback(async (d: Demographics) => {
    setDemographicsState(d);
    return saveDemographicsRemote(d);
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
      const result = await syncAll(consent);
      if (result.snapshotUploaded) {
        setLastSyncedAt(new Date().toISOString());
        const snap = await collectSnapshot();
        setSnapshot(snap);
      }
      return result.snapshotUploaded;
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
    deviceId,
    refreshSnapshot,
    setDemographics,
    persistDemographics,
    setConsent,
    persistConsent,
    syncNow,
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
