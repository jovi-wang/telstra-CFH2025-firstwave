import { useState, useEffect } from 'react';
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
import type { Subscription } from './components/ActiveSubscriptionsPanel';
import { useRegionDeviceStore } from './store/regionDeviceStore';
import eventStreamService from './services/eventStreamService';

// Melbourne CBD base location (First Wave HQ)
const MELBOURNE_CBD_BASE = {
  lat: -37.8136,
  lon: 144.9631,
  name: 'First Wave Base - Crew & Equipment',
};

function App() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Region device count store
  const { deviceCountPoints, addDeviceCountPoint } = useRegionDeviceStore();

  // Map control state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: MELBOURNE_CBD_BASE.lat,
    lon: MELBOURNE_CBD_BASE.lon,
  });
  const [incidentLocation, setIncidentLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
  } | null>(null);
  const [droneKitLocation, setDroneKitLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [edgeNodeLocation, setEdgeNodeLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [baseLocation, setBaseLocation] = useState<
    typeof MELBOURNE_CBD_BASE | null
  >(MELBOURNE_CBD_BASE);
  const [geofencingCircle, setGeofencingCircle] = useState<{
    lat: number;
    lon: number;
    radius: number;
  } | null>(null);

  // Edge deployment state
  const [edgeDeployment, setEdgeDeployment] = useState<{
    deploymentId: string;
    imageId: string;
    zoneName: string;
    status: string;
  } | null>(null);

  // Active subscriptions state
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    Subscription[]
  >([]);

  // Subscribe to region device count events
  useEffect(() => {
    const handleRegionDeviceCount = (event: any) => {
      // Event structure: { event_type, radius, device_count, timestamp }
      // Use drone kit location for heatmap (only if drone is verified and marker exists)
      if (droneKitLocation) {
        addDeviceCountPoint({
          lat: droneKitLocation.lat,
          lon: droneKitLocation.lon,
          device_count: event.device_count,
          radius: event.radius,
          timestamp: event.timestamp,
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

  const toggleEmergencyMode = () => {
    setIsEmergencyMode(!isEmergencyMode);
  };

  // Move map to address and set incident marker
  const moveMapToAddress = (address: string, lat: number, lon: number) => {
    setMapCenter({ lat, lon });
    setIncidentLocation({ lat, lon, address });
  };

  // Add drone kit marker and clear base location
  const addDroneKitMarker = (lat: number, lon: number) => {
    // Add small offset to avoid overlapping with incident marker
    // Offset by ~100m (0.001 degrees) to the east and slightly north
    const offsetLat = lat + 0.001;
    const offsetLon = lon + 0.001;

    setDroneKitLocation({ lat: offsetLat, lon: offsetLon });
    setBaseLocation(null); // Clear CBD base marker
  };

  // Add edge node marker
  const addEdgeNodeMarker = (lat: number, lon: number, zoneName: string) => {
    setEdgeNodeLocation({ lat, lon, name: zoneName });
  };

  // Update edge deployment info
  const updateEdgeDeployment = (
    deploymentId: string,
    imageId: string,
    zoneName: string,
    status: string
  ) => {
    setEdgeDeployment({ deploymentId, imageId, zoneName, status });
  };

  // Clear edge deployment
  const clearEdgeDeployment = () => {
    setEdgeDeployment(null);
  };

  // Add geofencing circle
  const addGeofencingCircle = (lat: number, lon: number, radius: number) => {
    setGeofencingCircle({ lat, lon, radius });
  };

  // Add subscription to active subscriptions list
  const addSubscription = (subscription: Subscription) => {
    setActiveSubscriptions((prev) => [...prev, subscription]);
  };

  // Remove subscription from active subscriptions list
  const removeSubscription = (subscriptionId: string) => {
    setActiveSubscriptions((prev) =>
      prev.filter((sub) => sub.id !== subscriptionId)
    );

    // If removing a geofencing subscription, also clear the geofencing circle
    const subscription = activeSubscriptions.find(
      (sub) => sub.id === subscriptionId
    );
    if (subscription && subscription.type === 'Geofencing') {
      setGeofencingCircle(null);
    }
  };

  // Reset dashboard to initial state
  const resetDashboard = () => {
    console.log('🔄 Resetting dashboard to initial state');

    // Reset emergency mode to normal
    setIsEmergencyMode(false);

    // Reset map to base location
    setMapCenter({ lat: MELBOURNE_CBD_BASE.lat, lon: MELBOURNE_CBD_BASE.lon });

    // Clear all markers
    setIncidentLocation(null);
    setDroneKitLocation(null);
    setEdgeNodeLocation(null);
    setBaseLocation(MELBOURNE_CBD_BASE);
    setGeofencingCircle(null);

    // Clear edge deployment
    setEdgeDeployment(null);

    // Clear all subscriptions
    setActiveSubscriptions([]);
  };

  return (
    <div className='h-screen bg-background text-white flex flex-col overflow-hidden'>
      {/* Event Notifications */}
      <NotificationContainer />

      {/* Header */}
      <Header
        isEmergencyMode={isEmergencyMode}
        onToggleEmergency={toggleEmergencyMode}
      />

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
                {/* Map View */}
                <div
                  className='bg-surface rounded-lg overflow-hidden border border-gray-700'
                  style={{ aspectRatio: '8/9', width: '100%' }}
                >
                  <MapView
                    isEmergencyMode={isEmergencyMode}
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
                      activeSubscriptions.length === 0 ? '180px' : '280px',
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
                {/* Video Stream - Top */}
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
                      <NetworkMetricsPanel isEmergencyMode={isEmergencyMode} />
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
            <AIAssistantChatbot
              onMoveMap={moveMapToAddress}
              onAddDroneKitMarker={addDroneKitMarker}
              onAddEdgeNodeMarker={addEdgeNodeMarker}
              onUpdateEdgeDeployment={updateEdgeDeployment}
              onClearEdgeDeployment={clearEdgeDeployment}
              onAddGeofencingCircle={addGeofencingCircle}
              onAddSubscription={addSubscription}
              onRemoveSubscription={removeSubscription}
              onResetDashboard={resetDashboard}
              droneKitLocation={droneKitLocation}
              incidentLocation={incidentLocation}
              baseLocation={baseLocation}
            />
          </div>
        </div>
      ) : (
        // Normal Mode - Original Grid Layout
        <div className='flex-1 grid grid-cols-4 gap-2 p-2 min-h-0'>
          {/* Map View - Takes 2 columns */}
          <div className='col-span-2 bg-surface rounded-lg overflow-hidden border border-gray-700 min-h-0'>
            <MapView
              isEmergencyMode={isEmergencyMode}
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
            <AIAssistantChatbot
              onMoveMap={moveMapToAddress}
              onAddDroneKitMarker={addDroneKitMarker}
              onAddEdgeNodeMarker={addEdgeNodeMarker}
              onUpdateEdgeDeployment={updateEdgeDeployment}
              onClearEdgeDeployment={clearEdgeDeployment}
              onAddGeofencingCircle={addGeofencingCircle}
              onAddSubscription={addSubscription}
              onRemoveSubscription={removeSubscription}
              onResetDashboard={resetDashboard}
              droneKitLocation={droneKitLocation}
              incidentLocation={incidentLocation}
              baseLocation={baseLocation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
