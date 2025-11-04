# Disaster Response Drone Dashboard

A comprehensive React + TypeScript dashboard for coordinating drone operations during bushfire response scenarios using CAMARA network APIs. Built with Vite, Tailwind CSS, and Leaflet for an interactive operator interface.

## 🚀 Quick Start

```bash
# Navigate to dashboard directory
cd frontend-dashboard

# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Open browser
open http://localhost:5173
```

**Note**: Make sure the backend API is running on port 4000 with a valid Gemini API key before starting the dashboard.

## 📦 What's Built

### Dashboard Modes

The dashboard operates in two modes:

- **Normal Mode**: General operations, checking status, managing subscriptions
- **Incident Mode**: Active disaster response with full telemetry and video streaming

### ✅ Core Components (Fully Implemented)

#### 1. Header Component (`src/components/Header/`)

- Mission status indicators (Drone, Stream, Edge Processing) with color-coded badges
- Mission timer showing elapsed time since incident start
- Emergency stop button
- Incident location display
- Mode indicator (Normal/Incident)

#### 2. Interactive Map View (`src/components/Map/`) - Leaflet

- **MapView.tsx**: Base map with OpenStreetMap tiles
- **DeviceCountHeatmap.tsx**: Population density (blue → yellow → red)
- **Geofencing.tsx**: Purple dashed 200m radius circle
- **DroneMarker.tsx**: Real-time position with heading indicator
- **DroneTrail.tsx**: Flight path history
- **HeatSignatures.tsx**: Pulsing red circles for fires
- **EdgeNodeMarker.tsx**: Server icon for edge location
- **IncidentMarker.tsx**: Flag marker for bushfire
- Layer toggles for selective visibility

#### 3. Video Stream Viewer (`src/components/Video/`)

- Video player with static placeholder (WebRTC-ready)
- Stream quality badge (HD/SD/Poor)
- Thermal overlay toggle
- Analysis overlay toggle (detection bounding boxes)
- Fullscreen control

#### 4. Telemetry Panel (`src/components/Telemetry/`)

- Flight metrics: Altitude, speed, heading
- Compass rose with dynamic heading
- Battery gauge with warnings (<20% red, <50% yellow)
- Signal strength with dBm values
- Location fusion: GPS, Network, Fused coords

#### 5. Network Metrics Panel (`src/components/Metrics/`)

- KPI cards: Latency, Jitter, Packet Loss, Throughput
- Network type badge (4G/5G) with signal
- Reachability status (DATA/SMS)
- QoS badge (QOS_H/QOS_M/QOS_L) with session ID
- Latency timeline chart (Recharts, 5 min history)
- Bandwidth visualization bars

#### 6. Edge Node Analysis (`src/components/Analysis/`)

- Fire spread prediction: Direction, speed, risk level
- Heat signatures list with intensity and confidence
- Statistics: Detections, smoke %, fire intensity
- Anomaly alerts panel

#### 7. AI Assistant Chatbot (`src/components/AI/`)

- Scrollable message history
- Message types: User (blue), Assistant (gray), System (amber)
- Tool calling visualization: Function name, args, status
- Suggested action buttons
- Auto-resize input field
- SSE streaming responses
- Loading indicator

## 📝 Static Data

The dashboard uses static/mock data for demonstration:

- **Incident Location**: Dandenong Ranges, VIC (-37.8136, 144.9631)
- **Drone Telemetry**: Altitude 150m, Speed 25km/h, Battery 78%
- **Network**: 5G, 18ms latency, 45Mbps download
- **Device Count**: 50-100 devices (randomized)
- **Heat Signatures**: 3 detected with varying intensities
- **Fire Spread**: Northeast, 12 km/h, High risk
