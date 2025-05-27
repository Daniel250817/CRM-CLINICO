import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

// Definición de los tipos
export interface Dentista {
  id: string;
  userId: string;
  usuario: {
    id: string;
    nombre: string;
    apellidos?: string;
    email: string;
    telefono?: string;
  };
  especialidad: string;
  horarioTrabajo: {
    [key: string]: Array<{ inicio: string; fin: string }>;
  };
  status: 'activo' | 'inactivo' | 'vacaciones';
  titulo?: string;
  numeroColegiado?: string;
  añosExperiencia?: number;
  biografia?: string;
  fotoPerfil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Disponibilidad {
  fecha: string;
  horarioTrabajo: {
    [dia: string]: Array<{ inicio: string; fin: string }>;
  };
  slotsDisponibles: Array<{
    inicio: string;
    fin: string;
  }>;
}

export interface Especialidad {
  id: string;
  nombre: string;
}

export type DentistaCreacionDatos = Omit<Dentista, 'id' | 'usuario' | 'createdAt' | 'updatedAt'>;

export const dentistaService = {
  // Obtener todos los dentistas
  obtenerDentistas: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Dentista[] }>('/dentistas', config);
    return response.data.data;
  },

  // Obtener un dentista específico
  obtenerDentista: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Dentista }>(`/dentistas/${id}`, config);
    return response.data.data;
  },
  
  // Crear un nuevo dentista
  crearDentista: async (datos: DentistaCreacionDatos, config?: AxiosRequestConfig) => {
    const response = await api.post<{ status: string; data: Dentista }>('/dentistas', datos, config);
    return response.data.data;
  },
  // Obtener dentistas disponibles para una fecha específica
  obtenerDentistasDisponibles: async (fecha: string, config?: AxiosRequestConfig) => {
    // Agregamos un parámetro status=activo para obtener solo dentistas activos
    const response = await api.get<{ status: string; data: Dentista[] }>(
      `/dentistas?status=activo&fecha=${fecha}`,
      config
    );
    return response.data.data;
  },

  // Obtener todas las especialidades
  obtenerEspecialidades: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Especialidad[] }>('/dentistas/especialidades', config);
    return response.data.data;
  },

  // Obtener disponibilidad de un dentista
  obtenerDisponibilidad: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Disponibilidad[] }>(`/dentistas/${id}/disponibilidad`, config);
    return response.data.data;
  },

  // Actualizar dentista (para admin o el propio dentista)
  actualizarDentista: async (id: string, datos: Partial<Dentista>, config?: AxiosRequestConfig) => {
    const response = await api.patch<{ status: string; data: Dentista }>(`/dentistas/${id}`, datos, config);
    return response.data.data;
  }
};
