import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { addNotification } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page);
      setNotifications(prev => page === 0 ? response.data : [...prev, ...response.data]);
      setHasMore(response.data.length > 0 && response.pagina < response.paginasTotales - 1);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      addNotification('Error al cargar notificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      addNotification('Todas las notificaciones han sido marcadas como leídas', 'success');
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      addNotification('Error al marcar notificaciones como leídas', 'error');
    }
  };

  const getNotificationRedirectPath = (notification: Notification): string => {
    const { entidadTipo, entidadId } = notification;
    
    switch (entidadTipo) {
      case 'cita':
        return `/appointments/${entidadId}`;
      case 'tarea':
        return '/tasks';
      case 'paciente':
        return `/patients/${entidadId}`;
      case 'servicio':
        return `/services`;
      default:
        return '/notifications';
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, leida: true } : n
      ));
      
      // Redirigir a la página correspondiente
      const redirectPath = getNotificationRedirectPath(notification);
      navigate(redirectPath);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      addNotification('Error al marcar notificación como leída', 'error');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      addNotification('Notificación eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      addNotification('Error al eliminar notificación', 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(id);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
        return 'error.main';
      case 'recordatorio':
        return 'warning.main';
      default:
        return 'primary.main';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Notificaciones
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleMarkAllAsRead}
          startIcon={<CheckCircleIcon />}
        >
          Marcar todas como leídas
        </Button>
      </Box>

      <Card>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6">
                Centro de Notificaciones
              </Typography>
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay notificaciones
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: !notification.leida ? 'action.hover' : 'transparent',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => !notification.leida && handleMarkAsRead(notification)}
                    secondaryAction={
                      <>
                        <IconButton
                          edge="end"
                          aria-label="más opciones"
                          onClick={(e) => handleMenuOpen(e, notification.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.tipo) }}>
                        <NotificationsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={!notification.leida ? 'bold' : 'regular'}>
                            {notification.mensaje}
                          </Typography>
                          {!notification.leida && (
                            <CircleIcon sx={{ color: 'primary.main', fontSize: 8 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(notification.fecha)}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={notification.tipo.charAt(0).toUpperCase() + notification.tipo.slice(1)}
                              color={
                                notification.tipo === 'alerta' ? 'error' :
                                notification.tipo === 'recordatorio' ? 'warning' : 'primary'
                              }
                            />
                            {notification.entidadTipo && (
                              <Chip
                                size="small"
                                label={notification.entidadTipo.charAt(0).toUpperCase() + notification.entidadTipo.slice(1)}
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}

          {hasMore && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                onClick={handleLoadMore}
                disabled={loading}
                variant="outlined"
              >
                {loading ? <CircularProgress size={24} /> : 'Cargar más'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (selectedNotification) {
              handleMarkAsRead(notifications.find(n => n.id === selectedNotification) as Notification);
              handleMenuClose();
            }
          }}
        >
          <ListItemAvatar>
            <CheckCircleIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText primary="Marcar como leída" />
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedNotification) {
              handleDeleteNotification(selectedNotification);
              handleMenuClose();
            }
          }}
        >
          <ListItemAvatar>
            <DeleteIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText primary="Eliminar" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationsPage; 