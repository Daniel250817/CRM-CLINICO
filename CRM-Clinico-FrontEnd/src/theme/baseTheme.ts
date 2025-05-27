import type {} from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material';

// Definición de colores base
export const PRIMARY = '#1E60FA';
export const SECONDARY = '#30B4FF';
export const SUCCESS = '#2ED47A';
export const WARNING = '#FFB800';
export const ERROR = '#F03D3E';
export const INFO = '#1890FF';
export const WHITE = '#FFFFFF';
export const BLACK = '#000000';

// Paleta de grises
export const GREY = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// Base theme configuration (light theme)
export const baseTheme: ThemeOptions = {
  palette: {
    primary: {
      main: PRIMARY,
      light: '#5C8CFF',
      dark: '#0039C7',
      contrastText: WHITE,
    },
    secondary: {
      main: SECONDARY,
      light: '#71E5FF',
      dark: '#0085CC',
      contrastText: WHITE,
    },
    success: {
      main: SUCCESS,
      light: '#73FFA6',
      dark: '#00A14B',
      contrastText: WHITE,
    },
    warning: {
      main: WARNING,
      light: '#FFEA4D',
      dark: '#C78900',
      contrastText: BLACK,
    },
    error: {
      main: ERROR,
      light: '#FF7272',
      dark: '#B50000',
      contrastText: WHITE,
    },
    info: {
      main: INFO,
      light: '#6EC0FF',
      dark: '#0063CB',
      contrastText: WHITE,
    },
    grey: GREY,
    background: {
      default: '#F8F9FE',
      paper: WHITE,
    },
    text: {
      primary: GREY[900],
      secondary: GREY[700],
      disabled: GREY[500],
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
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
      fontWeight: 600,
      textTransform: 'none', // Los botones no tendrán texto en mayúsculas por defecto
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.08)',
    '0px 2px 6px rgba(0, 0, 0, 0.08)',
    '0px 3px 8px rgba(0, 0, 0, 0.08)',
    '0px 4px 12px rgba(0, 0, 0, 0.08)',
    '0px 5px 14px rgba(0, 0, 0, 0.08)',
    '0px 6px 16px rgba(0, 0, 0, 0.08)',
    '0px 7px 18px rgba(0, 0, 0, 0.08)',
    '0px 8px 20px rgba(0, 0, 0, 0.08)',
    '0px 9px 22px rgba(0, 0, 0, 0.08)',
    '0px 10px 24px rgba(0, 0, 0, 0.08)',
    '0px 11px 26px rgba(0, 0, 0, 0.08)',
    '0px 12px 28px rgba(0, 0, 0, 0.08)',
    '0px 13px 30px rgba(0, 0, 0, 0.08)',
    '0px 14px 32px rgba(0, 0, 0, 0.08)',
    '0px 15px 34px rgba(0, 0, 0, 0.08)',
    '0px 16px 36px rgba(0, 0, 0, 0.08)',
    '0px 17px 38px rgba(0, 0, 0, 0.08)',
    '0px 18px 40px rgba(0, 0, 0, 0.08)',
    '0px 19px 42px rgba(0, 0, 0, 0.08)',
    '0px 20px 44px rgba(0, 0, 0, 0.08)',
    '0px 21px 46px rgba(0, 0, 0, 0.08)',
    '0px 22px 48px rgba(0, 0, 0, 0.08)',
    '0px 23px 50px rgba(0, 0, 0, 0.08)',
    '0px 24px 52px rgba(0, 0, 0, 0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(30, 96, 250, 0.2)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0039C7',
          },
        },
        outlinedPrimary: {
          borderColor: PRIMARY,
          '&:hover': {
            backgroundColor: 'rgba(30, 96, 250, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'transparent',
            '&.Mui-focused': {
              backgroundColor: 'transparent'
            },
            '&:hover': {
              backgroundColor: 'transparent'
            },
            '&.Mui-focused:hover': {
              backgroundColor: 'transparent'
            },
            '& fieldset': {
              borderColor: GREY[300]
            },
            '&:hover fieldset': {
              borderColor: GREY[400]
            },
            '&.Mui-focused fieldset': {
              borderColor: PRIMARY
            }
          },
          '& .MuiInputBase-input': {
            backgroundColor: 'transparent',
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 1000px white inset',
              WebkitTextFillColor: GREY[900],
              caretColor: GREY[900],
              borderRadius: 'inherit'
            },
            '&:-webkit-autofill:hover': {
              WebkitBoxShadow: '0 0 0 1000px white inset'
            },
            '&:-webkit-autofill:focus': {
              WebkitBoxShadow: '0 0 0 1000px white inset'
            },
            '&:-webkit-autofill:active': {
              WebkitBoxShadow: '0 0 0 1000px white inset'
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: WHITE,
          color: GREY[900],
          boxShadow: '0px 1px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: WHITE,
          borderRight: '1px solid',
          borderColor: GREY[200],
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: GREY[50],
        },
      },
    },
  },
};
