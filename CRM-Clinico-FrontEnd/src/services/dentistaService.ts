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
  activo: boolean;
}

export interface DisponibilidadSlot {
  inicio: string | Date;
  fin: string | Date;
}

export interface Disponibilidad {
  fecha: string;
  horarioTrabajo: DisponibilidadSlot[];
  slotsDisponibles: DisponibilidadSlot[];
}

export interface Especialidad {
  id: string;
  nombre: string;
}

export type DentistaCreacionDatos = Omit<Dentista, 'id' | 'usuario' | 'createdAt' | 'updatedAt'>;

export interface HorarioTrabajo {
  [dia: string]: Array<{ inicio: string; fin: string }>;
}

export interface CitaExistente {
  fechaHora: string;
  duracion: number;
}

export interface DisponibilidadRespuesta {
  horarioTrabajo: HorarioTrabajo;
  citas: CitaExistente[];
}

const calcularSlotsDisponibles = (
  fecha: string,
  horarioTrabajo: HorarioTrabajo,
  citas: CitaExistente[]
): DisponibilidadSlot[] => {
  // Convertir la fecha a objeto Date en UTC
  const fechaUTC = new Date(fecha);
  
  // Obtener el día de la semana en la zona horaria local del usuario
  const fechaLocal = new Date(fechaUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  const diaSemana = fechaLocal.getDay();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaStr = diasSemana[diaSemana];

  console.log('Calculando slots disponibles para:', {
    fechaOriginal: fecha,
    fechaUTC: fechaUTC.toISOString(),
    fechaLocal: fechaLocal.toISOString(),
    diaSemana,
    diaStr,
    horarioDisponible: horarioTrabajo[diaStr]
  });

  // Si no hay horario para este día, retornar array vacío
  if (!horarioTrabajo[diaStr] || horarioTrabajo[diaStr].length === 0) {
    console.log(`No hay horario definido para ${diaStr}`);
    return [];
  }

  // Convertir horarios del día a slots disponibles
  const slotsDisponibles: DisponibilidadSlot[] = horarioTrabajo[diaStr].map(horario => {
    // Crear fechas base en UTC
    const inicioBase = new Date(fechaUTC);
    const finBase = new Date(fechaUTC);
    
    // Convertir las horas del horario a la zona horaria local
    const [horaInicio, minInicio] = horario.inicio.split(':');
    const [horaFin, minFin] = horario.fin.split(':');
    
    // Establecer horas en UTC
    inicioBase.setUTCHours(parseInt(horaInicio), parseInt(minInicio), 0, 0);
    finBase.setUTCHours(parseInt(horaFin), parseInt(minFin), 0, 0);

    return {
      inicio: inicioBase.toISOString(),
      fin: finBase.toISOString()
    };
  });

  console.log('Slots base generados:', {
    slots: slotsDisponibles.map(slot => ({
      inicio: new Date(slot.inicio).toLocaleTimeString(),
      fin: new Date(slot.fin).toLocaleTimeString()
    })),
    horariosOriginales: horarioTrabajo[diaStr]
  });

  // Si no hay citas, retornar todos los slots del horario de trabajo
  if (!citas || citas.length === 0) {
    console.log('No hay citas existentes, retornando todos los slots');
    return slotsDisponibles;
  }

  console.log('Citas existentes:', citas.map(cita => ({
    inicio: new Date(cita.fechaHora).toLocaleTimeString(),
    duracion: cita.duracion
  })));

  // Filtrar slots que se solapan con citas existentes
  const slotsDisponiblesFiltrados = slotsDisponibles.filter(slot => {
    const inicioSlot = new Date(slot.inicio);
    const finSlot = new Date(slot.fin);

    // Verificar si el slot se solapa con alguna cita
    const seSolapa = citas.some(cita => {
      const inicioCita = new Date(cita.fechaHora);
      const finCita = new Date(inicioCita.getTime() + cita.duracion * 60000);

      const solapa = (
        (inicioCita >= inicioSlot && inicioCita < finSlot) || // La cita comienza durante el slot
        (finCita > inicioSlot && finCita <= finSlot) || // La cita termina durante el slot
        (inicioCita <= inicioSlot && finCita >= finSlot) // La cita cubre todo el slot
      );

      if (solapa) {
        console.log('Slot solapado:', {
          slot: {
            inicio: inicioSlot.toLocaleTimeString(),
            fin: finSlot.toLocaleTimeString()
          },
          cita: {
            inicio: inicioCita.toLocaleTimeString(),
            fin: finCita.toLocaleTimeString()
          }
        });
      }

      return solapa;
    });

    return !seSolapa;
  });

  console.log('Slots disponibles después de filtrar:', 
    slotsDisponiblesFiltrados.map(slot => ({
      inicio: new Date(slot.inicio).toLocaleTimeString(),
      fin: new Date(slot.fin).toLocaleTimeString()
    }))
  );
  
  return slotsDisponiblesFiltrados;
};

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
    try {
      // Primero obtenemos todos los dentistas activos
      const response = await api.get<{ status: string; data: Dentista[] }>('/dentistas', {
        ...config,
        params: {
          ...config?.params,
          status: 'activo'
        }
      });

      const dentistas = response.data.data;
      
      // Filtramos los dentistas que tienen disponibilidad para la fecha dada
      const dentistasDisponibles = await Promise.all(
        dentistas.map(async (dentista) => {
          try {
            const disponibilidad = await api.get<{ status: string; data: any }>(
              `/dentistas/${dentista.id}/disponibilidad`,
              {
                params: { fecha }
              }
            );
            
            // Si el dentista tiene horario para ese día, lo incluimos
            if (disponibilidad.data.data.horarioTrabajo && 
                Object.values(disponibilidad.data.data.horarioTrabajo).some((slots: any) => slots.length > 0)) {
              return dentista;
            }
            return null;
          } catch (error) {
            console.error(`Error al verificar disponibilidad del dentista ${dentista.id}:`, error);
            return null;
          }
        })
      );

      // Filtramos los nulls y devolvemos solo los dentistas disponibles
      return dentistasDisponibles.filter((dentista): dentista is Dentista => dentista !== null);
    } catch (error) {
      console.error('Error al obtener dentistas disponibles:', error);
      throw error;
    }
  },

  // Obtener todas las especialidades
  obtenerEspecialidades: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Especialidad[] }>('/dentistas/especialidades', config);
    return response.data.data;
  },

  // Obtener disponibilidad de un dentista
  obtenerDisponibilidad: async (dentistaId: string, config?: AxiosRequestConfig) => {
    try {
      const fecha = config?.params?.fecha || new Date().toISOString().split('T')[0];
      
      const response = await api.get<{ status: string; data: DisponibilidadRespuesta }>(
        `/dentistas/${dentistaId}/disponibilidad`,
        {
          ...config,
          params: {
            ...config?.params,
            fecha
          }
        }
      );

      console.log('Respuesta del servidor (disponibilidad):', response.data);

      if (!response.data || !response.data.data) {
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }

      const { horarioTrabajo, citas } = response.data.data;

      // Calcular slots disponibles
      const slotsDisponibles = calcularSlotsDisponibles(fecha, horarioTrabajo, citas);

      console.log('Slots disponibles calculados:', slotsDisponibles);

      return {
        fecha,
        horarioTrabajo,
        slotsDisponibles
      };
    } catch (error) {
      console.error('Error completo al obtener disponibilidad:', error);
      if (error instanceof Error) {
        throw new Error(`Error al obtener disponibilidad: ${error.message}`);
      } else {
        throw new Error('Error al obtener disponibilidad del dentista');
      }
    }
  },

  // Actualizar dentista (para admin o el propio dentista)
  actualizarDentista: async (id: string, datos: Partial<Dentista>, config?: AxiosRequestConfig) => {
    const response = await api.patch<{ status: string; data: Dentista }>(`/dentistas/${id}`, datos, config);
    return response.data.data;
  }
};
