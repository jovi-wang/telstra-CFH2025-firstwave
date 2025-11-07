import { memo } from 'react';
import { Activity, TrendingUp, TrendingDown, Signal } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  staticNetworkMetrics,
  staticQoSProfiles,
  staticQualityHistory,
} from '../utils/staticData';
import { useSystemStatusStore } from '../store/systemStatusStore';

const NetworkMetricsPanel = () => {
  const { performance } = staticNetworkMetrics;

  // Get QoS profile, QoD session ID, and stream status from store
  const currentQoSProfile = useSystemStatusStore(
    (state) => state.currentQoSProfile
  );
  const qodSessionId = useSystemStatusStore((state) => state.qodSessionId);
  const streamActive = useSystemStatusStore((state) => state.streamActive);

  // Get the active QoS profile details
  const activeProfile = staticQoSProfiles.find(
    (profile) => profile.name === currentQoSProfile
  );

  const formatBandwidth = (bps: number) => {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  };

  const getQoSBadgeColor = (profile: string) => {
    switch (profile) {
      case 'QOS_H':
        return 'text-success';
      case 'QOS_L':
        return 'text-primary';
      case 'QOS_M':
        return 'text-warning';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className='p-4'>
      <h2 className='text-lg font-semibold mb-4 flex items-center space-x-2'>
        <Activity className='w-5 h-5' />
        <span>Network Metrics</span>
      </h2>

      {/* Connected Network Type & Reachability */}
      <div className='space-y-3 mb-6'>
        <h3 className='text-sm font-semibold text-gray-400 uppercase'>
          Connected Network
        </h3>

        <div className='bg-background p-3 rounded'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center space-x-2'>
              <Signal className='w-4 h-4 text-success' />
              <span className='text-sm'>5G</span>
            </div>
            <span className='text-primary text-xs font-semibold'>DATA</span>
          </div>
        </div>
      </div>

      {/* QoS Status */}
      <div className='space-y-3 mb-6'>
        <h3 className='text-sm font-semibold text-gray-400 uppercase'>
          QoS Status
        </h3>

        <div className='bg-background p-3 rounded space-y-2'>
          {!qodSessionId || !streamActive ? (
            /* No Active QoD/Stream - Show All Available Profiles */
            <>
              <div className='text-sm text-gray-400 mb-2'>
                Available QoS Profiles:
              </div>
              <div className='space-y-2'>
                {staticQoSProfiles.map((profile) => (
                  <div
                    key={profile.name}
                    className='flex items-start space-x-2 text-xs'
                  >
                    <span className='text-gray-500 mt-0.5'>•</span>
                    <div className='flex-1'>
                      <span
                        className={`font-semibold ${getQoSBadgeColor(
                          profile.name
                        )}`}
                      >
                        {profile.name}
                      </span>
                      <span className='text-gray-500'> - </span>
                      <span className='text-gray-400'>
                        {formatBandwidth(profile.maxDownstreamRate)} down /{' '}
                        {formatBandwidth(profile.maxUpstreamRate)} up
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className='flex items-center justify-between pt-2 border-t border-gray-700'>
                <span className='text-sm text-gray-400'>
                  QoD Session Status:
                </span>
                <span className='font-semibold text-sm text-gray-500'>
                  Inactive
                </span>
              </div>
            </>
          ) : (
            /* Active QoD Session AND Stream - Show Active Session Details */
            <>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-400'>Active Profile:</span>
                <span
                  className={`text-xs font-semibold ${getQoSBadgeColor(
                    currentQoSProfile
                  )}`}
                >
                  {currentQoSProfile}
                </span>
              </div>

              {activeProfile && (
                <>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-400'>
                      Downstream Rate:
                    </span>
                    <span className='font-bold text-white'>
                      {formatBandwidth(activeProfile.maxDownstreamRate)}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-400'>
                      Upstream Rate:
                    </span>
                    <span className='font-bold text-white'>
                      {formatBandwidth(activeProfile.maxUpstreamRate)}
                    </span>
                  </div>
                </>
              )}

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-400'>QoD Session:</span>
                <span className='text-xs text-gray-500 font-mono'>
                  {qodSessionId}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-400'>
                  QoD Session Status:
                </span>
                <span className='font-semibold text-sm text-success'>
                  Active
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance KPIs - Only show when there is an active QoD session */}
      {qodSessionId && streamActive && (
        <div className='space-y-3 mb-6'>
          <h3 className='text-sm font-semibold text-gray-400 uppercase'>
            Performance
          </h3>

          <div className='grid grid-cols-3 gap-3'>
            <div className='bg-background p-3 rounded'>
              <div className='text-xs text-gray-400 mb-1'>Latency</div>
              <div className='text-xl font-bold text-success'>
                {performance.latency} ms
              </div>
            </div>

            <div className='bg-background p-3 rounded'>
              <div className='text-xs text-gray-400 mb-1'>Jitter</div>
              <div className='text-xl font-bold'>{performance.jitter} ms</div>
            </div>

            <div className='bg-background p-3 rounded'>
              <div className='text-xs text-gray-400 mb-1'>Packet Loss</div>
              <div className='text-xl font-bold text-success'>
                {performance.packetLoss}%
              </div>
            </div>
          </div>

          {/* Throughput */}
          <div className='bg-background p-3 rounded'>
            <div className='text-xs text-gray-400 mb-2'>Throughput</div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <TrendingDown className='w-4 h-4 text-success' />
                <span className='text-sm'>Download:</span>
                <span className='font-bold text-success'>
                  {formatBandwidth(performance.throughput.download)}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <TrendingUp className='w-4 h-4 text-primary' />
                <span className='text-sm'>Upload:</span>
                <span className='font-bold text-primary'>
                  {formatBandwidth(performance.throughput.upload)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latency Chart - Only show when there is an active QoD session */}
      {qodSessionId && streamActive && (
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold text-gray-400 uppercase'>
            Latency Timeline (Last 5 min)
          </h3>

          <div
            className='bg-background p-3 rounded'
            style={{ height: '200px' }}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={staticQualityHistory}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis
                  dataKey='timestamp'
                  stroke='#9CA3AF'
                  style={{ fontSize: '10px' }}
                />
                <YAxis
                  stroke='#9CA3AF'
                  style={{ fontSize: '10px' }}
                  label={{
                    value: 'ms',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: '10px', fill: '#9CA3AF' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='latency'
                  stroke='#3b82f6'
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NetworkMetricsPanel);
