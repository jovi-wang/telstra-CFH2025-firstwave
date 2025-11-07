# Backend API - Disaster Response System

FastAPI backend server for the drone disaster response dashboard with AI assistant and CAMARA API integration via Model Context Protocol (MCP).

## 🚀 Quick Start

### Run the Backend Server

```bash
# From the backend-api directory
cd backend-api

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# Run the server on port 4000
uvicorn app.main:app --reload --port 4000
```

The server will start at `http://localhost:4000`

### Prerequisites

- **Python 3.12+** with `uv` package manager
- **Google Gemini API Key** - Get from [Google AI Studio](https://aistudio.google.com/apikey)
- Virtual environment with dependencies installed (`.venv` folder)

### Install Dependencies (First Time Setup)

```bash
cd backend-api
uv sync  # Install all dependencies from pyproject.toml

# Set your Gemini API key
export GEMINI_API_KEY="your-api-key-here"
# Or create a .env file
echo "GEMINI_API_KEY=your-api-key-here" > .env
```

## 📡 API Endpoints

### Core Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Health check with MCP server status

### Chat Endpoints

- `POST /api/chat/message` - Send chat message (Server-Sent Events streaming)

### Event Stream Endpoints

- `GET /api/events/stream` - Subscribe to real-time events via SSE
- `POST /api/events/publish` - Publish custom events to backend api, then send back to dashboard

sample public event request

```SHELL
curl --request POST \
  --url http://localhost:4000/api/events/publish \
  --header 'Content-Type: application/json' \
  --data '{
  "event_type": "connectivity_insight"
}'
```

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────┐
│         FastAPI Application             │
│  ┌─────────────────────────────────┐    │
│  │   Chat Router                   │    │
│  │   - POST /api/chat/message      │    │
│  │   - SSE streaming responses     │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│  ┌──────────────▼──────────────────┐    │
│  │   AI Agent Service              │    │
│  │   - Orchestrates LLM calls      │    │
│  │   - Handles tool execution      │    │
│  │   - Streams responses           │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│        ┌────────┼────────┐              │
│        │                 │              │
│  ┌─────▼──────┐   ┌─────▼──────┐        │
│  │ LLM Service│   │ MCP Client │        │
│  │  (Gemini)  │   │  (stdio)   │        │
│  └──────┬─────┘   └─────┬──────┘        │
│         │                │              │
└─────────┼────────────────┼──────────────┘
          │                │
          │         ┌──────▼──────┐
          │         │  MCP Server │
          │         │  (FastMCP)  │
          │         └─────────────┘
          │
   ┌──────▼───────────────┐
   │  Google Gemini API   │
   │ (gemini-2.0-flash-   │
   │       lite)          │
   └──────────────────────┘
```

### 1. FastAPI Server (`app/main.py`)

- Async web framework with CORS middleware
- Lifespan management for MCP client connection
- Background tasks for periodic updates:
  - Location updates every 10 seconds
  - Region device count updates every 30 seconds

### 2. AI Agent (`app/services/ai_agent.py`)

- Orchestrates conversation flow between user, LLM, and MCP tools
- Handles streaming responses via Server-Sent Events
- Manages tool calling lifecycle (call → execute → return result)
- Conversation history management

### 3. LLM Service (`app/services/llm_service.py`)

- Connects to Google Gemini API (gemini-2.0-flash-lite model)
- Supports function/tool calling via Gemini's native function calling
- Streams LLM responses token by token

### 4. MCP Client (`app/services/mcp_client.py`)

- Manages connection to MCP server via stdio subprocess
- Provides tool execution interface
- Handles graceful connection/disconnection

### 5. MCP Server (`app/services/mcp_server.py`)

- Built with **FastMCP** framework
- Provides 14 MCP tools mapping to 15 CAMARA APIs
- Returns mock data for hackathon demonstration
- Logs all tool calls to stderr for debugging

## 🛠️ MCP Tools (14 Total)

| Tool                            | CAMARA APIs Covered                                | Description                                                        |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `get_qos_profiles`              | QoS Profiles                                       | Get available QoS profiles (QOS_H, QOS_M, QOS_L)                   |
| `get_connected_network`         | Connected Network Type, Device Reachability Status | Get network type (4G/5G) and reachability (DATA/SMS)               |
| `geocode_address`               | -                                                  | Convert street address to lat/lon coordinates (uses OpenStreetMap) |
| `discover_edge_node`            | Simple Edge Discovery                              | Find closest edge cloud zone                                       |
| `deploy_edge_application`       | Edge Application Management                        | Deploy application to edge zone                                    |
| `undeploy_edge_application`     | Edge Application Management                        | Remove deployed application                                        |
| `verify_location`               | Location Verification                              | Verify device location against reference point                     |
| `subscribe_geofencing`          | Geofencing Subscriptions                           | Create geofencing subscription with radius                         |
| `unsubscribe_geofencing`        | Geofencing Subscriptions                           | Cancel geofencing subscription                                     |
| `subscribe_connected_network`   | Connected Network Type Subscriptions               | Subscribe to network type changes                                  |
| `unsubscribe_connected_network` | Connected Network Type Subscriptions               | Unsubscribe from network type changes                              |
| `handle_webrtc_call`            | WebRTC Call Handling                               | Create or cancel WebRTC session                                    |
| `create_quality_on_demand`      | Quality on Demand, QoD Subscriptions               | Create QoD session with QoS profile                                |
| `integrity_check`               | Number Verify, SIM Swap, Device Swap Detection     | Pre-flight integrity check for device authentication               |

**Note**: All tools return mocked data. No actual CAMARA API calls are made.

## 🔧 Configuration (`app/config.py`)

```python
# Server settings
HOST = "0.0.0.0"
PORT = 4000

# Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash-lite"  # Fast and efficient model

# CORS settings
CORS_ORIGINS = ["*"]  # Allow all origins for development
```
