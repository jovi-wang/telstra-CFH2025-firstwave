/**
 * Event Stream Service
 * Handles SSE connection to backend for real-time event notifications
 */

const BACKEND_URL = 'http://localhost:4000';

/**
 * Event types from backend
 */
export type EventType =
  | 'geofence'
  | 'connected_network_type'
  | 'device_reachability'
  | 'connectivity_insight'
  | 'incoming_webrtc'
  | 'location_update'
  | 'region_device_count';

/**
 * Event structure from backend
 */
export interface SystemEvent {
  event_type: EventType;
  timestamp: string;
}

/**
 * Event callback type
 */
type EventCallback = (event: SystemEvent) => void;

/**
 * Event Stream Service for managing SSE connection
 */
class EventStreamService {
  private eventSource: EventSource | null = null;
  private listeners: Map<EventType | 'all', Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private isConnected = false;

  /**
   * Connect to event stream
   */
  connect() {
    if (this.eventSource) {
      return;
    }

    this.eventSource = new EventSource(`${BACKEND_URL}/api/events/stream`);

    // Connection opened
    this.eventSource.addEventListener('connected', (e) => {
      JSON.parse(e.data); // Parse to validate format
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 2000;
    });

    // Register listeners for all event types
    const eventTypes: EventType[] = [
      'geofence',
      'connected_network_type',
      'device_reachability',
      'connectivity_insight',
      'incoming_webrtc',
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource!.addEventListener(eventType, () => {
        this.emit(eventType, {
          event_type: eventType,
          timestamp: new Date().toISOString(),
        });
      });
    });

    // Handle location_update - not emit to subscribers but log the data, TODO (emit to TelemetryPanel for location fusion display)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.eventSource.addEventListener('location_update', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('📍 Location Update Event:', data);
    });

    // Handle region_device_count - emit with data (used for heatmap display)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.eventSource.addEventListener('region_device_count', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('📊 Region Device Count Event:', data);
      this.emit('region_device_count', data);
    });

    // Error handling with exponential backoff reconnection
    this.eventSource.onerror = (error) => {
      console.error('❌ EventSource error:', error);
      this.isConnected = false;
      this.eventSource?.close();
      this.eventSource = null;

      // Attempt reconnection with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay =
          this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

        setTimeout(() => this.connect(), delay);
      } else {
        console.error(
          '❌ Max reconnection attempts reached. Please refresh the page.'
        );
      }
    };
  }

  /**
   * Subscribe to specific event type or all events
   */
  on(eventType: EventType | 'all', callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  /**
   * Unsubscribe from event
   */
  off(eventType: EventType | 'all', callback: EventCallback) {
    this.listeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: EventType, event: SystemEvent) {
    // Emit to specific event type listeners
    this.listeners.get(eventType)?.forEach((cb) => cb(event));

    // Emit to 'all' listeners
    this.listeners.get('all')?.forEach((cb) => cb(event));
  }

  /**
   * Disconnect from event stream
   */
  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
    this.isConnected = false;
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Export singleton instance
export const eventStreamService = new EventStreamService();

// Auto-connect when service is imported
eventStreamService.connect();

export default eventStreamService;
