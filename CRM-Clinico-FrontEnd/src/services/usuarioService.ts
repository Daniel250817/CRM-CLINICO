import { api } from './api';
import type { AxiosRequestConfig } from 'axios';
import type { User } from './authService';

export interface Usuario extends User {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'dentista' | 'asistente' | 'cliente';
  estado: 'activo' | 'inactivo';
  avatar?: string;
}

export const usuarioService = {
  // Obtener todos los usuarios
  obtenerUsuarios: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Usuario[] }>('/usuarios', config);
    return response.data.data;
  },

  // Obtener un usuario específico
  obtenerUsuario: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Usuario }>(`/usuarios/${id}`, config);
    return response.data.data;
  },

  // Crear un nuevo usuario
  crearUsuario: async (datos: Omit<Usuario, 'id'>, config?: AxiosRequestConfig) => {
    const response = await api.post<{ status: string; data: Usuario }>('/usuarios', datos, config);
    return response.data.data;
  },

  // Actualizar un usuario
  actualizarUsuario: async (id: string, datos: Partial<Usuario>, config?: AxiosRequestConfig) => {
    const response = await api.patch<{ status: string; data: Usuario }>(`/usuarios/${id}`, datos, config);
    return response.data.data;
  },

  // Eliminar un usuario
  eliminarUsuario: async (id: string, config?: AxiosRequestConfig) => {
    await api.delete(`/usuarios/${id}`, config);
  },
    // Obtener usuarios por rol
  obtenerUsuariosPorRol: async (rol: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Usuario[] }>(`/usuarios?rol=${rol}`, config);
    return response.data.data;
  }
};
