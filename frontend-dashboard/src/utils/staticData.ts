import type {
  DroneTelemetry,
  NetworkMetrics,
  QoSProfile,
  QoSStatus,
  EdgeAnalysisResults,
  PopulationDensityData,
  MissionState,
  GeofencePolygon,
  ChatMessage,
} from '../types';

// Test coordinates (Dandenong Ranges, VIC, Australia)
export const INCIDENT_LOCATION = {
  lat: -37.8136,
  lon: 144.9631,
};

export const EDGE_NODE_LOCATION = {
  lat: -37.815,
  lon: 144.965,
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

// Static QoS status
export const staticQoSStatus: QoSStatus = {
  profile: 'QOS_L',
  status: 'active',
  guaranteedBandwidth: 25000000, // 25 Mbps
  sessionExpiry: new Date(Date.now() + 3600000).toISOString(),
};

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

// Static population density data
export const staticPopulationDensity: PopulationDensityData = {
  gridCells: [
    {
      latitude: -37.8136,
      longitude: 144.9631,
      deviceCount: 450,
      densityLevel: 'high',
    },
    {
      latitude: -37.814,
      longitude: 144.9635,
      deviceCount: 280,
      densityLevel: 'medium',
    },
    {
      latitude: -37.813,
      longitude: 144.9625,
      deviceCount: 120,
      densityLevel: 'low',
    },
    {
      latitude: -37.8145,
      longitude: 144.964,
      deviceCount: 380,
      densityLevel: 'high',
    },
    {
      latitude: -37.8135,
      longitude: 144.962,
      deviceCount: 90,
      densityLevel: 'low',
    },
  ],
  totalDevices: 1250,
  peakDensity: {
    latitude: -37.8136,
    longitude: 144.9631,
    deviceCount: 450,
  },
};

// Static geofence polygon
export const staticGeofence: GeofencePolygon = {
  coordinates: [
    [
      [144.96, -37.81],
      [144.97, -37.81],
      [144.97, -37.82],
      [144.96, -37.82],
      [144.96, -37.81],
    ],
  ],
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

// Static chat messages
export const staticChatMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Mission initialized. I can help you with queries about population density, drone location, stream quality, and more.',
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    role: 'user',
    content: 'How many people are near the fire?',
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    role: 'assistant',
    content:
      'There are approximately 1,250 devices detected within 5km of the incident. The highest concentration is 450 devices at -37.8136, 144.9631.',
    timestamp: new Date(Date.now() - 580000).toISOString(),
    toolCalls: [
      {
        tool: 'Population Density API',
        parameters: {
          location: { lat: -37.8136, lon: 144.9631 },
          radius: 5000,
        },
        result: { totalDevices: 1250 },
      },
    ],
  },
];

// Drone flight path (for trail visualization)
export const staticFlightPath = [
  { lat: -37.8136, lon: 144.9631, timestamp: Date.now() - 600000 },
  { lat: -37.8137, lon: 144.9632, timestamp: Date.now() - 540000 },
  { lat: -37.8138, lon: 144.9633, timestamp: Date.now() - 480000 },
  { lat: -37.8139, lon: 144.9634, timestamp: Date.now() - 420000 },
  { lat: -37.814, lon: 144.9635, timestamp: Date.now() },
];

// Quality history for charts
export const staticQualityHistory = [
  { timestamp: '10:00:00', latency: 20, throughput: 43000000, packetLoss: 0.3 },
  { timestamp: '10:00:05', latency: 18, throughput: 45000000, packetLoss: 0.2 },
  { timestamp: '10:00:10', latency: 22, throughput: 42000000, packetLoss: 0.4 },
  { timestamp: '10:00:15', latency: 19, throughput: 44000000, packetLoss: 0.2 },
  { timestamp: '10:00:20', latency: 18, throughput: 45000000, packetLoss: 0.2 },
];
