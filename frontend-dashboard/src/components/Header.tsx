import { AlertCircle, Thermometer } from 'lucide-react';
import { staticMissionState } from '../utils/staticData';
import { useSystemStatusStore } from '../store/systemStatusStore';

interface HeaderProps {
  isEmergencyMode: boolean;
  onToggleEmergency: () => void;
}

const Header = ({ isEmergencyMode, onToggleEmergency }: HeaderProps) => {
  const { incidentType, location, incidentId } = staticMissionState;

  // Get system status from store
  const droneActive = useSystemStatusStore((state) => state.droneActive);
  const streamActive = useSystemStatusStore((state) => state.streamActive);
  const edgeProcessing = useSystemStatusStore((state) => state.edgeProcessing);

  return (
    <header className='bg-surface border-b border-gray-700 px-4 py-2'>
      <div className='flex items-center justify-between'>
        {/* Left: Incident Info or Temperature */}
        <div className='flex items-center space-x-6'>
          <h1 className='text-2xl font-bold'>Emergency Response Center</h1>
          {isEmergencyMode ? (
            // Emergency Mode: Show Incident Info
            <div className='flex items-center space-x-4 text-sm'>
              <span className='text-gray-400'>Incident:</span>
              <span className='font-semibold'>{incidentId}</span>
              <span className='text-gray-400'>|</span>
              <span>{incidentType}</span>
              <span className='text-gray-400'>|</span>
              <span className='text-gray-400'>
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </span>
            </div>
          ) : (
            // Normal Mode: Show Temperature
            <div className='flex items-center space-x-2 text-sm'>
              <Thermometer className='w-4 h-4 text-primary' />
              <span className='text-gray-400'>Temperature:</span>
              <span className='font-semibold'>40°C</span>
            </div>
          )}
        </div>

        {/* Right: Status Indicators */}
        <div className='flex items-center space-x-6'>
          {/* Status Indicators - Only show in emergency mode */}
          {isEmergencyMode && (
            <div className='flex items-center space-x-3 text-sm'>
              <div className='flex items-center space-x-1'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    droneActive ? 'bg-success' : 'bg-gray-500'
                  }`}
                ></div>
                <span>Drone Active</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    streamActive ? 'bg-success' : 'bg-gray-500'
                  }`}
                ></div>
                <span>Stream Active</span>
              </div>
              <div className='flex items-center space-x-1'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    edgeProcessing ? 'bg-success' : 'bg-gray-500'
                  }`}
                ></div>
                <span>Edge Processing</span>
              </div>
            </div>
          )}

          {/* Emergency Toggle Button */}
          <button
            onClick={onToggleEmergency}
            className={`${
              isEmergencyMode
                ? 'bg-danger hover:bg-red-600'
                : 'bg-warning hover:bg-yellow-600'
            } px-4 py-2 rounded flex items-center space-x-2 transition-colors`}
          >
            <AlertCircle className='w-4 h-4' />
            <span>{isEmergencyMode ? 'Exit Emergency' : 'Emergency Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
