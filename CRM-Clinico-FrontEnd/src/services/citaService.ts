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
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';
  notas?: string;
  cliente: {
    id: string;
    usuario: {
      nombre: string;
      email: string;
      telefono: string;
    }
  };
  dentista: {
    id: string;
    usuario: {
      nombre: string;
      email: string;
      telefono: string;
    }
  };
  servicio: {
    id: string;
    nombre: string;
    duracion: number;
  };
}

interface CitaDTO {
  clienteId: number;
  dentistaId: number;
  servicioId: number;
  fechaHora: string;
  duracion: number;
  notas?: string;
  estado?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

interface GetCitasParams {
  params?: {
    estado?: string;
    desde?: string;
    hasta?: string;
  };
}

const citaService = {
  async obtenerCitas(options: GetCitasParams = {}): Promise<Cita[]> {
    try {
      const response = await api.get<ApiResponse<Cita[]>>('/citas', options);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener citas:', error);
      throw new Error('Error al obtener las citas');
    }
  },

  async obtenerCitaPorId(id: string): Promise<Cita> {
    try {
      const response = await api.get<ApiResponse<Cita>>(`/citas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener cita:', error);
      throw new Error('Error al obtener la cita');
    }
  },

  async crearCita(citaData: CitaDTO): Promise<Cita> {
    try {
      // La fecha ya viene en UTC desde el calendario
      const fechaOriginal = citaData.fechaHora;
      
      // Crear objeto dayjs manteniendo UTC
      const fechaUTC = dayjs(fechaOriginal);
      
      // Obtener la fecha local para logging
      const fechaLocal = fechaUTC.local();

      console.log('Conversión de fecha en servicio:', {
        fechaOriginal,
        fechaParseada: fechaLocal.format('YYYY-MM-DD HH:mm:ss'),
        fechaUTC: fechaOriginal,
        offset: dayjs().format('Z'),
        horaLocal: fechaLocal.format('HH:mm'),
        horaUTC: fechaUTC.format('HH:mm')
      });

      const response = await api.post<ApiResponse<Cita>>('/citas', {
        ...citaData,
        fechaHora: fechaOriginal // Mantener la fecha UTC original
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error completo:', error);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
      throw error;
    }
  },

  async actualizarEstadoCita(id: string, estado: string, motivoCancelacion?: string): Promise<Cita> {
    try {
      const response = await api.patch<ApiResponse<Cita>>(`/citas/${id}/estado`, {
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
    const response = await api.get<ApiResponse<Cita[]>>(`/clientes/${clienteId}/citas`, config);
    return response.data.data;
  },

  // Obtener disponibilidad de un dentista
  obtenerDisponibilidadDentista: async (
    dentistaId: string,
    fecha: string,
    config?: AxiosRequestConfig
  ) => {
    const response = await api.get<ApiResponse<{
      fecha: string;
      horarioTrabajo: Array<{ inicio: string; fin: string }>;
      slotsDisponibles: Array<{ inicio: string; fin: string }>;
    }>>(`/citas/dentista/${dentistaId}/disponibilidad?fecha=${fecha}`, config);
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
      const response = await api.patch<ApiResponse<Cita>>(`/citas/${id}/fecha`, {
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
