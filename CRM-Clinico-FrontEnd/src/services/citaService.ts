import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

export interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  servicio: {
    id: string;
    nombre: string;
  };
  dentista: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
  cliente: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
}

export const citaService = {
  // Obtener todas las citas
  obtenerCitas: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Cita[] }>('/citas', config);
    return response.data.data;
  },

  // Obtener citas de un cliente específico
  obtenerCitasCliente: async (clienteId: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Cita[] }>(`/citas/cliente/${clienteId}`, config);
    return response.data.data;
  },

  // Crear una nueva cita
  crearCita: async (data: {
    clienteId: string;
    dentistaId: string;
    servicioId: string;
    fechaHora: string;
    duracion: number;
    notas?: string;
  }, config?: AxiosRequestConfig) => {
    const response = await api.post<{ status: string; data: Cita }>('/citas', data, config);
    return response.data.data;
  },

  // Actualizar el estado de una cita
  actualizarEstadoCita: async (id: string, data: {
    estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';
    motivoCancelacion?: string;
  }, config?: AxiosRequestConfig) => {
    const response = await api.patch<{ status: string; data: Cita }>(`/citas/${id}/estado`, data, config);
    return response.data.data;
  },

  // Obtener disponibilidad de un dentista
  obtenerDisponibilidadDentista: async (
    dentistaId: string,
    fecha: string,
    config?: AxiosRequestConfig
  ) => {
    const response = await api.get<{
      status: string;
      data: {
        fecha: string;
        horarioTrabajo: Array<{ inicio: string; fin: string }>;
        slotsDisponibles: Array<{ inicio: string; fin: string }>;
      };
    }>(`/citas/dentista/${dentistaId}/disponibilidad?fecha=${fecha}`, config);
    return response.data.data;
  }
};
