from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.services.ai_agent import ai_agent
from pydantic import BaseModel
import json
import uuid


router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessageRequest(BaseModel):
    """Request model for sending a chat message"""

    message: str
    conversation_id: str | None = None


@router.post("/message")
async def send_message(request: ChatMessageRequest):
    """
    Send message and get streaming response via Server-Sent Events (SSE)

    The response will stream events in SSE format:
    - message_start: Initial event with conversation_id
    - content_delta: Streaming text chunks from LLM
    - tool_call: When LLM decides to call a tool
    - tool_result: Result from tool execution
    - tool_error: If tool execution fails
    - mission_complete: When mission completion is detected
    - message_complete: Final event when response is complete
    - error: If an error occurs
    """

    conversation_id = request.conversation_id or str(uuid.uuid4())

    async def event_generator():
        try:
            # Send conversation ID
            yield f"event: message_start\n"
            yield f"data: {json.dumps({'conversation_id': conversation_id})}\n\n"

            # Stream response from AI agent
            async for event in ai_agent.chat(request.message, conversation_id):
                event_type = event["type"]
                event_data = event["data"]

                if event_type == "content":
                    # Text content delta
                    yield f"event: content_delta\n"
                    yield f"data: {json.dumps({'content': event_data})}\n\n"

                elif event_type == "tool_call":
                    # Tool being called
                    yield f"event: tool_call\n"
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif event_type == "tool_result":
                    # Tool execution result
                    yield f"event: tool_result\n"
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif event_type == "tool_error":
                    # Tool execution error
                    yield f"event: tool_error\n"
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif event_type == "mission_complete":
                    # Mission completion detected
                    yield f"event: mission_complete\n"
                    yield f"data: {json.dumps(event_data)}\n\n"

                elif event_type == "complete":
                    # Message complete
                    yield f"event: message_complete\n"
                    yield f"data: {json.dumps({'status': 'complete'})}\n\n"

        except Exception as e:
            import traceback
            import sys
            print(f"❌ Error in chat endpoint: {e}", file=sys.stderr, flush=True)
            traceback.print_exc(file=sys.stderr)
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
