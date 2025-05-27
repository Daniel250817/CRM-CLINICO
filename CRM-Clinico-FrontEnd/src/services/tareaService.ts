import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  asignadoA: number;
  creadoPor: number;
  fechaLimite: string;
  estado: 'pendiente' | 'en progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  completadoEn: string | null;
  recordatorioEnviado: boolean;
  createdAt: string;
  updatedAt: string;
  responsable?: {
    id: number;
    nombre: string;
    email: string;
  };
  creador?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export interface CrearTareaDTO {
  titulo: string;
  descripcion: string;
  asignadoA: number;
  fechaLimite: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface TareaResponse {
  status: string;
  data: Tarea[];
  results: number;
}

export interface ResumenTareas {
  pendiente: number;
  'en progreso': number;
  completada: number;
  cancelada: number;
  vencidas: number;
}

// Servicio para gestionar tareas
const tareaService = {
  obtenerTareas: async (params?: { 
    pagina?: number; 
    porPagina?: number;
    estado?: string;
    prioridad?: string;
  }, config?: AxiosRequestConfig) => {
    const response = await api.get<TareaResponse>('/tareas', { 
      params,
      ...config 
    });
    return response.data;
  },

  crearTarea: async (tarea: CrearTareaDTO, config?: AxiosRequestConfig) => {
    const response = await api.post<Tarea>('/tareas', tarea, config);
    return response.data;
  },

  actualizarTarea: async (id: number, datos: Partial<Tarea>, config?: AxiosRequestConfig) => {
    const response = await api.patch<Tarea>(`/tareas/${id}`, datos, config);
    return response.data;
  },

  eliminarTarea: async (id: number, config?: AxiosRequestConfig) => {
    const response = await api.delete(`/tareas/${id}`, config);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: Tarea['estado'], config?: AxiosRequestConfig) => {
    console.log('Enviando petición:', { id, estado });
    const response = await api.patch<{ status: string; data: Tarea }>(`/tareas/${id}/estado`, { estado }, config);
    console.log('Respuesta recibida:', response.data);
    return response.data;
  },

  // Obtener una tarea por ID
  getTareaPorId: async (id: number): Promise<Tarea> => {
    try {
      const response = await api.get<{tarea: Tarea}>(`/tareas/${id}`);
      return response.data.tarea;
    } catch (error) {
      console.error(`Error al obtener la tarea ${id}:`, error);
      throw error;
    }
  },

  // Obtener resumen de tareas (pendientes, completadas, vencidas)
  getResumenTareas: async (): Promise<ResumenTareas> => {
    try {
      const response = await api.get<ResumenTareas>('/tareas/resumen');
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de tareas:', error);
      throw error;
    }
  }
};

export { tareaService };
