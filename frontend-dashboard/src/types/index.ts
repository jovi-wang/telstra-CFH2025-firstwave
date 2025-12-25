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

// Edge analysis types
export interface DamageHotspot {
  id: string;
  location: Location;
  type: 'downed_line' | 'damaged_pole' | 'transformer_damage' | 'vegetation' | 'unknown';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  confidence: number; // 0-1
  timestamp: string;
}

export interface DamageSeverityAssessment {
  affectedDirection: string; // e.g., 'northeast'
  spreadRateKmh: number; // How fast outage is spreading
  affectedAreaKm2: number;
  severityLevel: 'minor' | 'moderate' | 'severe' | 'critical';
  estimatedRepairTimeHours: number;
}

export interface EdgeAnalysisResults {
  damageHotspots: DamageHotspot[];
  damageSeverityAssessment: DamageSeverityAssessment;
  affectedAreaPercent: number;
  customersAffected: number;
  statistics: {
    totalDamageHotspots: number;
    affectedAreaPercent: number;
    damageSeverity: 'minor' | 'moderate' | 'severe' | 'critical';
    customersAffected: number;
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
  type: 'geofence' | 'battery' | 'connection' | 'outage';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

// AI Chat types
export interface ToolCall {
  tool: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}
