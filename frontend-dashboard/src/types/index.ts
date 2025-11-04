// Location types
export interface Location {
  lat: number;
  lon: number;
  accuracy?: number;
}

// Drone telemetry types
export interface DroneTelemetry {
  location: {
    gps: Location;
    network: Location;
    fused: Location;
  };
  flight: {
    altitude: number; // meters AGL
    speed: number; // km/h
    heading: number; // degrees
    roll: number;
    pitch: number;
  };
  battery: {
    percentage: number;
    voltage: number;
    estimatedFlightTime: number; // seconds
  };
}

// Network metrics types
export interface NetworkMetrics {
  connectivity: {
    status: 'connected' | 'degraded' | 'disconnected';
    networkType: '4G' | '5G';
    signalStrength: number; // dBm
  };
  performance: {
    latency: number; // ms
    jitter: number; // ms
    packetLoss: number; // percentage
    throughput: {
      download: number; // bps
      upload: number; // bps
    };
  };
}

// QoS types
export interface QoSProfile {
  name: 'QOS_H' | 'QOS_M' | 'QOS_L';
  maxUpstreamRate: number; // bps
  maxDownstreamRate: number; // bps
  jitter: number; // ms
  packetErrorLossRate: number; // percentage
}

export interface QoSStatus {
  profile: 'QOS_H' | 'QOS_L' | 'QOS_M';
  status: 'active' | 'degraded' | 'expired';
  guaranteedBandwidth: number; // bps
  sessionExpiry: string; // ISO timestamp
}

// Edge analysis types
export interface HeatSignature {
  id: string;
  location: Location;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  confidence: number; // 0-1
  timestamp: string;
}

export interface FireSpreadPrediction {
  direction: string; // e.g., 'northeast'
  speedKmh: number;
  predictedAreaKm2: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface EdgeAnalysisResults {
  heatSignatures: HeatSignature[];
  fireSpreadPrediction: FireSpreadPrediction;
  smokeCoveragePercent: number;
  personsDetected: number;
  statistics: {
    totalHeatSignatures: number;
    smokeCoveragePercent: number;
    fireIntensity: 'low' | 'medium' | 'high' | 'extreme';
    personsDetected: number;
  };
}

// Population density types
export interface PopulationDensityCell {
  latitude: number;
  longitude: number;
  deviceCount: number;
  densityLevel: 'low' | 'medium' | 'high';
}

export interface PopulationDensityData {
  gridCells: PopulationDensityCell[];
  totalDevices: number;
  peakDensity: {
    latitude: number;
    longitude: number;
    deviceCount: number;
  };
}

// Mission types
export interface MissionState {
  incidentId: string;
  incidentType: string;
  location: Location;
  startTime: string;
  missionStatus: 'idle' | 'active' | 'completed' | 'emergency';
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'geofence' | 'battery' | 'connection' | 'fire';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

// Geofence types
export interface GeofencePolygon {
  coordinates: number[][][]; // GeoJSON polygon format
}

// AI Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  result: any;
}
