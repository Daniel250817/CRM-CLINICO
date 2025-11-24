import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserSettings {
  id: number;
  userId: number;
  theme: string;
  language: string;
  notificationEmail: boolean;
  notificationApp: boolean;
  notificationSMS: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'dentista' | 'asistente' | 'cliente';
  estado?: 'activo' | 'inactivo';
  avatar?: string;
  ultimo_acceso?: string | null;
  createdAt?: string;
  updatedAt?: string;
  settings?: UserSettings;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RefreshTokenResponse {
  status: string;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

// Define RegisterData interface for user registration
export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  passwordConfirm: string;
  telefono?: string;
  rol?: 'admin' | 'dentista' | 'asistente' | 'cliente';
}

export class AuthError extends Error {
  public code?: string;
  public statusCode?: number;

  constructor(
    message: string,
    code?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Servicio para autenticación
const authService = {
  // Iniciar sesión
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<any>('/auth/login', credentials);
        // Adaptamos la estructura de respuesta
      const responseData: AuthResponse = {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.data
      };
      
      // Guardar tokens en localStorage
      localStorage.setItem('token', responseData.token);
      if (responseData.refreshToken) {
        localStorage.setItem('refreshToken', responseData.refreshToken);
      }
      
      // Si rememberMe está activado, guardamos también el email para autocompletar
      if (credentials.rememberMe) {
        localStorage.setItem('rememberedEmail', credentials.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      return responseData;
    } catch (error: any) {
      // En desarrollo, ignoramos el rate limit
      if (import.meta.env.DEV && 
          (error.response?.status === 429 || 
          (error.response?.status === 400 && error.response?.data?.message?.includes('Demasiadas solicitudes')))) {
        console.warn('Rate limit ignorado en modo desarrollo');
        // Simular una respuesta exitosa
        return {
          token: 'dev-token',
          user: {
            id: 1,
            nombre: 'Usuario de Desarrollo',
            email: credentials.email,
            rol: 'admin',
            estado: 'activo'
          }
        };
      }
      
      // En producción o para otros errores, mantener el comportamiento normal
      if (error.response?.status === 429 || 
          (error.response?.status === 400 && error.response?.data?.message?.includes('Demasiadas solicitudes'))) {
        throw new AuthError(
          'Has excedido el límite de intentos de inicio de sesión. Por favor, espera 15 minutos antes de intentar nuevamente.',
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }
      
      // Manejar error de credenciales inválidas
      if (error.response?.status === 401) {
        throw new AuthError(
          'Credenciales inválidas. Por favor verifica tu email y contraseña.',
          'INVALID_CREDENTIALS',
          401
        );
      }

      // Manejar error de usuario inactivo o bloqueado
      if (error.response?.status === 403) {
        throw new AuthError(
          'Tu cuenta está inactiva o bloqueada. Por favor contacta al administrador.',
          'ACCOUNT_INACTIVE',
          403
        );
      }

      // Error general del servidor
      if (error.response?.status >= 500) {
        throw new AuthError(
          'Error en el servidor. Por favor intenta más tarde.',
          'SERVER_ERROR',
          error.response.status
        );
      }

      // Cualquier otro error
      throw new AuthError(
        error.response?.data?.message || 'Error al iniciar sesión',
        'LOGIN_ERROR',
        error.response?.status
      );
    }
  },
  // Cerrar sesión
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Mantener el email recordado si existe
  },

  // Refrescar token de acceso
  refreshToken: async (): Promise<RefreshTokenResponse | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.warn('No hay refresh token disponible');
        return null;
      }

      const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });

      // Actualizar tokens en localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      return response.data;
    } catch (error: any) {
      console.error('Error al refrescar token:', error);
      
      // Si el refresh token es inválido, limpiar tokens y cerrar sesión
      if (error.response?.status === 401) {
        authService.logout();
      }
      
      return null;
    }
  },
  
  // Verificar si el usuario está autenticado (tiene token)
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    try {
      // Decodificar el token (formato: header.payload.signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si el token ha expirado
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token expirado');
        localStorage.removeItem('token');
        return false;
      }

      // Verificar que el token tenga los campos necesarios
      if (!payload.id || !payload.rol) {
        console.warn('Token inválido - faltan campos requeridos');
        localStorage.removeItem('token');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar token:', error);
      localStorage.removeItem('token');
      return false;
    }
  },

  // Obtener usuario actual
  getCurrentUser: async (): Promise<User> => {
    try {
      console.log('Obteniendo información del usuario actual...');
      const response = await api.get<any>('/auth/verify');
      
      console.log('Respuesta del servidor:', response.data);
      
      // Intentar obtener los datos del usuario de diferentes ubicaciones posibles en la respuesta
      const userData = response.data.data || response.data.user || response.data;
      
      if (!userData) {
        console.error('No se encontraron datos de usuario en la respuesta');
        throw new AuthError('No se encontraron datos de usuario');
      }

      console.log('Datos del usuario encontrados:', userData);
      
      // Asegurarse de que tenemos los campos requeridos
      if (!userData.id || !userData.rol) {
        console.error('Datos de usuario incompletos:', userData);
        throw new AuthError('Datos de usuario incompletos');
      }
      
      // Asegurarse de que los settings estén presentes
      if (!userData.settings) {
        console.warn('No se encontraron settings en la respuesta, intentando obtenerlos...');
        try {
          const settingsResponse = await api.get<any>('/settings');
          userData.settings = settingsResponse.data.data;
        } catch (error) {
          console.error('Error al obtener settings:', error);
        }
      }
      
      return {
        id: userData.id,
        nombre: userData.nombre || 'Usuario',
        email: userData.email || '',
        rol: userData.rol,
        telefono: userData.telefono,
        estado: userData.estado || 'activo',
        settings: userData.settings,
        ultimo_acceso: userData.ultimo_acceso,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      
      if (error.response?.status === 401) {
        // Token inválido o expirado
        console.warn('Token inválido o expirado, cerrando sesión...');
        authService.logout();
        throw new AuthError(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          'SESSION_EXPIRED',
          401
        );
      }
      
      throw new AuthError(
        'Error al obtener información del usuario',
        'GET_USER_ERROR',
        error.response?.status
      );
    }
  },

  // Obtener settings del usuario
  getUserSettings: async (): Promise<UserSettings> => {
    try {
      const response = await api.get<any>('/settings');
      return response.data.data;
    } catch (error: any) {
      throw new AuthError(
        'Error al obtener configuración del usuario',
        'GET_SETTINGS_ERROR',
        error.response?.status
      );
    }
  },

  // Actualizar settings del usuario
  updateUserSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      const response = await api.put<any>('/settings', settings);
      return response.data.data;
    } catch (error: any) {
      throw new AuthError(
        'Error al actualizar configuración del usuario',
        'UPDATE_SETTINGS_ERROR',
        error.response?.status
      );
    }
  },

  // Actualizar información del usuario
  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.patch<any>(`/users/${userId}`, userData);
      return response.data.data;
    } catch (error: any) {
      throw new AuthError(
        'Error al actualizar información del usuario',
        'UPDATE_USER_ERROR',
        error.response?.status
      );
    }
  },

  // Actualizar avatar del usuario
  updateAvatar: async (userId: number, avatarFile: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.post<any>(`/settings/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (!response.data || !response.data.data) {
        throw new Error('Respuesta inválida del servidor');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar el avatar:', error);
      throw new AuthError(
        error.response?.data?.message || 'Error al actualizar el avatar',
        'UPDATE_AVATAR_ERROR',
        error.response?.status
      );
    }
  },

  async fetchUserSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<ApiResponse<UserSettings>>('/settings');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener settings del usuario:', error);
      throw error;
    }
  },

  // Registrar usuario
  register: async (data: RegisterData): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<ApiResponse<User>>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        console.error('Error de validación:', error.response.data);
        throw new AuthError(
          error.response.data.message || 'Error de validación en los datos enviados',
          'VALIDATION_ERROR',
          422
        );
      }
      // Re-throw other errors
      throw error;
    }
  },
};

export { authService };
export default authService;
