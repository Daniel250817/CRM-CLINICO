import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { baseTheme } from '../theme/baseTheme';
import { darkThemeOptions } from '../theme/darkTheme';

// Define the theme mode type
type ThemeMode = 'light' | 'dark';

// Define the theme context type
interface ThemeContextType {
  mode: ThemeMode;
  toggleThemeMode: () => void;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleThemeMode: () => {},
});

// Create a hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

// Define the ThemeProvider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Create a ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Obtener el tema guardado en localStorage o usar el tema del sistema
  const storedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
  const [mode, setMode] = useState<ThemeMode>(storedTheme || 'light');

  // Verificar preferencia del sistema si no hay tema guardado
  useEffect(() => {
    if (!storedTheme) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [storedTheme]);

  // Guardar el tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // Actualizar el atributo data-theme en el elemento raíz
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

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