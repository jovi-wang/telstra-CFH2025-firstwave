/**
 * Backend API Service
 * Handles communication with FastAPI backend via Server-Sent Events (SSE)
 */

const BACKEND_URL = 'http://localhost:4000';

/**
 * SSE Event types from backend
 */
export type SSEEventType =
  | 'message_start'
  | 'content_delta'
  | 'tool_call'
  | 'tool_result'
  | 'tool_error'
  | 'message_complete'
  | 'mission_complete'
  | 'error';

/**
 * Stream event structure
 */
export type StreamEvent = {
  type: SSEEventType;
  data: any;
};

/**
 * Tool call data structure
 */
export interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
}

/**
 * Tool result data structure
 */
export interface ToolResult {
  tool: string;
  result: any;
}

/**
 * Send a chat message and stream the response via SSE
 *
 * @param message - User message to send
 * @param conversationId - Optional conversation ID for context
 * @param onEvent - Callback for each SSE event received
 */
export const sendMessage = async (
  message: string,
  conversationId: string | null,
  onEvent: (event: StreamEvent) => void
): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available from response');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split by double newlines (SSE event separator)
      const events = buffer.split('\n\n');

      // Keep the last incomplete event in the buffer
      buffer = events.pop() || '';

      // Process complete events
      for (const eventText of events) {
        if (!eventText.trim()) continue;

        const lines = eventText.split('\n');
        let eventType: string | null = null;
        let eventData: string | null = null;

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.substring(5).trim();
          }
        }

        if (eventType && eventData) {
          try {
            const parsedData = JSON.parse(eventData);
            onEvent({
              type: eventType as SSEEventType,
              data: parsedData,
            });
          } catch (parseError) {
            console.error('Failed to parse SSE data:', eventData, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    // Send error event to callback
    onEvent({
      type: 'error',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};
