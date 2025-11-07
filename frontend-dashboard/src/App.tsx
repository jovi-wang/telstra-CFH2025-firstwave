import { useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import VideoStreamViewer from './components/VideoStreamViewer';
import TelemetryPanel from './components/TelemetryPanel';
import NetworkMetricsPanel from './components/NetworkMetricsPanel';
import EdgeAnalysisResults from './components/EdgeAnalysisResults';
import AIAssistantChatbot from './components/AIAssistantChatbot';
import StatusPanel from './components/StatusPanel';
import NotificationContainer from './components/NotificationContainer';
import ActiveSubscriptionsPanel from './components/ActiveSubscriptionsPanel';
import { useRegionDeviceStore } from './store/regionDeviceStore';
import { useSystemStatusStore } from './store/systemStatusStore';
import { useMapStore } from './store/mapStore';
import { useSubscriptionsStore } from './store/subscriptionsStore';
import eventStreamService from './services/eventStreamService';

// Event types
interface RegionDeviceCountEvent {
  event_type: string;
  radius: number;
  device_count: number;
  timestamp: string;
  [key: string]: unknown; // Allow additional properties
}

function App() {
  // System status store
  const isEmergencyMode = useSystemStatusStore(
    (state) => state.isEmergencyMode
  );
  const edgeDeployment = useSystemStatusStore((state) => state.edgeDeployment);

  // Region device count store
  const { deviceCountPoints, addDeviceCountPoint } = useRegionDeviceStore();

  // Map store
  const {
    mapCenter,
    baseLocation,
    incidentLocation,
    droneKitLocation,
    edgeNodeLocation,
    geofencingCircle,
    moveMapToAddress: moveMapToAddressStore,
    addDroneKitMarker: addDroneKitMarkerStore,
    addEdgeNodeMarker: addEdgeNodeMarkerStore,
    addGeofencingCircle: addGeofencingCircleStore,
    resetMapState,
  } = useMapStore();

  // Subscriptions store
  const {
    activeSubscriptions,
    addSubscription: addSubscriptionStore,
    removeSubscription: removeSubscriptionStore,
    clearAllSubscriptions,
  } = useSubscriptionsStore();

  // Subscribe to region device count events
  useEffect(() => {
    const handleRegionDeviceCount = (event: unknown) => {
      const regionEvent = event as RegionDeviceCountEvent;
      // Event structure: { event_type, radius, device_count, timestamp }
      // Use drone kit location for heatmap (only if drone is verified and marker exists)
      if (droneKitLocation) {
        addDeviceCountPoint({
          lat: droneKitLocation.lat,
          lon: droneKitLocation.lon,
          device_count: regionEvent.device_count,
          radius: regionEvent.radius,
          timestamp: regionEvent.timestamp,
        });
      }
    };

    // Subscribe to region_device_count events
    eventStreamService.on('region_device_count', handleRegionDeviceCount);

    // Cleanup on unmount
    return () => {
      eventStreamService.off('region_device_count', handleRegionDeviceCount);
    };
  }, [addDeviceCountPoint, droneKitLocation]);

  // Get store actions from systemStatusStore
  const updateEdgeDeployment = useSystemStatusStore(
    (state) => state.updateEdgeDeployment
  );
  const clearEdgeDeployment = useSystemStatusStore(
    (state) => state.clearEdgeDeployment
  );

  // Handle subscription removal with geofencing cleanup
  const removeSubscription = useCallback(
    (subscriptionId: string) => {
      // Check if it's a geofencing subscription before removing
      const subscription = activeSubscriptions.find(
        (sub) => sub.id === subscriptionId
      );

      if (subscription && subscription.type === 'Geofencing') {
        useMapStore.getState().clearGeofencingCircle();
      }

      removeSubscriptionStore(subscriptionId);
    },
    [activeSubscriptions, removeSubscriptionStore]
  );

  // Reset dashboard to initial state
  const resetDashboard = useCallback(() => {
    console.log('🔄 Resetting dashboard to initial state');

    // Reset all stores
    useSystemStatusStore.getState().resetAllStatuses();
    resetMapState();
    clearAllSubscriptions();
  }, [resetMapState, clearAllSubscriptions]);

  // Memoize AI Assistant Chatbot to avoid duplication in both modes
  const aiAssistantChatbot = useMemo(
    () => (
      <AIAssistantChatbot
        onMoveMap={moveMapToAddressStore}
        onAddDroneKitMarker={addDroneKitMarkerStore}
        onAddEdgeNodeMarker={addEdgeNodeMarkerStore}
        onUpdateEdgeDeployment={updateEdgeDeployment}
        onClearEdgeDeployment={clearEdgeDeployment}
        onAddGeofencingCircle={addGeofencingCircleStore}
        onAddSubscription={addSubscriptionStore}
        onRemoveSubscription={removeSubscription}
        onResetDashboard={resetDashboard}
        droneKitLocation={droneKitLocation}
        incidentLocation={incidentLocation}
        baseLocation={baseLocation}
      />
    ),
    [
      moveMapToAddressStore,
      addDroneKitMarkerStore,
      addEdgeNodeMarkerStore,
      updateEdgeDeployment,
      clearEdgeDeployment,
      addGeofencingCircleStore,
      addSubscriptionStore,
      removeSubscription,
      resetDashboard,
      droneKitLocation,
      incidentLocation,
      baseLocation,
    ]
  );

  return (
    <div className='h-screen bg-background text-white flex flex-col overflow-hidden'>
      {/* Event Notifications */}
      <NotificationContainer />

      {/* Header */}
      <Header />

      {/* Main Content Area - Conditional Layout */}
      {isEmergencyMode ? (
        // Emergency Mode - Scrollable Layout with AI Assistant (same width as normal mode)
        <div className='flex-1 grid grid-cols-4 gap-2 p-2 min-h-0 overflow-hidden'>
          {/* Scrollable Content Area - Emergency Mode (3 columns) */}
          <div className='col-span-3 overflow-y-auto overflow-x-hidden pr-1'>
            <div
              className='grid grid-cols-3 gap-2'
              style={{ gridAutoRows: 'auto' }}
            >
              {/* Left Column - Map, Active Subscriptions, and Telemetry */}
              <div className='col-span-1 flex flex-col gap-2'>
                {/* Map View - 8:9 aspect ratio matches VideoStreamViewer height (16:9 at 2x width) */}
                <div
                  className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                  style={{ aspectRatio: '8/9', width: '100%' }}
                >
                  <MapView
                    center={mapCenter}
                    baseLocation={baseLocation}
                    incidentLocation={incidentLocation}
                    droneKitLocation={droneKitLocation}
                    edgeNodeLocation={edgeNodeLocation}
                    geofencingCircle={geofencingCircle}
                    deviceCountPoints={deviceCountPoints}
                  />
                </div>

                {/* Active Subscriptions Panel - Dynamic Height */}
                <div
                  className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                  style={{
                    minHeight:
                      activeSubscriptions.length === 0 ? '140px' : '180px',
                    maxHeight:
                      activeSubscriptions.length === 0 ? '180px' : '380px',
                  }}
                >
                  <ActiveSubscriptionsPanel
                    subscriptions={activeSubscriptions}
                  />
                </div>

                {/* Telemetry Panel */}
                <div
                  className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                  style={{ minHeight: '250px' }}
                >
                  <div className='h-full overflow-y-auto'>
                    <TelemetryPanel />
                  </div>
                </div>
              </div>

              {/* Right 2 Columns - Video, Network Metrics, Edge Analysis */}
              <div className='col-span-2 flex flex-col gap-2'>
                {/* Video Stream - Top - 16:9 aspect ratio */}
                <div
                  className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                  style={{ aspectRatio: '16/9', width: '100%' }}
                >
                  <VideoStreamViewer />
                </div>

                {/* Bottom Row - Network Metrics and Edge Analysis side by side */}
                <div className='grid grid-cols-2 gap-2'>
                  {/* Network Metrics */}
                  <div
                    className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                    style={{ minHeight: '200px' }}
                  >
                    <div className='h-full overflow-y-auto'>
                      <NetworkMetricsPanel />
                    </div>
                  </div>

                  {/* Edge Analysis */}
                  <div
                    className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                    style={{ minHeight: '200px' }}
                  >
                    <div className='h-full overflow-y-auto'>
                      <EdgeAnalysisResults
                        edgeNodeLocation={edgeNodeLocation}
                        edgeDeployment={edgeDeployment}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant - Right Side (1 column, same as normal mode) */}
          <div className='col-span-1 bg-surface rounded-lg overflow-hidden border border-gray-700 min-h-0'>
            {aiAssistantChatbot}
          </div>
        </div>
      ) : (
        // Normal Mode - Original Grid Layout
        <div className='flex-1 grid grid-cols-4 gap-2 p-2 min-h-0'>
          {/* Map View - Takes 2 columns */}
          <div className='col-span-2 bg-surface rounded-lg overflow-hidden border border-gray-700 min-h-0'>
            <MapView
              center={mapCenter}
              baseLocation={baseLocation}
              incidentLocation={incidentLocation}
              droneKitLocation={droneKitLocation}
              edgeNodeLocation={edgeNodeLocation}
              geofencingCircle={geofencingCircle}
              deviceCountPoints={deviceCountPoints}
            />
          </div>

          {/* Status Panel - Takes 1 column */}
          <div className='col-span-1 bg-surface rounded-lg overflow-hidden border border-gray-700 min-h-0'>
            <StatusPanel />
          </div>

          {/* AI Assistant - Right Side (1 column, 25% width) */}
          <div className='col-span-1 bg-surface rounded-lg overflow-hidden border border-gray-700 min-h-0'>
            {aiAssistantChatbot}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
