import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';
import type { AlertColor } from '../../contexts/NotificationContext';

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const handleClose = (id: string) => (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    removeNotification(id);
  };

  return (
    <Stack 
      spacing={1} 
      sx={{ 
        position: 'fixed', 
        zIndex: 2000, 
        top: 24, 
        right: 24, 
        maxWidth: { xs: '90%', sm: 400 },
        '& > *': {
          position: 'relative !important',
          transform: 'none !important',
          maxWidth: '100%'
        }
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={handleClose(notification.id)}
          sx={{ 
            position: 'relative',
            transform: 'none',
            marginBottom: 1
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type as AlertColor}
            variant="filled"
            sx={{ width: '100%', boxShadow: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default NotificationSystem;