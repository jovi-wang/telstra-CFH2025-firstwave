from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio

router = APIRouter(prefix="/api/events", tags=["events"])


class EventPublishRequest(BaseModel):
    """Request model for publishing an event"""

    event_type: str  # e.g., "geofence", "connected_network_type", "device_reachability", "connectivity_insight", "incoming_webrtc", "location_update", "region_device_count"


# Store for connected SSE clients
connected_clients: list[asyncio.Queue] = []


@router.post("/publish")
async def publish_event(event: EventPublishRequest):
    """
    Publish an event to all connected dashboard clients.

    This endpoint receives events from external systems (e.g., network monitoring,
    drone telemetry, CAMARA APIs) and broadcasts them to all connected clients.

    Example usage:
    ```
    POST /api/events/publish
    {
        "event_type": "connectivity_insight"
    }
    ```
    """

    # Create event message
    event_message = {
        "event_type": event.event_type,
    }

    # Broadcast to all connected clients
    disconnected_clients = []
    for client_queue in connected_clients:
        try:
            # Non-blocking put with timeout
            await asyncio.wait_for(
                client_queue.put(event_message),
                timeout=1.0
            )
        except (asyncio.TimeoutError, Exception):
            # Mark client for removal if queue is full or error occurs
            disconnected_clients.append(client_queue)

    # Remove disconnected clients
    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)

    return {
        "status": "published",
        "event_type": event.event_type,
        "clients_notified": len(connected_clients),
    }


@router.get("/stream")
async def event_stream():
    """
    SSE endpoint for clients to receive real-time events.

    The response will stream events in SSE format:
    - geofence: Geofencing alerts
    - connected_network_type: Network type change events
    - device_reachability: Device reachability events
    - connectivity_insight: Connectivity insight events
    - incoming_webrtc: Incoming WebRTC call notifications
    - location_update: Periodic drone location updates (every 10 seconds)
    - region_device_count: Regional device count updates (every 30 seconds)

    Each event contains:
    - event_type: Type of event
    - Additional data fields depending on event type
    """

    # Create a queue for this client
    client_queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    connected_clients.append(client_queue)

    async def event_generator():
        try:
            # Send initial connection success event
            yield f"event: connected\n"
            yield f"data: {json.dumps({'message': 'Event stream connected'})}\n\n"

            # Send heartbeat every 30 seconds to keep connection alive
            heartbeat_task = asyncio.create_task(send_heartbeat(client_queue))

            # Stream events from queue
            while True:
                # Wait for event from queue
                event_message = await client_queue.get()

                # Check if it's a heartbeat
                if event_message.get("_heartbeat"):
                    yield f": heartbeat\n\n"
                    continue

                # Send event to client
                event_type = event_message["event_type"]
                yield f"event: {event_type}\n"
                yield f"data: {json.dumps(event_message)}\n\n"

        except (asyncio.CancelledError, Exception):
            pass
        finally:
            # Cancel heartbeat task
            if 'heartbeat_task' in locals():
                heartbeat_task.cancel()

            # Remove client from connected list
            if client_queue in connected_clients:
                connected_clients.remove(client_queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


async def send_heartbeat(client_queue: asyncio.Queue):
    """Send periodic heartbeat to keep connection alive"""
    try:
        while True:
            await asyncio.sleep(30)
            await client_queue.put({"_heartbeat": True})
    except asyncio.CancelledError:
        pass
