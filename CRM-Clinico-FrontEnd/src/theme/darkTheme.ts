import type {} from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material';
import { GREY, PRIMARY } from './baseTheme';

// Dark Theme Configuration
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: '#111827',
      paper: '#1F2937',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F2937',
          color: '#F9FAFB',
          boxShadow: '0px 1px 10px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1F2937',
          borderRight: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F2937',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#4C81FB', // Lighter primary for dark mode
          },
        },
        outlinedPrimary: {
          borderColor: PRIMARY,
          '&:hover': {
            backgroundColor: 'rgba(30, 96, 250, 0.12)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#374151',
          color: '#F9FAFB',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};
