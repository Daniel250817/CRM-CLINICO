import { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  ListItemIcon,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';

interface TopBarProps {
  onDrawerToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onDrawerToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  // Cargar notificaciones
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications(page, 10, false);
        setNotifications(prev => page === 0 ? response.data : [...prev, ...response.data]);
        setHasMore(response.data.length > 0 && response.pagina < response.paginasTotales - 1);
        
        // Actualizar contador de no leídas
        const unreadResponse = await notificationService.getUnreadCount();
        setUnreadCount(unreadResponse);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        addNotification('Error al cargar notificaciones', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isNotificationsMenuOpen) {
      fetchNotifications();
    }
  }, [isNotificationsMenuOpen, page, addNotification]);

  // Actualizar contador de no leídas periódicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error al actualizar contador de notificaciones:', error);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      addNotification('Error al cerrar sesión', 'error');
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      handleMenuClose(); // Cerrar el menú después de marcar todas como leídas
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
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      handleMenuClose();
      
      // Redirigir a la página correspondiente
      const redirectPath = getNotificationRedirectPath(notification);
      navigate(redirectPath);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      addNotification('Error al marcar notificación como leída', 'error');
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return notificationDate.toLocaleDateString('es-ES');
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id="primary-search-account-menu"
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Configuración
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Cerrar Sesión
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationsAnchorEl}
      id="notifications-menu"
      keepMounted
      open={isNotificationsMenuOpen}
      onClose={handleMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
          px: 1
        }
      }}
    >
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">Notificaciones</Typography>
        <Typography 
          variant="caption" 
          color="primary" 
          sx={{ cursor: 'pointer' }}
          onClick={handleMarkAllAsRead}
        >
          Marcar todas como leídas
        </Typography>
      </Box>
      
      <Divider />
      
      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay notificaciones nuevas
          </Typography>
        </Box>
      ) : (
        <>
          {notifications.slice(0, 5).map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={() => handleMarkAsRead(notification)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
                <Avatar sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: notification.tipo === 'alerta' ? 'error.main' : 
                           notification.tipo === 'recordatorio' ? 'warning.main' : 
                           'primary.main' 
                }}>
                  <NotificationsIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={!notification.leida ? 'bold' : 'regular'}>
                      {notification.mensaje}
                    </Typography>
                    {!notification.leida && (
                      <CircleIcon sx={{ color: 'primary.main', fontSize: 8 }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatDate(notification.fecha)}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
          
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button 
              size="small" 
              onClick={() => {
                handleMenuClose();
                navigate('/notifications');
              }}
              fullWidth
            >
              Ver todas las notificaciones
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          CRM Clínico
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            aria-label={`mostrar ${unreadCount} nuevas notificaciones`}
            color="inherit"
            onClick={handleNotificationsMenuOpen}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="cuenta del usuario actual"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              sx={{ width: 32, height: 32 }}
              src={user?.settings?.avatar}
            >
              <PersonIcon />
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
      {renderMenu}
      {renderNotificationsMenu}
    </AppBar>
  );
};

export default TopBar;
