import { create } from 'zustand';

/**
 * System Status Store
 * Tracks the operational status of key system components
 */
interface SystemStatusStore {
  // Status flags
  droneActive: boolean;
  streamActive: boolean;
  edgeProcessing: boolean;
  sessionId: string | null;
  currentQoSProfile: string;
  qodSessionId: string | null;

  // Actions
  setDroneActive: (active: boolean) => void;
  setStreamActive: (active: boolean) => void;
  setEdgeProcessing: (active: boolean) => void;
  setSessionId: (id: string | null) => void;
  setCurrentQoSProfile: (profile: string) => void;
  setQodSessionId: (id: string | null) => void;
  resetAllStatuses: () => void;
}

export const useSystemStatusStore = create<SystemStatusStore>((set) => ({
  // Initial state - all inactive
  droneActive: false,
  streamActive: false,
  edgeProcessing: false,
  sessionId: null,
  currentQoSProfile: 'QOS_L', // Default to low quality
  qodSessionId: null,

  // Actions
  setDroneActive: (active) => set({ droneActive: active }),
  setStreamActive: (active) => set({ streamActive: active }),
  setEdgeProcessing: (active) => set({ edgeProcessing: active }),
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentQoSProfile: (profile) => set({ currentQoSProfile: profile }),
  setQodSessionId: (id) => set({ qodSessionId: id }),
  resetAllStatuses: () =>
    set({
      droneActive: false,
      streamActive: false,
      edgeProcessing: false,
      sessionId: null,
      currentQoSProfile: 'QOS_L',
      qodSessionId: null,
    }),
}));
