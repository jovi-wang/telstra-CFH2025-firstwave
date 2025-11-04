import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import { Icon } from 'leaflet';
import { useEffect } from 'react';
import { Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { divIcon } from 'leaflet';

// Extend Leaflet type to include heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: any
  ): any;
}

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Red icon for incident locations
const RedIcon = divIcon({
  className: 'custom-red-icon',
  html: `<div style="
    width: 25px;
    height: 41px;
    position: relative;
    transform: translate(-12px, -41px);
  ">
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z"
            fill="#ef4444"
            stroke="#991b1b"
            stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// Blue icon for drone kit locations
const BlueIcon = divIcon({
  className: 'custom-blue-icon',
  html: `<div style="
    width: 25px;
    height: 41px;
    position: relative;
    transform: translate(-12px, -41px);
  ">
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z"
            fill="#3b82f6"
            stroke="#1e40af"
            stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// Green icon for edge node locations
const GreenIcon = divIcon({
  className: 'custom-green-icon',
  html: `<div style="
    width: 25px;
    height: 41px;
    position: relative;
    transform: translate(-12px, -41px);
  ">
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z"
            fill="#10b981"
            stroke="#065f46"
            stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// Device count data point interface
interface DeviceCountPoint {
  lat: number;
  lon: number;
  device_count: number;
}

// Custom HeatmapLayer component with tooltip
const HeatmapLayer = ({ points }: { points: DeviceCountPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) {
      return;
    }

    // Check if L.heatLayer is available
    if (!L || !(L as any).heatLayer) {
      console.error('❌ HeatmapLayer: L.heatLayer is not available!');
      return;
    }

    // Convert device count points to heatmap format: [lat, lon, intensity]
    // Normalize device_count (50-100) to intensity (0-1)
    const heatmapData: Array<[number, number, number]> = points.map((point) => {
      // Map 50-100 to 0-1 intensity
      const intensity = (point.device_count - 50) / 50;
      return [point.lat, point.lon, intensity];
    });

    // Create heatmap layer with Leaflet.heat
    const heat = (L as any).heatLayer(heatmapData, {
      radius: 50,
      blur: 50,
      maxZoom: 18,
      max: 1.0,
      minOpacity: 0.5,
      gradient: {
        0.0: '#81c951ff', // blue (50 devices)
        0.33: '#8bfd00ff', // lighter blue
        0.5: '#fdbc17ff', // yellow (67 devices)
        0.75: '#f8811fff', // orange (84 devices)
        1.0: '#f00b0bff', // red (100 devices)
      },
    });

    // Add to map
    heat.addTo(map);

    // Add invisible circle markers with tooltips for each point
    const tooltipMarkers = points.map((point) => {
      const circle = L.circle([point.lat, point.lon], {
        radius: 50, // Match heatmap radius
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
        fillOpacity: 0,
      });

      circle.bindTooltip(
        `<div style="text-align: center;">
          <strong>Device Count</strong><br/>
          ${point.device_count} devices<br/>
          <span style="font-size: 0.85em; color: #9ca3af;">Radius: ${point.radius}m</span>
        </div>`,
        {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
        }
      );

      circle.addTo(map);
      return circle;
    });

    // Cleanup on unmount or when points change
    return () => {
      map.removeLayer(heat);
      tooltipMarkers.forEach((marker) => map.removeLayer(marker));
    };
  }, [map, points]);

  return null;
};

interface MapViewProps {
  isEmergencyMode?: boolean;
  center?: { lat: number; lon: number };
  baseLocation?: { lat: number; lon: number; name: string } | null;
  incidentLocation?: { lat: number; lon: number; address: string } | null;
  droneKitLocation?: { lat: number; lon: number } | null;
  edgeNodeLocation?: { lat: number; lon: number; name: string } | null;
  geofencingCircle?: { lat: number; lon: number; radius: number } | null;
  deviceCountPoints?: DeviceCountPoint[];
}

// Component to update map center dynamically
const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapView = ({
  isEmergencyMode = false,
  center,
  baseLocation,
  incidentLocation,
  droneKitLocation,
  edgeNodeLocation,
  geofencingCircle,
  deviceCountPoints = [],
}: MapViewProps) => {
  // Default center to Melbourne CBD if no center provided
  const defaultCenter: [number, number] = [-37.8136, 144.9631];
  const mapCenter: [number, number] = center
    ? [center.lat, center.lon]
    : defaultCenter;

  return (
    <div className='relative w-full h-full'>
      {/* Legend - Only show in emergency mode */}
      {isEmergencyMode && (
        <div className='absolute bottom-4 left-4 z-[1000] bg-surface bg-opacity-95 p-3 rounded-lg shadow-lg text-xs'>
          <div className='font-semibold mb-2 flex items-center space-x-2'>
            <Layers className='w-4 h-4' />
            <span>Map Legend</span>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <svg
                width='16'
                height='20'
                viewBox='0 0 25 41'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z'
                  fill='#ef4444'
                  stroke='#991b1b'
                  strokeWidth='2'
                />
                <circle cx='12.5' cy='12.5' r='5' fill='white' />
              </svg>
              <span>Incident Location</span>
            </div>
            <div className='flex items-center space-x-2'>
              <svg
                width='16'
                height='20'
                viewBox='0 0 25 41'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z'
                  fill='#3b82f6'
                  stroke='#1e40af'
                  strokeWidth='2'
                />
                <circle cx='12.5' cy='12.5' r='5' fill='white' />
              </svg>
              <span>Drone Kit Location</span>
            </div>
            <div className='flex items-center space-x-2'>
              <svg
                width='16'
                height='20'
                viewBox='0 0 25 41'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41C12.5 41 25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z'
                  fill='#10b981'
                  stroke='#065f46'
                  strokeWidth='2'
                />
                <circle cx='12.5' cy='12.5' r='5' fill='white' />
              </svg>
              <span>Edge Node</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div
                className='w-4 h-4 border-2 rounded-full'
                style={{ borderColor: '#8b5cf6', borderStyle: 'dashed' }}
              ></div>
              <span>Geofencing Boundary</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Map Center Updater */}
        <MapCenterUpdater center={mapCenter} />

        {/* Heatmap Layer for Device Count */}
        {deviceCountPoints.length > 0 && (
          <HeatmapLayer points={deviceCountPoints} />
        )}

        {/* Map markers - Always visible */}
        <>
          {/* Melbourne CBD Base Marker - Only show if no drone kit location */}
          {baseLocation && !droneKitLocation && (
            <Marker
              position={[baseLocation.lat, baseLocation.lon]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className='text-sm'>
                  <strong>{baseLocation.name}</strong>
                  <br />
                  {baseLocation.lat.toFixed(4)}, {baseLocation.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Incident Location Marker */}
          {incidentLocation && (
            <Marker
              position={[incidentLocation.lat, incidentLocation.lon]}
              icon={RedIcon}
            >
              <Popup>
                <div className='text-sm'>
                  <strong>Incident Location</strong>
                  <br />
                  {incidentLocation.address}
                  <br />
                  {incidentLocation.lat.toFixed(4)},{' '}
                  {incidentLocation.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Geofencing Circle - centered at incident location */}
          {geofencingCircle && (
            <Circle
              center={[geofencingCircle.lat, geofencingCircle.lon]}
              radius={geofencingCircle.radius}
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 10',
              }}
            >
              <Popup>
                <div className='text-sm'>
                  <strong>Geofencing Boundary</strong>
                  <br />
                  Radius: {geofencingCircle.radius}m
                  <br />
                  Center: {geofencingCircle.lat.toFixed(4)},{' '}
                  {geofencingCircle.lon.toFixed(4)}
                </div>
              </Popup>
            </Circle>
          )}

          {/* Drone Kit Location Marker */}
          {droneKitLocation && (
            <Marker
              position={[droneKitLocation.lat, droneKitLocation.lon]}
              icon={BlueIcon}
            >
              <Popup>
                <div className='text-sm'>
                  <strong>Drone Kit Deployed</strong>
                  <br />
                  Verified Location
                  <br />
                  {droneKitLocation.lat.toFixed(4)},{' '}
                  {droneKitLocation.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Edge Node Location Marker */}
          {edgeNodeLocation && (
            <Marker
              position={[edgeNodeLocation.lat, edgeNodeLocation.lon]}
              icon={GreenIcon}
            >
              <Popup>
                <div className='text-sm'>
                  <strong>Edge Node</strong>
                  <br />
                  {edgeNodeLocation.name}
                  <br />
                  {edgeNodeLocation.lat.toFixed(4)},{' '}
                  {edgeNodeLocation.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}
        </>
      </MapContainer>
    </div>
  );
};

export default MapView;
