import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

export interface Nota {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string;
  creadoPor: number;
  createdAt: string;
  updatedAt: string;
  etiquetas?: string[];
  adjuntos?: string[];
  creador?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export interface CrearNotaDTO {
  titulo: string;
  contenido: string;
  categoria: string;
  etiquetas?: string[];
}

export interface NotaResponse {
  notas: Nota[];
  total: number;
  pagina: number;
  porPagina: number;
}

// Servicio para gestionar notas
const notaService = {
  obtenerNotas: async (params?: { 
    pagina?: number; 
    porPagina?: number;
    categoria?: string;
    busqueda?: string;
  }, config?: AxiosRequestConfig) => {
    const response = await api.get<NotaResponse>('/notas', { 
      params,
      ...config 
    });
    return response.data;
  },

  crearNota: async (nota: CrearNotaDTO, config?: AxiosRequestConfig) => {
    const response = await api.post<Nota>('/notas', nota, config);
    return response.data;
  },

  actualizarNota: async (id: number, datos: Partial<Nota>, config?: AxiosRequestConfig) => {
    const response = await api.patch<Nota>(`/notas/${id}`, datos, config);
    return response.data;
  },

  eliminarNota: async (id: number, config?: AxiosRequestConfig) => {
    const response = await api.delete(`/notas/${id}`, config);
    return response.data;
  },

  // Obtener una nota por ID
  getNotaPorId: async (id: number): Promise<Nota> => {
    try {
      const response = await api.get<{nota: Nota}>(`/notas/${id}`);
      return response.data.nota;
    } catch (error) {
      console.error(`Error al obtener la nota ${id}:`, error);
      throw error;
    }
  },

  // Obtener categorías disponibles
  obtenerCategorias: async (): Promise<string[]> => {
    try {
      const response = await api.get<{categorias: string[]}>('/notas/categorias');
      return response.data.categorias;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  }
};

export { notaService }; 