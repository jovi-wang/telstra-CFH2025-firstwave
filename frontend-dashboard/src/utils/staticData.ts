import type {
  DroneTelemetry,
  NetworkMetrics,
  QoSProfile,
  EdgeAnalysisResults,
  MissionState,
} from '../types';

// Test coordinates (Dandenong Ranges, VIC, Australia)
export const INCIDENT_LOCATION = {
  lat: -37.8136,
  lon: 144.9631,
};

// Static drone telemetry
export const staticDroneTelemetry: DroneTelemetry = {
  location: {
    gps: { lat: -37.814, lon: 144.9635, accuracy: 3 },
    network: { lat: -37.8141, lon: 144.9636, accuracy: 10 },
    fused: { lat: -37.814, lon: 144.9635, accuracy: 2 },
  },
  flight: {
    altitude: 150,
    speed: 25,
    heading: 45,
    roll: 2,
    pitch: -1,
  },
  battery: {
    percentage: 78,
    voltage: 22.4,
    estimatedFlightTime: 754, // ~12.5 minutes
  },
};

// Static network metrics
export const staticNetworkMetrics: NetworkMetrics = {
  connectivity: {
    status: 'connected',
    networkType: '5G',
    signalStrength: -75,
  },
  performance: {
    latency: 18,
    jitter: 3,
    packetLoss: 0.2,
    throughput: {
      download: 45000000, // 45 Mbps
      upload: 25000000, // 25 Mbps
    },
  },
};

// Static QoS profiles
export const staticQoSProfiles: QoSProfile[] = [
  {
    name: 'QOS_H',
    maxDownstreamRate: 50000000, // 50 Mbps
    maxUpstreamRate: 20000000, // 20 Mbps
    jitter: 5, // ms
    packetErrorLossRate: 0.01, // percentage
  },
  {
    name: 'QOS_M',
    maxDownstreamRate: 25000000, // 25 Mbps
    maxUpstreamRate: 10000000, // 10 Mbps
    jitter: 10, // ms
    packetErrorLossRate: 0.1, // percentage
  },
  {
    name: 'QOS_L',
    maxDownstreamRate: 10000000, // 10 Mbps
    maxUpstreamRate: 5000000, // 5 Mbps
    jitter: 20, // ms
    packetErrorLossRate: 0.5, // percentage
  },
];

// Static edge node analysis results
export const staticEdgeAnalysis: EdgeAnalysisResults = {
  heatSignatures: [
    {
      id: 'hs-001',
      location: { lat: -37.8136, lon: 144.9631 },
      intensity: 'high',
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'hs-002',
      location: { lat: -37.814, lon: 144.9635 },
      intensity: 'medium',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'hs-003',
      location: { lat: -37.8145, lon: 144.964 },
      intensity: 'extreme',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    },
  ],
  fireSpreadPrediction: {
    direction: 'northeast',
    speedKmh: 12,
    predictedAreaKm2: 2.5,
    riskLevel: 'high',
  },
  smokeCoveragePercent: 45,
  personsDetected: 0,
  statistics: {
    totalHeatSignatures: 15,
    smokeCoveragePercent: 45,
    fireIntensity: 'high',
    personsDetected: 0,
  },
};

// Static mission state
export const staticMissionState: MissionState = {
  incidentId: 'INC-2025-001',
  incidentType: 'Bushfire',
  location: INCIDENT_LOCATION,
  startTime: new Date(Date.now() - 900000).toISOString(), // Started 15 minutes ago
  missionStatus: 'active',
  alerts: [
    {
      id: 'alert-001',
      type: 'fire',
      severity: 'critical',
      message: 'New heat signature detected at -37.8145, 144.9640',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
  ],
};

// Quality history for charts
export const staticQualityHistory = [
  { timestamp: '10:00:00', latency: 20, throughput: 43000000, packetLoss: 0.3 },
  { timestamp: '10:00:05', latency: 18, throughput: 45000000, packetLoss: 0.2 },
  { timestamp: '10:00:10', latency: 22, throughput: 42000000, packetLoss: 0.4 },
  { timestamp: '10:00:15', latency: 19, throughput: 44000000, packetLoss: 0.2 },
  { timestamp: '10:00:20', latency: 18, throughput: 45000000, packetLoss: 0.2 },
];
