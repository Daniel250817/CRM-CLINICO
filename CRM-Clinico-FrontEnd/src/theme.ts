import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E60FA',
      light: '#4B83FB',
      dark: '#1543AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2ED47A',
      light: '#58DD96',
      dark: '#20945E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F03D3E',
      light: '#F36465',
      dark: '#A82A2B',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFB800',
      light: '#FFC633',
      dark: '#B28000',
      contrastText: '#000000',
    },
    info: {
      main: '#1890FF',
      light: '#46A9FF',
      dark: '#1064B2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2ED47A',
      light: '#58DD96',
      dark: '#20945E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

export default theme; 