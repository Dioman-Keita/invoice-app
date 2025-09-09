// components/NotificationManager.jsx
import { useNotification } from '../context/useNotification';
import CMDTNotification from './CMDTNotification';

const NotificationManager = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="flex flex-col space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <CMDTNotification
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;