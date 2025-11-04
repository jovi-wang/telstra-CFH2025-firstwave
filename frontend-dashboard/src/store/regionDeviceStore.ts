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
 * Stores device count readings from different locations for heatmap visualization
 */
interface RegionDeviceStore {
  // Device count data points
  deviceCountPoints: DeviceCountPoint[];

  // Actions
  addDeviceCountPoint: (point: DeviceCountPoint) => void;
  clearDeviceCountPoints: () => void;
}

export const useRegionDeviceStore = create<RegionDeviceStore>((set) => ({
  // Initial state - empty array
  deviceCountPoints: [],

  // Actions
  addDeviceCountPoint: (point) =>
    set({
      // Replace with only the latest point (no historical data)
      deviceCountPoints: [point],
    }),

  clearDeviceCountPoints: () =>
    set({
      deviceCountPoints: [],
    }),
}));
