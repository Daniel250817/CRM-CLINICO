import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import TopBar from './TopBar';
import SideNav from './SideNav';

interface MainLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

const drawerWidth = 250;

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden',
        '& .MuiBox-root': {
          paddingLeft: '0 !important',
          marginLeft: '0 !important'
        }
      }}
    >
      {/* TopBar / AppBar */}
      <TopBar 
        onDrawerToggle={handleDrawerToggle}
      />
      
      {/* Sidebar */}
      <SideNav 
        open={sidebarOpen}
        drawerWidth={drawerWidth}
        onClose={handleDrawerToggle}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          height: '88vh',
          marginTop: '56px',
          position: 'absolute',
          left: sidebarOpen ? drawerWidth + 20 : 0,
          right: 0,
          transition: theme.transitions.create(['left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflow: 'auto',
          '& > *': {
            width: '97%',
            height: '100%'
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;