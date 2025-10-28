// src/context/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

export type Demographics = {
  ageRange: string;          // "18-24", "25-34", etc.
  industry: string;
  region: string;            // ZIP or state
  householdSize: string;     // "1", "2", "3-4", "5+"
  devicesOwned: string[];    // ["iPhone","PS5","EV"]
};

export type DeviceSnapshot = {
  platform: string;
  modelName: string | null;
  osVersion: string | null;
  batteryLevel: number | null;        // 0-1
  lowPowerMode: boolean | null;
  timestamp: number;
};

type DataContextType = {
  demographics: Demographics;
  setDemographics: (d: Demographics) => void;

  snapshot: DeviceSnapshot | null;
  refreshSnapshot: () => Promise<void>;

  contributing: boolean;
  setContributing: (v: boolean) => void;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: '',
    industry: '',
    region: '',
    householdSize: '',
    devicesOwned: [],
  });

  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);
  const [contributing, setContributing] = useState<boolean>(true);

  // grab initial snapshot once on mount
  useEffect(() => {
    refreshSnapshot();
  }, []);

  async function refreshSnapshot() {
    try {
      const batteryState = await Battery.getBatteryStateAsync();
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();

      const snap: DeviceSnapshot = {
        platform: Platform.OS,
        modelName: Device.modelName ?? null,
        osVersion: Device.osVersion ?? null,
        batteryLevel: batteryLevel ?? null,
        lowPowerMode: lowPowerMode ?? null,
        timestamp: Date.now(),
      };

      setSnapshot(snap);
    } catch (err) {
      console.warn('Failed to collect device snapshot', err);
    }
  }

  return (
    <DataContext.Provider
      value={{
        demographics,
        setDemographics,
        snapshot,
        refreshSnapshot,
        contributing,
        setContributing,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used inside DataProvider');
  return ctx;
}
