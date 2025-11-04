import { Gauge, Navigation, Battery } from 'lucide-react';
import { staticDroneTelemetry } from '../utils/staticData';
import { useSystemStatusStore } from '../store/systemStatusStore';

const TelemetryPanel = () => {
  const { location, flight, battery } = staticDroneTelemetry;
  const { droneActive, streamActive } = useSystemStatusStore();

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-danger';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className='p-4'>
      <h2 className='text-lg font-semibold mb-4 flex items-center space-x-2'>
        <Gauge className='w-5 h-5' />
        <span>Drone Telemetry</span>
      </h2>

      {/* Location Fusion */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-gray-400 uppercase'>
          Location Fusion
        </h3>

        <div className='space-y-2 text-xs'>
          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>GPS Location:</span>
            <span className='font-mono'>
              {location.gps.lat.toFixed(4)}, {location.gps.lon.toFixed(4)} ±
              {location.gps.accuracy}m
            </span>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>Network Location:</span>
            <span className='font-mono'>
              {location.network.lat.toFixed(4)},{' '}
              {location.network.lon.toFixed(4)} ±{location.network.accuracy}m
            </span>
          </div>

          <div className='flex justify-between items-center bg-primary bg-opacity-10 p-2 rounded'>
            <span className='text-gray-300 font-semibold'>Fused Location:</span>
            <span className='font-mono font-semibold'>
              {location.fused.lat.toFixed(4)}, {location.fused.lon.toFixed(4)} ±
              {location.fused.accuracy}m
            </span>
          </div>

          <div className='text-gray-500 text-center mt-2'>
            GPS 85% / Network 15%
          </div>
        </div>
      </div>

      {/* Flight Data - Only show when both drone and stream are active */}
      {droneActive && streamActive && (
        <div className='space-y-3 mb-6'>
          <h3 className='text-sm font-semibold text-gray-400 uppercase'>
            Flight Data
          </h3>

          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-background p-3 rounded'>
              <div className='text-xs text-gray-400 mb-1'>Altitude</div>
              <div className='text-xl font-bold'>{flight.altitude} m</div>
              <div className='text-xs text-gray-500'>AGL</div>
            </div>

            <div className='bg-background p-3 rounded'>
              <div className='text-xs text-gray-400 mb-1'>Speed</div>
              <div className='text-xl font-bold'>{flight.speed} km/h</div>
            </div>

            <div className='bg-background p-3 rounded flex items-center space-x-3'>
              <Navigation
                className='w-6 h-6 text-primary'
                style={{ transform: `rotate(${flight.heading}deg)` }}
              />
              <div>
                <div className='text-xs text-gray-400 mb-1'>Heading</div>
                <div className='text-xl font-bold'>{flight.heading}°</div>
              </div>
            </div>

            <div
              className={`bg-background p-3 rounded ${getBatteryColor(
                battery.percentage
              )}`}
            >
              <div className='text-xs text-gray-400 mb-1'>Battery</div>
              <div className='flex items-center space-x-2'>
                <Battery className='w-6 h-6' />
                <div className='text-xl font-bold'>{battery.percentage}%</div>
              </div>
              <div className='text-xs text-gray-500'>
                ~{formatTime(battery.estimatedFlightTime)} remaining
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemetryPanel;
