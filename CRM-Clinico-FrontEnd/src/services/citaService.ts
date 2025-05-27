import { api } from './api';
import type { AxiosRequestConfig } from 'axios';
import dayjs from 'dayjs';

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

export interface NuevaCitaDTO {
  clienteId: number;
  dentistaId: number;
  servicioId: number;
  fechaHora: string;
  duracion: number;
  notas: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
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
  crearCita: async (data: NuevaCitaDTO, config?: AxiosRequestConfig) => {
    try {
      // Validar datos antes de enviar
      if (!data.clienteId || !data.dentistaId || !data.servicioId || !data.fechaHora) {
        throw new Error('Faltan campos requeridos');
      }

      // Validar formato de fecha y convertir a UTC
      const fechaLocal = dayjs(data.fechaHora);
      if (!fechaLocal.isValid()) {
        throw new Error('Formato de fecha inválido');
      }

      // Asegurar que la fecha está en UTC
      const fechaUTC = fechaLocal.utc();

      // Validar duración
      if (!Number.isInteger(data.duracion) || data.duracion < 15) {
        throw new Error('La duración debe ser un número entero mayor o igual a 15 minutos');
      }

      const citaData = {
        clienteId: data.clienteId,
        dentistaId: data.dentistaId,
        servicioId: data.servicioId,
        fechaHora: fechaUTC.format('YYYY-MM-DDTHH:mm:ss[Z]'),
        duracion: Number(data.duracion),
        notas: data.notas || '',
        estado: data.estado
      };

      console.log('Enviando datos al servidor:', citaData);
      console.log('Fecha original:', data.fechaHora);
      console.log('Fecha UTC a enviar:', citaData.fechaHora);

      const response = await api.post<{ status: string; data: Cita }>('/citas', citaData, config);
      return response.data.data;
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Response data:', error.response?.data);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        let errorMessage = 'Error de validación: ';
        
        if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else if (errorData.errors && typeof errorData.errors === 'object') {
          // Si errors es un objeto, convertir sus valores a un array y unirlos
          errorMessage += Object.values(errorData.errors)
            .flat()
            .filter(msg => typeof msg === 'string')
            .join(', ');
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else {
          errorMessage += JSON.stringify(errorData);
        }
        
        throw new Error(errorMessage);
      }

      // Si no es un error 422, lanzar el error original con un mensaje más descriptivo
      throw new Error(`Error al crear la cita: ${error.message || 'Error desconocido'}`);
    }
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
