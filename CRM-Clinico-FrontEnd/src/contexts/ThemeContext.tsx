import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { baseTheme } from '../theme/baseTheme';
import { darkThemeOptions } from '../theme/darkTheme';

// Define the theme mode type
type ThemeMode = 'light' | 'dark';

// Define the theme context type
interface ThemeContextProps {
  mode: ThemeMode;
  toggleThemeMode: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Create a hook to use the theme context
export const useThemeContext = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Define the ThemeProvider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Create a ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create the theme based on the current mode
  const theme = useMemo(() => {
    return createTheme({
      ...baseTheme,
      ...(mode === 'dark' ? darkThemeOptions : {}),
      palette: {
        ...baseTheme.palette,
        ...(mode === 'dark' ? darkThemeOptions.palette : {}),
        mode,
      },
    });
  }, [mode]);

  // Provide the theme context value
  const contextValue = useMemo(() => ({
    mode,
    toggleThemeMode,
  }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};