import { useState } from 'react';
import { NotificationContext } from './NotificationContext';

export const NotificationProvider = ({ children }) => {

  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success: (msg) => addNotification('success', msg),
        error: (msg) => addNotification('error', msg),
        warning: (msg) => addNotification('warning', msg),
        info: (msg) => addNotification('info', msg)
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
