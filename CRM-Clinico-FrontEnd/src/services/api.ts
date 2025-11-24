import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';

// Crear una instancia de axios con configuraciones base
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas (manejo global de errores y refresh de tokens)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (Token expirado) y no hemos intentado hacer refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isTokenError = error.response.data?.message?.toLowerCase().includes('token') ||
                          error.response.data?.message?.toLowerCase().includes('expirado') ||
                          error.response.data?.message?.toLowerCase().includes('inválido');
      
      if (isTokenError) {
        originalRequest._retry = true;

        try {
          // Importar authService dinámicamente para evitar dependencias circulares
          const { authService } = await import('./authService');
          const refreshResult = await authService.refreshToken();
          
          if (refreshResult) {
            // Actualizar el header de autorización y reenviar la solicitud original
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
        }

        // Si llegamos aquí, el refresh falló, redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.includes('/login')) {
          localStorage.setItem('redirectUrl', window.location.pathname);
          window.location.href = '/login';
        }
      }
    }
    
    // Devolver un error más descriptivo
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Error en la respuesta del servidor';
      return Promise.reject({
        ...error,
        customMessage: errorMessage,
        statusCode: error.response.status
      });
    } else if (error.request) {
      return Promise.reject({
        ...error,
        customMessage: 'No se recibió respuesta del servidor. Verifique su conexión a internet.'
      });
    } else {
      return Promise.reject({
        ...error,
        customMessage: 'Error al realizar la solicitud'
      });
    }
  }
);

// Funciones genéricas para peticiones HTTP
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },

  // Agregar la URL base como una propiedad del objeto api
  baseURL: config.API_BASE_URL
};