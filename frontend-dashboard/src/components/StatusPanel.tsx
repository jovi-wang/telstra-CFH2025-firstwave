import {
  Signal,
  Radio,
  Activity,
  Zap,
  Video,
  Eye,
  Flame,
  Cloud,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { staticQoSProfiles } from '../utils/staticData';

const StatusPanel = () => {
  const formatBandwidth = (bps: number) => {
    return `${(bps / 1000000).toFixed(0)} Mbps`;
  };
  return (
    <div className='h-full flex flex-col p-3 space-y-3 overflow-y-auto'>
      {/* Device Status */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <Activity className='w-5 h-5 text-primary' />
          <h3 className='font-semibold text-sm'>Drone Network Status</h3>
        </div>
        <div className='space-y-3'>
          {/* Drone Device Connectivity */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <Signal className='w-4 h-4 text-primary' />
                <span className='text-sm font-medium'>
                  Device Connected Network Type
                </span>
              </div>
              <span className='text-primary text-xs font-semibold'>5G</span>
            </div>
          </div>
          {/* Drone Device Reachability */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <Radio className='w-4 h-4 text-success' />
                <span className='text-sm font-medium'>
                  Device Reachability Status
                </span>
              </div>
              <span className='text-success text-xs font-semibold'>DATA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Integrity Status */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <ShieldCheck className='w-5 h-5 text-primary' />
          <h3 className='font-semibold text-sm'>Device Integrity Status</h3>
        </div>
        <div className='space-y-3'>
          {/* Number Verified */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-success' />
                <span className='text-sm font-medium'>Number Verified</span>
              </div>
              <span className='text-success text-xs font-semibold'>PASS</span>
            </div>
          </div>
          {/* SIM Status */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-success' />
                <span className='text-sm font-medium'>SIM Status</span>
              </div>
              <span className='text-success text-xs font-semibold'>
                No Swap Detected
              </span>
            </div>
          </div>
          {/* Device Status */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-success' />
                <span className='text-sm font-medium'>Device Status</span>
              </div>
              <span className='text-success text-xs font-semibold'>
                No Swap Detected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available QoS Profiles */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <Zap className='w-5 h-5 text-danger' />
          <h3 className='font-semibold text-sm'>Available QoS Profiles</h3>
        </div>
        <div className='space-y-3'>
          {staticQoSProfiles.map((profile) => {
            const getIconColor = () => {
              switch (profile.name) {
                case 'QOS_H':
                  return 'text-success';
                case 'QOS_M':
                  return 'text-warning';
                case 'QOS_L':
                  return 'text-primary';
                default:
                  return 'text-gray-400';
              }
            };

            return (
              <div
                key={profile.name}
                className='bg-surface rounded p-2 border border-gray-700'
              >
                <div className='flex items-center space-x-2 mb-2'>
                  <Zap className={`w-4 h-4 ${getIconColor()}`} />
                  <span className='text-sm font-medium'>{profile.name}</span>
                </div>
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div className='text-gray-400'>
                    <span className='font-semibold text-white'>↓</span>{' '}
                    {formatBandwidth(profile.maxDownstreamRate)}
                  </div>
                  <div className='text-gray-400'>
                    <span className='font-semibold text-white'>↑</span>{' '}
                    {formatBandwidth(profile.maxUpstreamRate)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vision AI Models */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <Eye className='w-5 h-5 text-geofence' />
          <h3 className='font-semibold text-sm'>Vision AI Models</h3>
        </div>
        <div className='space-y-3'>
          {/* Thermal Detection */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Activity className='w-4 h-4 text-warning' />
              <span className='text-sm font-medium'>Thermal Detection</span>
            </div>
            <div className='text-xs text-gray-400'>
              Real-time heat signature analysis
            </div>
          </div>

          {/* Infrared Detection */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Activity className='w-4 h-4 text-danger' />
              <span className='text-sm font-medium'>Infrared Detection</span>
            </div>
            <div className='text-xs text-gray-400'>
              IR spectrum monitoring and analysis
            </div>
          </div>

          {/* Object Detection */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Eye className='w-4 h-4 text-primary' />
              <span className='text-sm font-medium'>Object Detection</span>
            </div>
            <div className='text-xs text-gray-400'>
              People, animals, vehicles detection
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Analysis */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <Flame className='w-5 h-5 text-danger' />
          <h3 className='font-semibold text-sm'>Environmental Analysis</h3>
        </div>
        <div className='space-y-3'>
          {/* Fire Spread Prediction */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Flame className='w-4 h-4 text-danger' />
              <span className='text-sm font-medium'>
                Fire Spread Prediction
              </span>
            </div>
            <div className='text-xs text-gray-400'>
              AI-powered fire behavior forecasting
            </div>
          </div>

          {/* Smoke Detection */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Cloud className='w-4 h-4 text-gray-400' />
              <span className='text-sm font-medium'>Smoke Detection</span>
            </div>
            <div className='text-xs text-gray-400'>
              Smoke coverage and density analysis
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure Services */}
      <div className='bg-background rounded-lg p-3 border border-gray-700'>
        <div className='flex items-center space-x-2 mb-3'>
          <Video className='w-5 h-5 text-primary' />
          <h3 className='font-semibold text-sm'>Infrastructure Services</h3>
        </div>
        <div className='space-y-3'>
          {/* Media Server */}
          <div className='bg-surface rounded p-2 border border-gray-700'>
            <div className='flex items-center space-x-2 mb-2'>
              <Video className='w-4 h-4 text-warning' />
              <span className='text-sm font-medium'>Media Server</span>
            </div>
            <div className='text-xs text-gray-400'>
              WebRTC video streaming and relay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
