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
  damageHotspots: [
    {
      id: 'dh-001',
      location: { lat: -37.8136, lon: 144.9631 },
      type: 'downed_line',
      severity: 'severe',
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'dh-002',
      location: { lat: -37.814, lon: 144.9635 },
      type: 'damaged_pole',
      severity: 'moderate',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'dh-003',
      location: { lat: -37.8145, lon: 144.964 },
      type: 'transformer_damage',
      severity: 'critical',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    },
  ],
  damageSeverityAssessment: {
    affectedDirection: 'northeast',
    spreadRateKmh: 2,
    affectedAreaKm2: 2.5,
    severityLevel: 'severe',
    estimatedRepairTimeHours: 4,
  },
  affectedAreaPercent: 45,
  customersAffected: 2500,
  statistics: {
    totalDamageHotspots: 15,
    affectedAreaPercent: 45,
    damageSeverity: 'severe',
    customersAffected: 2500,
  },
};

// Static mission state
export const staticMissionState: MissionState = {
  incidentId: 'INC-2025-001',
  incidentType: 'Power Outage',
  location: INCIDENT_LOCATION,
  startTime: new Date(Date.now() - 900000).toISOString(), // Started 15 minutes ago
  missionStatus: 'active',
  alerts: [
    {
      id: 'alert-001',
      type: 'outage',
      severity: 'critical',
      message: 'New damage hotspot detected at -37.8145, 144.9640',
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
