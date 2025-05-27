import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';

// Import authService and User type
import authService, { AuthError } from '../services/authService';
import type { User, UserSettings } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<UserSettings>;
  updateUser: (userId: number, userData: Partial<User>) => Promise<User>;
  updateAvatar: (userId: number, avatarFile: File) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { addNotification } = useNotification();

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        if (error instanceof AuthError) {
          addNotification(error.message, 'error');
        }
        setIsAuthenticated(false);
        setUser(null);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [addNotification]);

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      if (!authService.isAuthenticated()) {
        setIsAuthenticated(false);
        setUser(null);
        setSettings(null);
        return false;
      }
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setSettings(userData.settings || null);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.statusCode === 401) {
          // Token inválido o expirado
          authService.logout();
        }
        throw error;
      }
      throw new AuthError('Error al verificar autenticación');
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      setUser(response.user);
      setSettings(response.user.settings || null);
      setIsAuthenticated(true);
      addNotification('Inicio de sesión exitoso', 'success');
    } catch (error) {
      if (error instanceof AuthError) {
        // Mostrar mensaje específico según el tipo de error
        addNotification(error.message, 'error');
        
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          // Podríamos implementar un contador aquí si queremos
          addNotification('Por favor, espera antes de intentar nuevamente', 'warning');
        }
      } else {
        addNotification('Error inesperado al iniciar sesión', 'error');
      }
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSettings(null);
    addNotification('Sesión cerrada exitosamente', 'info');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = await authService.updateUserSettings(newSettings);
      setSettings(updatedSettings);
      addNotification('Configuración actualizada exitosamente', 'success');
      return updatedSettings;
    } catch (error) {
      if (error instanceof AuthError) {
        addNotification(error.message, 'error');
      } else {
        addNotification('Error al actualizar la configuración', 'error');
      }
      throw error;
    }
  };

  const updateUser = async (userId: number, userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateUser(userId, userData);
      setUser(prevUser => ({
        ...prevUser!,
        ...updatedUser
      }));
      addNotification('Información actualizada exitosamente', 'success');
      return updatedUser;
    } catch (error) {
      if (error instanceof AuthError) {
        addNotification(error.message, 'error');
      } else {
        addNotification('Error al actualizar la información', 'error');
      }
      throw error;
    }
  };

  const updateAvatar = async (userId: number, avatarFile: File) => {
    try {
      const updatedUser = await authService.updateAvatar(userId, avatarFile);
      setUser(prevUser => ({
        ...prevUser!,
        ...updatedUser
      }));
      addNotification('Avatar actualizado exitosamente', 'success');
      return updatedUser;
    } catch (error) {
      if (error instanceof AuthError) {
        addNotification(error.message, 'error');
      } else {
        addNotification('Error al actualizar el avatar', 'error');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        settings,
        loading,
        login,
        logout,
        updateSettings,
        updateUser,
        updateAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
