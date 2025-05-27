import React, { createContext, useContext, useState, useCallback } from 'react';

// Define our own AlertColor type since it's no longer exported from MUI v7
export type AlertColor = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: AlertColor;
  autoHideDuration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: AlertColor, autoHideDuration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {}
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID for each notification
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Add a notification
  const addNotification = useCallback(
    (message: string, type: AlertColor = 'info', autoHideDuration: number = 6000) => {
      const id = generateUniqueId();
      
      setNotifications((prev) => [
        ...prev,
        {
          id,
          message,
          type,
          autoHideDuration
        }
      ]);

      // Auto remove notification after duration
      if (autoHideDuration !== null) {
        setTimeout(() => {
          removeNotification(id);
        }, autoHideDuration);
      }
    },
    []
  );

  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
