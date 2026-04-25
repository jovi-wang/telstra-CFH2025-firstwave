# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a **disaster response drone system dashboard** for a hackathon. The system demonstrates a comprehensive disaster response solution using drones and CAMARA network APIs. The system supports multiple use cases:

### Supported Use Cases

| Branch | Use Case | Edge AI Model | Incident Type |
|--------|----------|---------------|---------------|
| `main` | Bushfire Disaster Response | `fire-spread-prediction:v2.0` | Bushfire |
| `power-outage-response` | Power Outage Response | `damage-assessment:v2.0` | Power Outage |

### Current Branch Configuration
Check your current branch with `git branch` to determine which use case is active.

**Important**: The AI agent system prompt in `backend-api/app/services/ai_agent.py` is hardcoded for the **bushfire response** use case. On the `power-outage-response` branch this prompt is updated for power outage scenarios. The current checked-out branch (`aws-bedrock-model`/`main`) uses the bushfire-specific prompt.

### Common Workflow
When a user reports an incident location via chatbot, the system:

1. Discovers nearest edge node and deploys media server + AI model for video analysis
2. Establishes WebRTC streaming and Quality on Demand for reliable video transmission
3. Monitors drone location with GPS fusion and geofencing
4. Tracks network connectivity (4G/5G), reachability status, and performance metrics
5. Monitors region device count to detect population/customer changes in incident area
6. Provides AI-assisted decision support with natural language queries

### Use Case Specific Details

#### Bushfire Disaster Response (main branch)
- **Purpose**: Monitor and respond to bushfire incidents
- **Edge AI Model**: `fire-spread-prediction:v2.0` - detects thermal signatures, fire intensity, smoke coverage
- **Analysis**: Fire spread prediction, heat signatures, smoke detection
- **Heatmap**: Shows population density in disaster area

#### Power Outage Response (power-outage-response branch)
- **Purpose**: Inspect power infrastructure during outage events for electricity companies
- **Edge AI Model**: `damage-assessment:v2.0` - detects downed lines, damaged poles, transformer damage
- **Analysis**: Damage severity assessment, damage hotspots, affected area coverage
- **Heatmap**: Shows affected customers in outage area

## Technology Stack

- **Frontend**: React 19 with TypeScript + Vite
- **Backend**: FastAPI with Python 3.12
- **AI/LLM**: AWS Bedrock Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) via boto3 Converse API
- **MCP**: FastMCP for Model Context Protocol server
- **Mapping**: Leaflet with React-Leaflet + leaflet.heat for heatmaps
- **Video**: WebRTC (simulated)
- **State Management**: Zustand (multiple stores)
- **API Client**: Fetch API (native browser fetch)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Charting**: Recharts
- **UI Components**: Tailwind CSS, Lucide React icons

## Common Commands

### Backend API (Port 4000)

```bash
cd backend-api
source .venv/bin/activate  # Activate virtual environment
# Note: AWS credentials are hardcoded in app/config.py
uvicorn app.main:app --reload --port 4000
```

**Important**: AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are currently hardcoded in `backend-api/app/config.py`. For production, use environment variables instead.

### Frontend Dashboard (Port 5173)

```bash
cd frontend-dashboard
npm install
npm run dev
```

### Build for Production

```bash
cd frontend-dashboard
npm run build
```

## Architecture Overview

### High-Level Components

1. **React Dashboard** - Central control and visualization interface with:

   - Real-time map with region device count heatmap
   - Drone location tracking (GPS + network fusion)
   - Live video stream display
   - Network connectivity and QoS metrics visualization
   - Geofencing boundary display and alerts
   - Edge node deployment status
   - Event log for subscription notifications
   - AI chatbot interface

2. **AI Agent with LLM** - Intelligent assistant for operators powered by AWS Bedrock Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) via boto3 Converse API with tool calling capabilities to CAMARA APIs via MCP (Model Context Protocol)

3. **FastAPI Backend** - Python backend server with:
   - AI Agent orchestration
   - MCP Client for tool execution
   - SSE streaming for real-time updates
   - Periodic location updates (10s) and device count updates (30s)

4. **MCP Server** - FastMCP-based server providing 14 tools that mock CAMARA APIs:

   - Simple Edge Discovery API
   - Edge Application Management API
   - WebRTC API
   - QoS Profile API
   - Quality on Demand (QoD) API
   - Geofencing Subscriptions API
   - Connectivity Insights API
   - Connectivity Insights Subscriptions API
   - Location Retrieval API
   - Region Device Count API
   - Connected Network Type API
   - Connected Network Type Subscriptions API
   - Device Reachability Status API
   - Device Reachability Status Subscriptions API
   - Number Verify API
   - SIM Swap Detection API
   - Device Swap Detection API
   - Network Slice Booking API (optional)

### Project Structure

```
/
├── frontend-dashboard/       # React frontend (port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                      # Mission status header
│   │   │   ├── MapView.tsx                     # Leaflet map with all overlays
│   │   │   ├── VideoStreamViewer.tsx           # Video stream viewer
│   │   │   ├── TelemetryPanel.tsx              # Drone telemetry panel
│   │   │   ├── NetworkMetricsPanel.tsx         # Network metrics panel
│   │   │   ├── EdgeAnalysisResults.tsx         # Edge node analysis
│   │   │   ├── AIAssistantChatbot.tsx          # AI assistant chatbot
│   │   │   ├── StatusPanel.tsx                 # Status panel (normal mode)
│   │   │   ├── ActiveSubscriptionsPanel.tsx    # Active subscriptions panel
│   │   │   ├── EventNotification.tsx           # Event notification component
│   │   │   └── NotificationContainer.tsx       # Notification container
│   │   ├── services/
│   │   │   ├── backendAPI.ts         # Backend API client (native fetch)
│   │   │   └── eventStreamService.ts # Event stream handler (SSE)
│   │   ├── store/
│   │   │   ├── chatStore.ts              # Chat state management
│   │   │   ├── mapStore.ts               # Map markers and overlays state
│   │   │   ├── regionDeviceStore.ts      # Region device count state
│   │   │   ├── subscriptionsStore.ts     # Active subscriptions state
│   │   │   └── systemStatusStore.ts      # System status state
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript interfaces
│   │   ├── utils/                        # Utility functions
│   │   └── App.tsx                       # Main layout with normal/emergency modes
│   └── package.json
│
├── backend-api/              # FastAPI backend (port 4000)
│   ├── app/
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py           # Chat endpoints (POST /api/chat/message)
│   │   │   └── events.py         # SSE event stream endpoints (GET /api/events/stream)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ai_agent.py       # AI agent orchestration
│   │   │   ├── llm_service.py    # AWS Bedrock Claude client (via boto3 Converse API)
│   │   │   ├── mcp_client.py     # MCP client (connects to mcp_server)
│   │   │   └── mcp_server.py     # MCP server with 14 tools (FastMCP)
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point with lifespan management
│   │   └── config.py             # Configuration (hardcoded settings)
│   ├── .venv/                    # Virtual environment
│   ├── pyproject.toml            # Python dependencies (fastapi, httpx, mcp, boto3, sse-starlette, uvicorn)
│   ├── uv.lock                   # Dependency lock file
│   └── README.md                 # Backend documentation
│
├── AGENTS.md                     # This file
├── README.md                     # Root documentation
└── images/
    ├── dashboard-normal.png      # Screenshot (normal mode)
    └── dashboard-incident.png    # Screenshot (incident mode)
```

## Mission Flow Sequence

The complete mission follows this 16-step sequence (workflow is the same for both use cases, with context-specific details):

### Phase 0: Incident Initiation

1. **User reports incident location** via chatbot (street address or lat/lon coordinates)
   - Bushfire: "A bushfire is reported at [address]"
   - Power Outage: "A power outage is reported at [address]"
2. **Response teams and drone deployed** to incident location

### Phase 1: Edge Setup and Deployment (Steps 1-4)

1. **Edge Discovery**: System uses Simple Edge Discovery API to find nearest edge node to incident location
2. **Deploy Edge Applications**: Edge Application Management API deploys:
   - Media server (handles video streaming from drone and forwards to backend)
   - Pre-trained AI model:
     - Bushfire: `fire-spread-prediction:v2.0` (detects thermal, infrared, people, animals, vehicles)
     - Power Outage: `damage-assessment:v2.0` (detects downed lines, damaged poles, transformer damage)
3. **Media Server Registration**: Media server self-registers and receives temporary deviceId, then uses WebRTC APIs to:
   - Register as WebRTC device
   - Receive incoming calls from drone
   - Handle WebRTC sessions
4. **AI Analysis Active**: Edge AI model sends analysis results to backend → displayed on dashboard

### Phase 2: Geofencing and Drone Flight (Steps 5-6)

5. **Geofencing Setup**: Backend uses Geofencing Subscriptions API to track drone location and ensure it stays within designated incident area
6. **Drone Flight Begins**: Operator controls drone, uses WebRTC APIs to stream video to media server at edge node

### Phase 3: Continuous Monitoring (Steps 7-9)

7. **Network Type Monitoring** (via subscriptions): Backend monitors drone's network connectivity type (4G/5G) using Connected Network Type API and reachability status (SMS/DATA) using Device Reachability Status API → displayed on dashboard
8. **Location Tracking** (every 10 seconds): Backend monitors drone location using Location Retrieval API, fused with GPS data → accurate location shown on dashboard map
9. **Region Device Count** (every 30 seconds): Backend uses Region Device Count API to check connected devices in area:
   - Bushfire: Spike = people gathering (rescue attention needed), Drop = network issues
   - Power Outage: Spike = customers restored, Drop = more customers affected
   - Dashboard shows heatmap visualization

### Phase 4: QoS Management (Steps 10-12)

10. **QoS Setup**: When video quality degrades, backend establishes QoS using Quality on Demand API. Three predefined profiles (high/medium/low) created via QoS Profile API
11. **Network Slice (Optional)**: For multiple drones, Network Slice Booking API reserves dedicated network slices for reliable connectivity
12. **Performance Monitoring** (every 10 seconds): Backend monitors connectivity using Connectivity Insights API. When QoS threshold breached → higher QoS profile applied automatically

### Phase 5: Event Subscriptions (Step 13)

13. **Subscription Notifications**: System uses subscription APIs for real-time events:
    - Connectivity Insights Subscriptions (QoS threshold breaches)
    - Connected Network Type Subscriptions (network type changes)
    - Device Reachability Status Subscriptions (reachability status changes)
    - All events captured and displayed in dashboard event log

### Phase 6: AI Assistant Interaction (Step 14)

14. **Chatbot Queries**: Operator asks questions via chatbot powered by AWS Bedrock Claude 3 Haiku with MCP tool calling:
    - "What is the current connectivity status of the drone?"
    - "What is the current location of the drone?"
    - "How many people are in the disaster area?"
    - "What is the QoS used in the session?"

### Phase 7: Mission Completion (Steps 15-16)

15. **Cleanup Operations**: Backend performs cleanup:
    - Terminate WebRTC call between drone and media server
    - Unregister WebRTC device for media server
    - Undeploy media server and AI model via Edge Application Management API
    - Release network slices via Network Slice Booking API (if used)
    - Terminate QoD sessions
    - Delete all subscriptions (geofencing, connectivity, network type, reachability)
16. **Dashboard Status Update**: Chatbot suggests closing incident, dashboard returns to normal (no incident) status

## CAMARA APIs via MCP (Model Context Protocol)

### Implementation Approach

All CAMARA APIs are accessed through **MCP (Model Context Protocol)** tools provided by the FastMCP server (`backend-api/app/services/mcp_server.py`). The AI agent (powered by AWS Bedrock Claude 3 Haiku via boto3 Converse API) calls these tools via natural language requests from the operator.

**MCP Server Configuration** (in `backend-api/app/config.py`):
```python
MCP_SERVER_COMMAND: str = ".venv/bin/python"
MCP_SERVER_ARGS: list[str] = ["-m", "app.services.mcp_server"]
MCP_SERVER_CWD: str = "."
```

The MCP server is automatically started by the MCP client when the FastAPI backend starts up (see `mcp_client.connect()` in `main.py` lifespan function).

### MCP Tools Available (14 Total)

The MCP server provides these tools that mock CAMARA API functionality:

1. **get_qos_profiles** - Get available QoS profiles (QOS_H, QOS_M, QOS_L)
2. **get_connected_network** - Get network type (4G/5G) and reachability status (DATA/SMS)
3. **geocode_address** - Convert street address to lat/lon coordinates (uses OpenStreetMap)
4. **discover_edge_node** - Find closest edge cloud zone
5. **deploy_edge_application** - Deploy application to edge zone (e.g., `fire-spread-prediction:v2.0` or `damage-assessment:v2.0`)
6. **undeploy_edge_application** - Remove deployed application from edge
7. **verify_location** - Verify device location against reference point
8. **subscribe_geofencing** - Create geofencing subscription with radius
9. **unsubscribe_geofencing** - Cancel geofencing subscription
10. **subscribe_connected_network** - Subscribe to network type changes
11. **unsubscribe_connected_network** - Unsubscribe from network type changes
12. **handle_webrtc_call** - Create or cancel WebRTC session
13. **create_quality_on_demand** - Create QoD session with QoS profile
14. **integrity_check** - Pre-flight device integrity check (Number Verify, SIM Swap, Device Swap Detection)

### How It Works

**Operator Flow:**
1. Operator types natural language query in chatbot (e.g., "Check all available QoS profiles")
2. Frontend sends message to backend via fetch POST to `/api/chat/message`
3. Backend's AI Agent uses AWS Bedrock Claude 3 Haiku (via boto3 Converse API) to understand intent
4. Claude calls appropriate MCP tool via function calling
5. MCP server executes tool and returns mocked data
6. AI Agent formats response and streams back to frontend via SSE
7. Frontend receives SSE stream with content deltas, tool calls, and tool results
8. Frontend displays response in chatbot with tool calling visualization

### Example Tool Call Flow

```
User: "Create geofencing subscription at this location with radius of 200m for our drone kit"
  ↓
Claude (AWS Bedrock) detects intent → Calls `subscribe_geofencing` tool
  ↓
MCP Server executes tool:
  - Generates subscription ID (UUID)
  - Returns mock subscription data
  ↓
AI Agent streams response: "Created geofencing subscription [uuid]"
  ↓
Frontend displays:
  - Assistant message with response
  - Tool call visualization showing function name and arguments
  - Dashboard adds geofencing circle to map
```

### Mock Data

All MCP tools return mocked data for hackathon demonstration:
- **QoS Profiles**: QOS_H (50Mbps/20Mbps), QOS_M (25Mbps/10Mbps), QOS_L (10Mbps/5Mbps)
- **Network Status**: 5G, reachable via DATA, dynamic timestamps
- **Location**: Around Melbourne CBD (-37.8136, 144.9631)
- **Device Count**: Random 50-100 devices
- **Subscriptions**: UUID-based subscription IDs

### Authentication

No authentication required - all values are mocked for demonstration purposes.

### QoS Profiles

- `QOS_H`: Extra High (guaranteed 50 Mbps, <10ms latency)
- `QOS_M`: Medium (guaranteed 25 Mbps, <20ms latency)
- `QOS_L`: Low (guaranteed 10 Mbps, <50ms latency)

## Key Data Structures

### Drone Telemetry

```typescript
{
  location: {
    gps: { lat: number, lon: number, accuracy: number },
    network: { lat: number, lon: number, accuracy: number },
    fused: { lat: number, lon: number, accuracy: number }
  },
  flight: {
    altitude: number,      // meters AGL
    speed: number,         // km/h
    heading: number,       // degrees
    roll: number,
    pitch: number
  },
  battery: {
    percentage: number,
    voltage: number,
    estimatedFlightTime: number  // seconds
  }
}
```

### Network Metrics

```typescript
{
  connectivity: {
    status: 'connected' | 'degraded' | 'disconnected',
    networkType: '4G' | '5G',
    signalStrength: number,  // dBm
    reachabilityStatus: {
      sms: 'REACHABLE' | 'NOT_REACHABLE',
      data: 'REACHABLE' | 'NOT_REACHABLE'
    }
  },
  performance: {
    latency: number,        // ms
    jitter: number,         // ms
    packetLoss: number,     // percentage
    throughput: {
      download: number,     // bps
      upload: number        // bps
    }
  },
  qos: {
    profile: 'QOS_H' | 'QOS_M' | 'QOS_L',
    active: boolean,
    sessionId: string
  }
}
```

### Edge Node Analysis

Data structure varies by use case:

#### Bushfire Response (main branch)
```typescript
{
  heatSignatures: Array<{
    id: string,
    location: { lat: number, lon: number },
    intensity: 'low' | 'medium' | 'high' | 'extreme',
    confidence: number        // 0-1
  }>,
  fireSpreadPrediction: {
    direction: string,        // e.g., 'northeast'
    speedKmh: number,
    predictedAreaKm2: number,
    riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  },
  smokeCoveragePercent: number,
  personsDetected: number,
  statistics: {
    totalHeatSignatures: number,
    smokeCoveragePercent: number,
    fireIntensity: 'low' | 'medium' | 'high' | 'extreme',
    personsDetected: number
  }
}
```

#### Power Outage Response (power-outage-response branch)
```typescript
{
  damageHotspots: Array<{
    id: string,
    location: { lat: number, lon: number },
    type: 'downed_line' | 'damaged_pole' | 'transformer_damage' | 'vegetation',
    severity: 'minor' | 'moderate' | 'severe' | 'critical',
    confidence: number        // 0-1
  }>,
  damageSeverityAssessment: {
    affectedDirection: string,        // e.g., 'northeast'
    spreadRateKmh: number,
    affectedAreaKm2: number,
    severityLevel: 'minor' | 'moderate' | 'severe' | 'critical',
    estimatedRepairTimeHours: number
  },
  affectedAreaPercent: number,
  customersAffected: number,
  statistics: {
    totalDamageHotspots: number,
    affectedAreaPercent: number,
    damageSeverity: 'minor' | 'moderate' | 'severe' | 'critical',
    customersAffected: number
  }
}
```

## Display Modes

The dashboard has two display modes that can be toggled via the emergency button in the Header component:

### Mode Switching
- **Toggle**: Click the "EMERGENCY" button in the header to switch between modes
- **Normal Mode**: Default state shown when no incident is active
- **Emergency Mode**: Activated when incident is reported and operational response is needed

The mode determines the layout and which components are visible. The AI Assistant remains visible in both modes for continuous operator interaction.

## Dashboard Components

The dashboard layout changes based on the current display mode:

### Normal Mode (Default)
4-column grid layout:
- **MapView** (2 columns, 50%): Shows base location marker before incident
- **StatusPanel** (1 column, 25%): Shows system status and mission information
- **AIAssistantChatbot** (1 column, 25%): AI assistant interface

### Emergency Mode (During Active Incident)
4-column grid layout with scrollable content:
- **Left Column** (1 column): MapView, ActiveSubscriptionsPanel, TelemetryPanel
- **Right 2 Columns**: VideoStreamViewer, NetworkMetricsPanel, EdgeAnalysisResults
- **AI Assistant** (1 column, 25%): Same as normal mode

### Component Details

#### MapView
- Region device count heatmap (blue → yellow → red gradient using leaflet.heat)
  - Bushfire: Shows population density in disaster area
  - Power Outage: Shows affected customers in outage area
- Base location marker (First Wave HQ - Melbourne CBD)
- Incident location marker (red marker)
- Drone kit location marker (blue marker with small offset to avoid overlap)
- Edge node marker (green marker)
- Geofencing circle (purple dashed boundary)
- Map centers on markers when added via chatbot commands

#### VideoStreamViewer
- 16:9 aspect ratio video player
- Simulated video stream display
- Shows when edge deployment is active

#### TelemetryPanel
- Flight data: altitude, speed, heading, battery, flight time remaining
- Signal data: network type (4G/5G), signal strength, connection status
- Reachability: SMS status, DATA status
- Location fusion: GPS, network, and fused location with accuracy

#### NetworkMetricsPanel
- Real-time performance KPIs: latency, jitter, packet loss, throughput
- Network type: 4G/5G indicator with signal strength
- Reachability status: SMS (REACHABLE/NOT_REACHABLE), DATA (REACHABLE/NOT_REACHABLE)
- QoS status with active profile badge (QOS_H/QOS_M/QOS_L)
- Connection quality visualization

#### ActiveSubscriptionsPanel
- Lists all active subscriptions (Geofencing, Network Type, Reachability, etc.)
- Shows subscription IDs and types
- Dynamic height based on number of subscriptions
- Displays when subscriptions are created via chatbot

#### EdgeAnalysisResults
- Shows edge node location and deployment information
- Displays deployment ID, image ID, zone name, and status
- Analysis content varies by use case:
  - **Bushfire**: Fire spread prediction, heat signatures, smoke coverage, fire intensity
  - **Power Outage**: Damage severity assessment, damage hotspots (downed lines, damaged poles), estimated repair time, customers affected
- Shows when edge applications are deployed via chatbot

#### StatusPanel (Normal Mode Only)
- System status overview
- Mission information display
- Shown before incident is reported

#### AIAssistantChatbot
- Natural language interface powered by AWS Bedrock Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) via boto3 Converse API
- Tool calling visualization showing MCP function invocations
- Streaming responses via SSE
- Message history with user/assistant/system messages
- Mission control commands:
  - Report incident location (converts address to coordinates via geocode_address tool)
  - Verify drone location
  - Deploy/undeploy edge applications
  - Create/cancel subscriptions
  - Create/cancel WebRTC calls
  - Create QoD sessions
  - Close incident and reset dashboard

#### NotificationContainer
- Displays event notifications in top-right corner
- Shows subscription events (network changes, geofencing, connectivity)
- Auto-dismisses after timeout

#### Header
- Mission status display
- Emergency mode toggle button
- Shows "EMERGENCY" badge when in emergency mode

## Test Data

### Coordinates

```
Base Location (First Wave HQ): -37.8136, 144.9631 (Melbourne CBD, VIC)
Incident Location: Geocoded from address entered in chatbot
Drone Kit Location: Same as incident + small offset (0.001 degrees east/north)
Edge Node: Returned by discover_edge_node tool (near Melbourne CBD)
Geofencing Circle: Centered on incident location with configurable radius (e.g., 200m)
```

**Background Task Locations** (in `main.py`):
- Periodic location updates simulate drone movement with random offsets within ~500m radius of base (-37.8136, 144.9631)
- Updates broadcast every 10 seconds via SSE to all connected clients

### Device IDs

Default values (configured in `config.py`):
- Drone: `drone-001` (`DEFAULT_DRONE_ID`)
- Phone Number: `+61491570006` (`DEFAULT_PHONE_NUMBER`)
- Default Incident: -37.8136, 144.9631 (`DEFAULT_INCIDENT_LAT`, `DEFAULT_INCIDENT_LON`)

## Color Scheme

```css
Background: #0f1419
Surface: #1a1f2e
Primary: #3b82f6 (blue)
Success: #10b981 (green)
Warning: #f59e0b (amber)
Danger: #ef4444 (red)
Geofence: #8b5cf6 (purple)
```

### Heatmap Colors (Region Device Count)

- Low device count: Blue (#3b82f6)
- Medium device count: Yellow (#f59e0b)
- High device count: Red (#ef4444)

## Important Implementation Notes

### Real-time Updates

The backend automatically sends real-time updates via **Server-Sent Events (SSE)**:

**Backend Periodic Tasks** (configured in `backend-api/app/main.py`):
- Location updates: every 10 seconds (broadcasted to all connected clients via `send_periodic_location_updates()`)
- Region Device Count: every 30 seconds (broadcasted to all connected clients via `send_periodic_region_device_count()`)

**Frontend Event Stream** (`frontend-dashboard/src/services/eventStreamService.ts`):
The event stream service connects to `/api/events/stream` and processes events:
```typescript
// Event types handled:
// - location_update: Updates drone position on map
// - region_device_count: Updates device count heatmap
// - connectivity_insight: Network performance events
// - connected_network_type: Network type changes
// - device_reachability: Reachability status changes
// - geofence: Geofencing boundary events
// - incoming_webrtc: Incoming WebRTC call notification
```

**Chat Streaming** (`frontend-dashboard/src/services/backendAPI.ts`):
Uses native fetch to send POST requests to `/api/chat/message` and receives streaming SSE responses with:
- Content deltas (text streaming)
- Tool calls (function invocations)
- Tool results (function outputs)
- Errors

### State Management

Uses Zustand with multiple stores for state management:
- **chatStore.ts**: Manages chat messages, conversation state, and streaming responses
- **mapStore.ts**: Manages map markers and overlays state
- **regionDeviceStore.ts**: Manages region device count data points for heatmap visualization
- **subscriptionsStore.ts**: Manages active subscriptions state
- **systemStatusStore.ts**: Manages system status and mission state

Each store is focused on a specific domain to keep state management organized and performant.

### Performance

- Use `React.memo` for expensive components
- Debounce rapid updates
- Clean up intervals in useEffect return
- Optimize re-renders with useMemo/useCallback

### Error Handling

**Backend API** returns structured error responses:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

**MCP Tools** return error messages in JSON format:

```json
{
  "error": "Tool execution failed: reason"
}
```

**Frontend** handles errors via SSE event type `error`:

```typescript
{
  type: 'error',
  data: { error: 'Connection failed' }
}
```

## Common Issues

### Backend won't start - LLM connection issues

AWS credentials are hardcoded in `backend-api/app/config.py`. If you encounter authentication errors:
1. Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `config.py` are valid
2. For production, use environment variables instead:
```python
# In config.py:
AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
```
3. Then set the environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### Frontend can't connect to backend

Ensure backend is running on port 4000:
```bash
cd backend-api
uvicorn app.main:app --reload --port 4000
```

### Map not displaying

Leaflet CSS is imported in `main.tsx`:
```typescript
import 'leaflet/dist/leaflet.css';
```

### Chatbot not responding

1. Check backend logs for MCP server connection
2. Verify AWS credentials in `config.py` are valid
3. Check browser console for SSE connection errors

## AI Assistant Queries

The AI assistant (powered by AWS Bedrock Claude 3 Haiku with MCP tool calling) responds to natural language queries:

**Common Queries (both use cases):**

- **"Conduct preflight integrity check"** → Calls `integrity_check` tool
- **"Check all available QoS profiles"** → Calls `get_qos_profiles` tool
- **"Check drone kit's connected network type"** → Calls `get_connected_network` tool
- **"Create geofencing subscription at this location with radius of 200m for our drone kit"** → Calls `subscribe_geofencing` tool
- **"Accept remote incoming webrtc call"** → Calls `handle_webrtc_call` tool (type: accept_media_session)
- **"Create a new QoD session for this webrtc media call using QoS_M"** → Calls `create_quality_on_demand` tool
- **"Cancel this webrtc call session"** → Calls `handle_webrtc_call` tool (type: cancel_media_session)
- **"Cancel the geofencing subscription (uuid)"** → Calls `unsubscribe_geofencing` tool
- **"Cancel the network type subscription created earlier for drone kit"** → Calls `unsubscribe_connected_network` tool

**Bushfire Response Queries (main branch):**

- **"A bushfire is reported at 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766"** → Calls `geocode_address` tool
- **"Check if drone kit has arrived at the bushfire scene"** → Calls `verify_location` tool
- **"Deploy the fire spread prediction image (image id: fire-spread-prediction:v2.0)"** → Calls `deploy_edge_application` tool
- **"Undeploy fire-spread-prediction:v2.0 model from edge node"** → Calls `undeploy_edge_application` tool

**Power Outage Response Queries (power-outage-response branch):**

- **"A power outage is reported at 123 Collins Street, Melbourne VIC 3000"** → Calls `geocode_address` tool
- **"Check if drone kit has arrived at the outage location"** → Calls `verify_location` tool
- **"Deploy the damage assessment image (image id: damage-assessment:v2.0)"** → Calls `deploy_edge_application` tool
- **"Undeploy damage-assessment:v2.0 model from edge node"** → Calls `undeploy_edge_application` tool

## Reference Documents

For detailed specifications, refer to:

- `architecture_overview.md` - System architecture and components
- `api_integration_guide.md` - All 8 API specifications with examples
- `dashboard_components.md` - UI component specifications
- `implementation_checklist.md` - Step-by-step implementation guide
- `mock_data_spec.md` - Mock data generators and test scenarios
- `quick_reference.md` - Quick reference for common tasks
- `disaster_response_sequence.mermaid` - Visual workflow diagram
