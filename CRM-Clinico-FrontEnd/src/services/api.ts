import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';

// DEBUG: Mostrar la URL base que estamos usando
console.log('API_BASE_URL:', config.API_BASE_URL);

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

  // Interceptor para manejar respuestas (manejo global de errores)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Loggear error para depuración
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Si el error es 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      // Solo limpiar token y redirigir si es un error de token inválido o expirado
      const isAuthError = error.response.data?.message?.toLowerCase().includes('token') ||
                        error.response.data?.message?.toLowerCase().includes('sesión');
      
      if (isAuthError) {
        // Limpiar token y cualquier otra información de autenticación
        localStorage.removeItem('token');
        
        // Comprobar si ya estamos en la página de login para evitar refrescos infinitos
        if (!window.location.pathname.includes('/login')) {
          // Guardar la URL actual para redirigir después del login
          localStorage.setItem('redirectUrl', window.location.pathname);
          // Redirigir al login
          window.location.href = '/login';
        }
      }
    }
    
    // Loggear error para depuración
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Devolver un error más descriptivo si es posible
    if (error.response) {
      // La solicitud fue realizada y el servidor respondió con un código de estado
      // que no está en el rango 2xx
      const errorMessage = error.response.data?.message || 'Error en la respuesta del servidor';
      return Promise.reject({
        ...error,
        customMessage: errorMessage,
        statusCode: error.response.status
      });
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      return Promise.reject({
        ...error,
        customMessage: 'No se recibió respuesta del servidor. Verifique su conexión a internet.'
      });
    } else {
      // Error al configurar la solicitud
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
  }
};