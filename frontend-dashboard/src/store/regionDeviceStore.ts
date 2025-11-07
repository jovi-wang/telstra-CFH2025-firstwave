import { create } from 'zustand';

/**
 * Region Device Count Data Point
 */
export interface DeviceCountPoint {
  lat: number;
  lon: number;
  device_count: number;
  radius: number;
  timestamp: string;
}

/**
 * Region Device Count Store
 * Stores the latest device count reading for heatmap visualization
 */
interface RegionDeviceStore {
  // Latest device count data point
  deviceCountPoint: DeviceCountPoint | null;

  // Actions
  setDeviceCountPoint: (point: DeviceCountPoint) => void;
  clearDeviceCountPoint: () => void;
}

export const useRegionDeviceStore = create<RegionDeviceStore>((set) => ({
  // Initial state - no point
  deviceCountPoint: null,

  // Actions
  setDeviceCountPoint: (point) =>
    set({
      deviceCountPoint: point,
    }),

  clearDeviceCountPoint: () =>
    set({
      deviceCountPoint: null,
    }),
}));
