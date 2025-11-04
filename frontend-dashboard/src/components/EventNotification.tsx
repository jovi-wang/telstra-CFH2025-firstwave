import { useState, useEffect, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import type { SystemEvent } from '../services/eventStreamService';

interface NotificationProps {
  event: SystemEvent;
  onClose: () => void;
}

const EventNotification = ({ event, onClose }: NotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  }, [onClose]);

  // Auto-close after fixed duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  // Format event message based on event type
  const getMessage = () => {
    switch (event.event_type) {
      case 'geofence':
        return 'Geofencing boundary breach detected';
      case 'connected_network_type':
        return 'Device connected network type changed';
      case 'device_reachability':
        return 'Device reachability status changed';
      case 'connectivity_insight':
        return 'Video streaming connectivity QoS breached';
      case 'incoming_webrtc':
        return 'Incoming WebRTC call from drone-001';
      default:
        return 'System notification';
    }
  };

  // Get title based on event type
  const getTitle = () => {
    switch (event.event_type) {
      case 'geofence':
        return 'Geofence Alert';
      case 'connected_network_type':
        return 'Network Type Change';
      case 'device_reachability':
        return 'Device Reachability';
      case 'connectivity_insight':
        return 'Connectivity Alert';
      case 'incoming_webrtc':
        return 'Incoming Call';
      default:
        return 'Notification';
    }
  };

  return (
    <div
      className={`
        bg-blue-800 border-blue-400 text-blue-100
        rounded-lg shadow-lg border-l-4 p-4 mb-3 min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-in-out
        ${
          isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
        }
      `}
    >
      <div className='flex items-start space-x-3'>
        {/* Icon */}
        <div className='flex-shrink-0 text-blue-300'>
          <Info className='w-5 h-5' />
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <h4 className='font-semibold text-sm mb-1'>{getTitle()}</h4>
              <p className='text-sm opacity-90 break-words'>{getMessage()}</p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className='flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity'
              aria-label='Close notification'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventNotification;
