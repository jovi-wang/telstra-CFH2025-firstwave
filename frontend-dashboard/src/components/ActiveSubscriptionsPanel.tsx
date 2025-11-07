import { Bell, CheckCircle2 } from 'lucide-react';
import { useSystemStatusStore } from '../store/systemStatusStore';

export interface Subscription {
  id: string;
  type: string;
  deviceId: string;
  createdAt: string;
  parameters?: Record<string, any>;
}

interface ActiveSubscriptionsPanelProps {
  subscriptions: Subscription[];
  isEmergencyMode: boolean;
}

const ActiveSubscriptionsPanel = ({
  subscriptions,
  isEmergencyMode,
}: ActiveSubscriptionsPanelProps) => {
  const streamActive = useSystemStatusStore((state) => state.streamActive);
  const formatParameters = (params?: Record<string, any>) => {
    if (!params) return null;

    return Object.entries(params)
      .map(([key, value]) => {
        // Format specific parameter types
        if (key === 'radius' && typeof value === 'number') {
          return `${key}: ${value}m`;
        }
        if (
          (key === 'latitude' || key === 'longitude') &&
          typeof value === 'number'
        ) {
          return `${key}: ${value.toFixed(4)}`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  // Add connectivity insights subscription when stream is active
  const connectivityInsightsSubscription: Subscription | null = streamActive
    ? {
        id: 'conn-insights-static',
        type: 'Connectivity Insights',
        deviceId: 'drone-001',
        createdAt: new Date().toISOString(),
      }
    : null;

  const webrtcSubscription: Subscription = {
    id: 'webrtc-static',
    type: 'WebRTC',
    deviceId: 'drone-001',
    createdAt: new Date().toISOString(),
  };

  // Combine static subscriptions with existing subscriptions
  // Always show webrtcSubscription in emergency mode
  let allSubscriptions = [...subscriptions];
  if (isEmergencyMode) {
    allSubscriptions = [webrtcSubscription, ...allSubscriptions];
  }
  if (connectivityInsightsSubscription) {
    allSubscriptions = [connectivityInsightsSubscription, ...allSubscriptions];
  }

  return (
    <div className='h-full flex flex-col p-3 space-y-3 overflow-y-auto'>
      <div className='flex items-center space-x-2 mb-2'>
        <Bell className='w-5 h-5 text-primary' />
        <h3 className='font-semibold text-sm'>Active Subscriptions</h3>
        <span className='text-xs text-gray-400'>
          ({allSubscriptions.length})
        </span>
      </div>

      {allSubscriptions.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-6 text-gray-400'>
          <Bell className='w-10 h-10 mb-2 opacity-30' />
          <p className='text-xs'>No active subscriptions</p>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {allSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className='bg-background rounded-lg p-2 border border-gray-700 w-full'
            >
              <div className='flex items-start justify-between mb-1'>
                <div className='flex items-center space-x-1'>
                  <CheckCircle2 className='w-4 h-4 text-success' />
                  <span className='text-xs font-medium'>
                    {subscription.type}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-[10px] font-bold text-success'>
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className='space-y-0.5 text-[10px] text-gray-400'>
                <div className='flex justify-between'>
                  <span>Device:</span>
                  <span className='text-white font-mono'>
                    {subscription.deviceId}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Subscription ID:</span>
                  <span className='text-white font-mono'>
                    {subscription.id}
                  </span>
                </div>
                {subscription.parameters && (
                  <div className='mt-1 pt-1 border-t border-gray-700'>
                    <div className='text-white text-[10px] font-mono'>
                      {formatParameters(subscription.parameters)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveSubscriptionsPanel;
