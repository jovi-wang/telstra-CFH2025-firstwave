from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import chat, events
from app.config import settings
from app.services.mcp_client import mcp_client
import asyncio
import random

# Store background tasks
background_tasks = []


async def send_periodic_region_device_count():
    """Background task that sends region device count data every 30 seconds"""
    import sys
    from datetime import datetime

    print(
        "📊 Starting periodic region device count updates (every 30 seconds)...",
        file=sys.stderr,
        flush=True,
    )

    try:
        while True:
            # Generate random device count (50-100)
            device_count = random.randint(50, 100)

            # Create region device count event
            device_count_event = {
                "event_type": "region_device_count",
                "radius": 200,  # 200m radius
                "device_count": device_count,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }

            # Broadcast to all connected clients
            for client_queue in events.connected_clients:
                try:
                    await asyncio.wait_for(
                        client_queue.put(device_count_event), timeout=0.5
                    )
                except (asyncio.TimeoutError, Exception):
                    pass

            # Wait 30 seconds before next update
            await asyncio.sleep(30)

    except asyncio.CancelledError:
        print(
            "📊 Stopped periodic region device count updates",
            file=sys.stderr,
            flush=True,
        )
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    import sys

    # Startup
    print("🚀 Starting FastAPI backend...", file=sys.stderr, flush=True)
    try:
        await mcp_client.connect()
        print("✅ Connected to CAMARA MCP server", file=sys.stderr, flush=True)
    except Exception as e:
        print(
            f"⚠️  Warning: Could not connect to MCP server: {e}",
            file=sys.stderr,
            flush=True,
        )
        print(
            "   The backend will start but tool calling won't work.",
            file=sys.stderr,
            flush=True,
        )

    # Start background task for periodic region device count
    device_count_task = asyncio.create_task(send_periodic_region_device_count())
    background_tasks.append(device_count_task)

    yield

    # Shutdown
    print("👋 Shutting down FastAPI backend...", file=sys.stderr, flush=True)

    # Cancel all background tasks
    for task in background_tasks:
        task.cancel()

    # Wait for tasks to complete cancellation
    await asyncio.gather(*background_tasks, return_exceptions=True)

    try:
        await mcp_client.disconnect()
        print("✅ Disconnected from MCP server", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"⚠️  Warning during shutdown: {e}", file=sys.stderr, flush=True)


app = FastAPI(
    title="Disaster Response AI Backend",
    description="FastAPI backend for drone disaster response system with CAMARA APIs and AI assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Configure based on settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(events.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Disaster Response AI Backend API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "chat_message": "/api/chat/message",
            "event_stream": "/api/events/stream",
            "publish_event": "/api/events/publish",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    mcp_status = "connected" if mcp_client.session else "disconnected"
    return {
        "status": "healthy",
        "mcp_server": mcp_status,
        "llm_model": settings.BEDROCK_MODEL_ID,
    }
