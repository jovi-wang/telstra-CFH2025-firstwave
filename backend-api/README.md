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
- **AWS Credentials** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) configured in `app/config.py`
- Virtual environment with dependencies installed (`.venv` folder)

### Install Dependencies (First Time Setup)

```bash
cd backend-api
uv sync  # Install all dependencies from pyproject.toml
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
│  │ (Bedrock)  │   │  (stdio)   │        │
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
   │   AWS Bedrock        │
   │  Claude Haiku 4.5    │
   │ (boto3 Converse API) │
   └──────────────────────┘
```

### 1. FastAPI Server (`app/main.py`)

- Async web framework with CORS middleware
- Lifespan management for MCP client connection
- Background tasks for periodic updates:
  - Region device count updates every 30 seconds

### 2. AI Agent (`app/services/ai_agent.py`)

- Orchestrates conversation flow between user, LLM, and MCP tools
- Handles streaming responses via Server-Sent Events
- Manages tool calling lifecycle (call → execute → return result)
- Conversation history management

### 3. LLM Service (`app/services/llm_service.py`)

- Connects to AWS Bedrock Claude Haiku 4.5 via the AU inference profile (`au.anthropic.claude-haiku-4-5-20251001-v1:0`) and boto3 Converse API
- Supports function/tool calling via Bedrock's native tool use
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
# AWS Bedrock - Claude Haiku 4.5
AWS_ACCESS_KEY_ID = "..."          # hardcoded for hackathon
AWS_SECRET_ACCESS_KEY = "..."      # hardcoded for hackathon
AWS_REGION = "ap-southeast-2"
BEDROCK_MODEL_ID = "au.anthropic.claude-haiku-4-5-20251001-v1:0"

# CORS settings
CORS_ORIGINS = ["*"]  # Allow all origins for development
```
