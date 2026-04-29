# GEMINI.md

This project is a disaster response drone system developed for the Telstra Connected Future Hackathon 2025. It integrates drone operations with simulated CAMARA network APIs to demonstrate real-time disaster monitoring, response coordination, and network quality management.

## Project Overview

- **Purpose**: Facilitate bushfire disaster response through drone-based monitoring, AI-powered agent orchestration, and network service control.
- **Technologies**:
  - **Frontend**: React, TypeScript, Vite, Tailwind CSS.
  - **Backend**: Python, FastAPI, MCP (Model Context Protocol).
  - **AI Integration**: AWS Bedrock (Claude 3 Haiku).
- **Architecture**: A modular system featuring an operator dashboard, an AI-powered orchestration backend, and a CAMARA MCP server that provides mocked network API capabilities.

## Building and Running

### Prerequisites

- Node.js 18+
- Python 3.12+

### Backend API

```bash
cd backend-api
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate
# Install dependencies
pip install -r requirements.txt # Note: Adjust if specific lock file is preferred
uvicorn app.main:app --reload --port 4000
```

### Frontend Dashboard

```bash
cd frontend-dashboard
npm install
npm run dev
```

## Development Conventions

- **Frontend**: React components utilize a store-based architecture (`src/store`). Use `src/services` for API calls.
- **Backend**: FastAPI structure separates routers (`app/routers`) and services (`app/services`).
- **AI/Agents**: Interaction logic is centralized in `backend-api/app/services/ai_agent.py` and `backend-api/app/services/mcp_client.py`.
- **Styling**: Tailwind CSS is used for UI components.

## Documentation

- **System Overview**: See `README.md` for architecture diagrams, user flow, and API usage scenarios.
- **Hackathon Context**: Refer to `Rubrics.md` for project alignment with hackathon criteria.
