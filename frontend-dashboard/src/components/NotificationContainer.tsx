import { useState, useEffect } from 'react';
import EventNotification from './EventNotification';
import eventStreamService from '../services/eventStreamService';
import type { SystemEvent } from '../services/eventStreamService';

const NotificationContainer = () => {
  const [notifications, setNotifications] = useState<
    (SystemEvent & { id: string })[]
  >([]);

  useEffect(() => {
    // Subscribe to all events
    const handleEvent = (event: SystemEvent) => {
      // Skip region_device_count events - they're shown on the map, not as notifications
      if (event.event_type === 'region_device_count') {
        return;
      }

      const notificationWithId = {
        ...event,
        id: `${Date.now()}-${Math.random()}`,
      };

      setNotifications((prev) => [...prev, notificationWithId]);

      // Limit to max 5 notifications on screen
      setNotifications((prev) => prev.slice(-5));
    };

    eventStreamService.on('all', handleEvent);

    return () => {
      eventStreamService.off('all', handleEvent);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div className='fixed top-20 right-4 z-50 pointer-events-none'>
      <div className='flex flex-col items-end pointer-events-auto'>
        {notifications.map((notification) => (
          <EventNotification
            key={notification.id}
            event={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
