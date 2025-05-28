import { useState } from 'react';
import { 
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Collapse,
  Badge
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Forum as ForumIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Analytics as AnalyticsIcon,
  NoteAlt as NoteIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  drawerWidth: number;
  onDrawerToggle: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  children?: { title: string; path: string }[];
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ open, drawerWidth, onDrawerToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleSubmenuClick = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const mainNavItems: NavItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      roles: ['admin', 'dentista', 'asistente']
    },
    {
      title: 'Citas',
      path: '/appointments/calendar',
      icon: <CalendarIcon />,
      badge: 4,
      roles: ['admin', 'dentista'],
      children: [
        { title: 'Calendario', path: '/appointments/calendar' },
        { title: 'Lista de Citas', path: '/appointments/list' },
        { title: 'Programar Cita', path: '/appointments/new' }
      ]
    },
    {
      title: 'Pacientes',
      path: '/patients/list',
      icon: <PersonIcon />,
      roles: ['admin', 'dentista'],
      children: [
        { title: 'Lista de Pacientes', path: '/patients/list' },
        { title: 'Nuevo Paciente', path: '/patients/new' },
        { title: 'Historial Médico', path: '/patients/medical-history' }
      ]
    },
    {
      title: 'Dentistas',
      path: '/dentistas/list',
      icon: <SupervisorAccountIcon />,
      roles: ['admin'],
      children: [
        { title: 'Lista de Dentistas', path: '/dentistas/list' },
        { title: 'Nuevo Dentista', path: '/dentistas/new' },
        { title: 'Disponibilidad', path: '/dentistas/availability' }
      ]
    },
    {
      title: 'Servicios',
      path: '/services',
      icon: <MedicalServicesIcon />,
      roles: ['admin', 'dentista']
    },
    {
      title: 'Tareas y Notas',
      path: '/tasks',
      icon: <AssignmentIcon />,
      badge: 2,
      roles: ['admin', 'dentista', 'asistente'],
      children: [
        { title: 'Tablero Kanban', path: '/tasks' },
        { title: 'Lista de Tareas', path: '/tasks/list' },
        { title: 'Nueva Tarea/Nota', path: '/tasks/new' }
      ]
    },
    {
      title: 'Seguimientos',
      path: '/followups',
      icon: <TimelineIcon />,
      roles: ['admin', 'dentista']
    }
  ];

  const secondaryNavItems: NavItem[] = [
    {
      title: 'Notificaciones',
      path: '/notifications',
      icon: <NotificationsIcon />,
      badge: 5,
      roles: ['admin', 'dentista', 'asistente']
    },
    {
      title: 'Mensajes',
      path: '/messages',
      icon: <ForumIcon />,
      badge: 3,
      roles: ['admin', 'dentista', 'asistente']
    },
    {
      title: 'Estadísticas',
      path: '/statistics',
      icon: <AnalyticsIcon />,
      roles: ['admin']
    },
    {
      title: 'Configuración',
      path: '/settings',
      icon: <SettingsIcon />,
      roles: ['admin', 'dentista', 'asistente']
    }
  ];

  // Filtrar elementos del menú según el rol del usuario
  const filteredMainNavItems = mainNavItems.filter(
    item => !item.roles || (user && item.roles.includes(user.rol))
  );

  const filteredSecondaryNavItems = secondaryNavItems.filter(
    item => !item.roles || (user && item.roles.includes(user.rol))
  );

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: 'primary.main',
            mr: 2
          }}
        >
          D
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          DentalCRM
        </Typography>
      </Box>
      
      <Divider />
      
      <Box sx={{ px: 3, py: 2 }}>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'background.default'
          }}
        >
          <Avatar 
            src="/src/assets/avatar.png"
            alt={user?.nombre || 'Usuario'}
            sx={{ width: 50, height: 50 }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.nombre || 'Usuario'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.rol || 'Sin rol'}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List component="nav" sx={{ px: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 3, py: 1, display: 'block' }}
          >
            Principal
          </Typography>
          
          {filteredMainNavItems.map((item) => (
            <Box key={item.title}>
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: isActiveRoute(item.path) ? 'primary.light' : 'transparent',
                    color: isActiveRoute(item.path) ? 'primary.contrastText' : 'inherit',
                    '&:hover': {
                      bgcolor: isActiveRoute(item.path) 
                        ? 'primary.light' 
                        : 'action.hover'
                    },
                  }}
                  onClick={
                    item.children 
                      ? () => handleSubmenuClick(item.title) 
                      : undefined
                  }
                >
                  <ListItemIcon
                    sx={{
                      color: isActiveRoute(item.path) ? 'primary.contrastText' : 'inherit',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.title} />
                  
                  {item.badge && (
                    <Badge 
                      badgeContent={item.badge} 
                      color="error" 
                      sx={{ mr: item.children ? 1 : 0 }}
                    />
                  )}
                  
                  {item.children && (
                    openSubmenu === item.title ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  )}
                </ListItemButton>
              </ListItem>
              
              {item.children && (
                <Collapse in={openSubmenu === item.title} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton 
                        key={child.title}
                        sx={{ 
                          pl: 6,
                          py: 0.5,
                          borderRadius: 1,
                          ml: 2,
                          mb: 0.5,
                          bgcolor: isActiveRoute(child.path) ? 'primary.main' : 'transparent',
                          color: isActiveRoute(child.path) ? 'primary.contrastText' : 'inherit',
                          '&:hover': {
                            bgcolor: isActiveRoute(child.path) 
                              ? 'primary.dark' 
                              : 'action.hover',
                          },
                        }}
                      >
                        <ListItemText 
                          primary={child.title} 
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: isActiveRoute(child.path) ? 'medium' : 'regular'
                          }} 
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 3, py: 1, display: 'block' }}
          >
            Sistema
          </Typography>
          
          {filteredSecondaryNavItems.map((item) => (
            <ListItem key={item.title} disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: isActiveRoute(item.path) ? 'primary.light' : 'transparent',
                  color: isActiveRoute(item.path) ? 'primary.contrastText' : 'inherit',
                  '&:hover': {
                    bgcolor: isActiveRoute(item.path) ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.contrastText' : 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
                {item.badge && <Badge badgeContent={item.badge} color="error" />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2025 DentalCRM v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="persistent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'fixed',
            height: '100%'
          },
        }}
        open={open}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
