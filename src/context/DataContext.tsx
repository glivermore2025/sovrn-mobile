import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';

type DeviceInfo = {
  manufacturer: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  batteryLevel: number | null;   // 0–1 (e.g. 0.72)
  isCharging: boolean | null;
  networkType: string | null;    // "WIFI" / "CELLULAR" / etc.
};

const DataContext = createContext<DeviceInfo | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<DeviceInfo>({
    manufacturer: null,
    modelName: null,
    osName: null,
    osVersion: null,
    batteryLevel: null,
    isCharging: null,
    networkType: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Device info
       // Use sync fields available in expo-device for SDK 53
        const manufacturer =
          // some platforms expose 'manufacturer', others only 'brand'
          (Device as any).manufacturer ?? (Device as any).brand ?? null;
        const modelName = Device.modelName ?? null;
        const osName = Device.osName ?? null;
        const osVersion = Device.osVersion ?? null;

        // Battery info
        const batteryLevel = await Battery.getBatteryLevelAsync(); // 0..1
        const powerState = await Battery.getPowerStateAsync();
        const batteryState = (powerState as any)?.batteryState;

        // Treat CHARGING and FULL as “plugged in”
        const isCharging =
          batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL
            ? true
            : batteryState === Battery.BatteryState.UNPLUGGED
            ? false
            : null;

        // Network info
        const net = await Network.getNetworkStateAsync();
        const networkType = net?.type ?? null; // "WIFI" | "CELLULAR" | etc.

        setInfo({
          manufacturer,
          modelName,
          osName,
          osVersion,
          batteryLevel: batteryLevel ?? null,
          isCharging,
          networkType: networkType ?? null,
        });
      } catch (err) {
        console.warn('Failed to gather device info:', err);
      }
    };

    load();
  }, []);

  return (
    <DataContext.Provider value={info}>
      {children}
    </DataContext.Provider>
  );
}

// ✅ this is what App.tsx is trying to import
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    // This helps catch cases where we forgot <DataProvider>
    throw new Error('useData must be used inside a <DataProvider>');
  }
  return ctx;
}
