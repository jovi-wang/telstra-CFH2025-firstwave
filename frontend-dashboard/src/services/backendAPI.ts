/**
 * Backend API Service
 * Handles communication with FastAPI backend via Server-Sent Events (SSE)
 */

const BACKEND_URL = 'http://localhost:4000';

/**
 * Event data structures for each event type
 */
export interface MessageStartData {
  conversation_id: string;
}

export interface ContentDeltaData {
  content: string;
}

export interface ToolCallData {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultData {
  tool: string;
  result: unknown;
}

export interface ToolErrorData {
  error: string;
}

export interface ErrorData {
  error: string;
}

/**
 * Stream event as discriminated union
 */
export type StreamEvent =
  | { type: 'message_start'; data: MessageStartData }
  | { type: 'content_delta'; data: ContentDeltaData }
  | { type: 'tool_call'; data: ToolCallData }
  | { type: 'tool_result'; data: ToolResultData }
  | { type: 'tool_error'; data: ToolErrorData }
  | { type: 'message_complete'; data: Record<string, never> }
  | { type: 'mission_complete'; data: Record<string, never> }
  | { type: 'error'; data: ErrorData };

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
            // TypeScript will infer the correct StreamEvent type from the discriminated union
            onEvent({
              type: eventType,
              data: parsedData,
            } as StreamEvent);
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
