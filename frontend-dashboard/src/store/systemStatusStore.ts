import { create } from 'zustand';

/**
 * Edge Deployment interface
 */
export interface EdgeDeployment {
  deploymentId: string;
  imageId: string;
  zoneName: string;
  status: string;
}

/**
 * System Status Store
 * Tracks the operational status of key system components
 */
interface SystemStatusStore {
  // Status flags
  isEmergencyMode: boolean;
  droneActive: boolean;
  streamActive: boolean;
  edgeProcessing: boolean;
  sessionId: string | null;
  currentQoSProfile: string;
  qodSessionId: string | null;
  edgeDeployment: EdgeDeployment | null;

  // Actions
  setEmergencyMode: (active: boolean) => void;
  toggleEmergencyMode: () => void;
  setDroneActive: (active: boolean) => void;
  setStreamActive: (active: boolean) => void;
  setEdgeProcessing: (active: boolean) => void;
  setSessionId: (id: string | null) => void;
  setCurrentQoSProfile: (profile: string) => void;
  setQodSessionId: (id: string | null) => void;
  updateEdgeDeployment: (
    deploymentId: string,
    imageId: string,
    zoneName: string,
    status: string
  ) => void;
  clearEdgeDeployment: () => void;
  resetAllStatuses: () => void;
}

export const useSystemStatusStore = create<SystemStatusStore>((set, get) => ({
  // Initial state - all inactive
  isEmergencyMode: false,
  droneActive: false,
  streamActive: false,
  edgeProcessing: false,
  sessionId: null,
  currentQoSProfile: 'QOS_L', // Default to low quality
  qodSessionId: null,
  edgeDeployment: null,

  // Actions
  setEmergencyMode: (active) => set({ isEmergencyMode: active }),
  toggleEmergencyMode: () => set({ isEmergencyMode: !get().isEmergencyMode }),
  setDroneActive: (active) => set({ droneActive: active }),
  setStreamActive: (active) => set({ streamActive: active }),
  setEdgeProcessing: (active) => set({ edgeProcessing: active }),
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentQoSProfile: (profile) => set({ currentQoSProfile: profile }),
  setQodSessionId: (id) => set({ qodSessionId: id }),
  updateEdgeDeployment: (deploymentId, imageId, zoneName, status) =>
    set({
      edgeDeployment: { deploymentId, imageId, zoneName, status },
    }),
  clearEdgeDeployment: () => set({ edgeDeployment: null }),
  resetAllStatuses: () =>
    set({
      isEmergencyMode: false,
      droneActive: false,
      streamActive: false,
      edgeProcessing: false,
      sessionId: null,
      currentQoSProfile: 'QOS_L',
      qodSessionId: null,
      edgeDeployment: null,
    }),
}));
