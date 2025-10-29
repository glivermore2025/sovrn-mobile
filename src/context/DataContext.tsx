import React, { createContext, useContext, useEffect, useState } from 'react';

type DeviceInfo = {
  manufacturer?: string | null;
  modelName?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  networkType?: string | null;
};

const DataContext = createContext<DeviceInfo | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DeviceInfo>({
    manufacturer: null,
    modelName: null,
    osName: null,
    osVersion: null,
    batteryLevel: null,
    isCharging: null,
    networkType: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function collect() {
      try {
        // dynamic import = don't break web / bundler analysis
        const Device = await import('expo-device');
        const Battery = await import('expo-battery');
        const Network = await import('expo-network');

        const [
          powerState,
          netState,
        ] = await Promise.all([
          Battery.getPowerStateAsync(),
          Network.getNetworkStateAsync(),
        ]);

        if (!isMounted) return;

        setData({
          manufacturer: Device.manufacturer ?? null,
          modelName: Device.modelName ?? null,
          osName: Device.osName ?? null,
          osVersion: Device.osVersion ?? null,
          batteryLevel: powerState?.batteryLevel ?? null,
          isCharging: powerState?.isCharging ?? null,
          networkType: netState?.type ?? null,
        });
      } catch (err) {
        console.warn('Failed to collect device info:', err);
      }
    }

    collect();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

export function useDeviceData() {
  return useContext(DataContext);
}
