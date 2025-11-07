import { create } from 'zustand';

// Melbourne CBD base location (Fire Station HQ)
const MELBOURNE_CBD_BASE = {
  lat: -37.8136,
  lon: 144.9631,
  name: 'Fire Station HQ',
};

/**
 * Map Store
 * Manages all map-related state including markers and locations
 */
interface MapStore {
  // Map state
  mapCenter: { lat: number; lon: number };
  baseLocation: { lat: number; lon: number; name: string } | null;
  incidentLocation: { lat: number; lon: number; address: string } | null;
  droneKitLocation: { lat: number; lon: number } | null;
  edgeNodeLocation: { lat: number; lon: number; name: string } | null;
  geofencingCircle: { lat: number; lon: number; radius: number } | null;

  // Actions
  setMapCenter: (center: { lat: number; lon: number }) => void;
  moveMapToAddress: (address: string, lat: number, lon: number) => void;
  addDroneKitMarker: (lat: number, lon: number) => void;
  addEdgeNodeMarker: (lat: number, lon: number, zoneName: string) => void;
  addGeofencingCircle: (lat: number, lon: number, radius: number) => void;
  clearGeofencingCircle: () => void;
  resetMapState: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  // Initial state
  mapCenter: { lat: MELBOURNE_CBD_BASE.lat, lon: MELBOURNE_CBD_BASE.lon },
  baseLocation: MELBOURNE_CBD_BASE,
  incidentLocation: null,
  droneKitLocation: null,
  edgeNodeLocation: null,
  geofencingCircle: null,

  // Actions
  setMapCenter: (center) => set({ mapCenter: center }),

  moveMapToAddress: (address, lat, lon) =>
    set({
      mapCenter: { lat, lon },
      incidentLocation: { lat, lon, address },
    }),

  addDroneKitMarker: (lat, lon) => {
    // Add small offset to avoid overlapping with incident marker
    // Offset by ~100m (0.001 degrees) to the east and slightly north
    const offsetLat = lat + 0.001;
    const offsetLon = lon + 0.001;

    set({
      droneKitLocation: { lat: offsetLat, lon: offsetLon },
      baseLocation: null, // Clear CBD base marker
    });
  },

  addEdgeNodeMarker: (lat, lon, zoneName) =>
    set({
      edgeNodeLocation: { lat, lon, name: zoneName },
    }),

  addGeofencingCircle: (lat, lon, radius) =>
    set({
      geofencingCircle: { lat, lon, radius },
    }),

  clearGeofencingCircle: () => set({ geofencingCircle: null }),

  resetMapState: () =>
    set({
      mapCenter: { lat: MELBOURNE_CBD_BASE.lat, lon: MELBOURNE_CBD_BASE.lon },
      baseLocation: MELBOURNE_CBD_BASE,
      incidentLocation: null,
      droneKitLocation: null,
      edgeNodeLocation: null,
      geofencingCircle: null,
    }),
}));
