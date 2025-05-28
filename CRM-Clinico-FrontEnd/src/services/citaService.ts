import { api } from './api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { AxiosRequestConfig } from 'axios';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  cliente: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
  dentista: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
  servicio: {
    id: string;
    nombre: string;
  };
}

interface CitaDTO {
  clienteId: number;
  dentistaId: number;
  servicioId: number;
  fechaHora: string;
  duracion: number;
  notas?: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
}

interface GetCitasParams {
  params?: {
    dentista?: string;
    cliente?: string;
    fecha?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
  };
}

const citaService = {
  async obtenerCitas(options: GetCitasParams = {}): Promise<Cita[]> {
    try {
      const response = await api.get('/citas', options);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener citas:', error);
      throw new Error('Error al obtener las citas');
    }
  },

  async obtenerCitaPorId(id: string): Promise<Cita> {
    try {
      const response = await api.get(`/citas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener cita:', error);
      throw new Error('Error al obtener la cita');
    }
  },

  async crearCita(citaData: CitaDTO): Promise<Cita> {
    try {
      // Asegurarnos de que la fecha esté en UTC
      const fechaOriginal = citaData.fechaHora;
      const fechaUTC = dayjs(fechaOriginal).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

      console.log('Conversión de fecha en servicio:', {
        fechaOriginal,
        fechaParseada: dayjs(fechaOriginal).format('YYYY-MM-DD HH:mm:ss'),
        fechaUTC,
        offset: dayjs().format('Z')
      });

      const response = await api.post('/citas', {
        ...citaData,
        fechaHora: fechaUTC
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error completo:', error);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
      throw error; // Propagar el error original para mantener el mensaje del backend
    }
  },

  async actualizarEstadoCita(id: string, estado: string, motivoCancelacion?: string): Promise<Cita> {
    try {
      const response = await api.patch(`/citas/${id}/estado`, {
        estado,
        motivoCancelacion
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar estado de cita:', error);
      throw new Error('Error al actualizar el estado de la cita');
    }
  },

  // Obtener citas de un cliente específico
  obtenerCitasCliente: async (clienteId: string, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Cita[] }>(`/clientes/${clienteId}/citas`, config);
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
  },

  async actualizarFechaHoraCita(id: string, fechaHora: string, duracion?: number): Promise<Cita> {
    try {
      // Convertir a UTC
      const fechaUTC = dayjs(fechaHora).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      
      console.log('Actualizando fecha de cita:', {
        fechaOriginal: fechaHora,
        fechaUTC,
        duracion
      });

      // Usar la ruta específica para actualizar fecha y hora
      const response = await api.patch<{ status: string; data: Cita }>(`/citas/${id}/fecha`, {
        fechaHora: fechaUTC,
        ...(duracion && { duracion })
      });

      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar fecha de cita:', error);
      throw error;
    }
  }
};

export { citaService };
export type { CitaDTO };
