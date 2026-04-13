import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
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
} from '../services/syncService';
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

  const contributing =
    consent.deviceInfo ||
    consent.demographics ||
    consent.usageTelemetry ||
    consent.locationData ||
    consent.appUsage;

  useEffect(() => {
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
    })();
  }, []);

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
