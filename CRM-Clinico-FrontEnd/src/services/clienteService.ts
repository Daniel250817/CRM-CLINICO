import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

// Interfaz de lo que devuelve la API
export interface ClienteAPI {
  id: string;
  userId: number;
  historialMedico?: {
    alergias: string;
    cirugiasPrevias: string;
    enfermedadesCronicas: string;
    medicamentosActuales: string;
  };
  alergias?: string;
  fechaRegistro: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
  usuario?: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    fechaNacimiento: string;
    genero: string;
    createdAt: string;
  };
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: string;
  contactoEmergencia?: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
  notas?: string;
  telefonoEmergencia?: string;
  ultimaVisita?: string;
}

// Interfaz adaptada para el frontend (como esperan los componentes)
export interface Cliente {
  id: string;
  name: string; // Combinación de nombre y apellidos
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  address?: string; // Agregando dirección como opcional
  lastVisit?: string; // Fecha de última cita
  nextVisit?: string; // Fecha de próxima cita
  treatmentStatus?: 'En tratamiento' | 'Pendiente' | 'Completado';
  avatar?: string | null;
  birthDate?: string;
  gender?: string;
  medical?: {
    history?: string;
    allergies?: string;
  };
  usuario: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    fechaNacimiento: Date | null;
    genero: string;
  };
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: string;
  contactoEmergencia?: {
    nombre: string;
    telefono: string;
    relacion: string;
  } | undefined;
  historialMedico?: {
    alergias: string;
    cirugiasPrevias: string;
    enfermedadesCronicas: string;
    medicamentosActuales: string;
  };
}

export interface TratamientoCliente {
  id: string;
  name: string;
  startDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  dentist: string;
  sessions: number;
  completedSessions: number;
  notes?: string;
}

export interface CitaCliente {
  id: string;
  date: string;
  time: string;
  service: string;
  dentist: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export interface DocumentoCliente {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  url?: string;
}

export interface PagoCliente {
  id: string;
  date: string;
  amount: number;
  concept: string;
  status: 'paid' | 'pending' | 'refunded';
  method: string;
}

export interface ClientePerfil {
  cliente: Cliente;
  tratamientos: TratamientoCliente[];
  citas: CitaCliente[];
  documentos: DocumentoCliente[];
  pagos: PagoCliente[];
  historialMedico?: any;
}

export interface Usuario {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: Date | null;
  genero: string;
}

export interface RegistroClienteDTO {
  usuario: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    fechaNacimiento: string | null;
    genero: string;
  };
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  ocupacion: string | null;
  estadoCivil: string | null;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  } | null;
  historialMedico: {
    alergias: string | null;
    enfermedadesCronicas: string | null;
    medicamentosActuales: string | null;
    cirugiasPrevias: string | null;
  } | null;
}

export interface ActualizarClienteDTO {
  usuario: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    fechaNacimiento: string | null;
    genero: string;
  };
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  ocupacion: string | null;
  estadoCivil: string | null;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  } | null;
  historialMedico: {
    alergias: string | null;
    enfermedadesCronicas: string | null;
    medicamentosActuales: string | null;
    cirugiasPrevias: string | null;
  };
}

// Función para adaptar los datos de la API al formato que espera el frontend
const adaptClienteToUI = (cliente: ClienteAPI): Cliente => {
  return {
    id: cliente.id,
    name: `${cliente.usuario?.nombre || ''} ${cliente.usuario?.apellidos || ''}`.trim(),
    email: cliente.usuario?.email || '',
    phone: cliente.usuario?.telefono || '',
    status: cliente.estado === 'activo' ? 'active' : 'inactive',
    avatar: null,
    birthDate: cliente.usuario?.fechaNacimiento,
    gender: cliente.usuario?.genero,
    medical: {
      history: cliente.historialMedico?.cirugiasPrevias,
      allergies: cliente.historialMedico?.alergias
    },
    usuario: {
      nombre: cliente.usuario?.nombre || '',
      apellidos: cliente.usuario?.apellidos || '',
      email: cliente.usuario?.email || '',
      telefono: cliente.usuario?.telefono || '',
      fechaNacimiento: cliente.usuario?.fechaNacimiento ? new Date(cliente.usuario.fechaNacimiento) : null,
      genero: cliente.usuario?.genero || ''
    },
    direccion: cliente.direccion || '',
    ciudad: cliente.ciudad || '',
    codigoPostal: cliente.codigoPostal || '',
    ocupacion: cliente.ocupacion || '',
    estadoCivil: cliente.estadoCivil || '',
    contactoEmergencia: cliente.contactoEmergencia || undefined,
    historialMedico: cliente.historialMedico ? {
      alergias: cliente.historialMedico.alergias || '',
      enfermedadesCronicas: cliente.historialMedico.enfermedadesCronicas || '',
      medicamentosActuales: cliente.historialMedico.medicamentosActuales || '',
      cirugiasPrevias: cliente.historialMedico.cirugiasPrevias || ''
    } : {
      alergias: '',
      enfermedadesCronicas: '',
      medicamentosActuales: '',
      cirugiasPrevias: ''
    }
  };
};

// Función para agregar datos de citas al cliente
const addAppointmentsData = (cliente: Cliente, citas: any[] | undefined): Cliente => {
  if (!citas || citas.length === 0) {
    return cliente;
  }

  // Ordenar citas por fecha
  const citasOrdenadas = [...citas].sort((a, b) => 
    new Date(a.fechaHora || a.date).getTime() - new Date(b.fechaHora || b.date).getTime()
  );

  // Encontrar última cita (fecha más reciente en el pasado)
  const hoy = new Date();
  const ultimasCitas = citasOrdenadas.filter(cita => 
    new Date(cita.fechaHora || cita.date) <= hoy && 
    cita.estado !== 'cancelada' && 
    cita.estado !== 'no asistió'
  );
  const ultimaCita = ultimasCitas.length > 0 ? ultimasCitas[ultimasCitas.length - 1] : null;

  // Encontrar próxima cita (fecha más cercana en el futuro)
  const proximasCitas = citasOrdenadas.filter(cita => 
    new Date(cita.fechaHora || cita.date) > hoy && 
    cita.estado !== 'cancelada'
  );
  const proximaCita = proximasCitas.length > 0 ? proximasCitas[0] : null;

  // Determinar estado del tratamiento basado en citas
  let treatmentStatus = 'Pendiente' as 'Pendiente' | 'En tratamiento' | 'Completado';
  if (ultimaCita && !proximaCita) {
    treatmentStatus = 'Completado';
  } else if (ultimaCita) {
    treatmentStatus = 'En tratamiento';
  }

  return {
    ...cliente,
    lastVisit: ultimaCita ? (ultimaCita.fechaHora || ultimaCita.date) : undefined,
    nextVisit: proximaCita ? (proximaCita.fechaHora || proximaCita.date) : undefined,
    treatmentStatus
  };
};

export const clienteService = {
  // Obtener todos los clientes (pacientes)
  obtenerTodosLosClientes: async (config?: AxiosRequestConfig) => {
    try {
      const clientesResponse = await api.get<{ status: string; data: ClienteAPI[] }>('/clientes', config);
      const clientes = clientesResponse.data.data;
      
      // Transformar los datos de cada cliente al formato de UI
      const clientesUI: Cliente[] = [];
      
      for (const cliente of clientes) {
        // Obtener citas para cada cliente
        let citas: CitaCliente[] = [];
        try {
          const citasResponse = await api.get<{ status: string; data: CitaCliente[] }>(
            `/clientes/${cliente.id}/citas`
          );
          citas = citasResponse.data.data;
        } catch (error) {
          console.error(`Error al obtener citas para cliente ${cliente.id}:`, error);
        }
        
        // Adaptar cliente al formato UI y añadir información de citas
        const clienteUI = adaptClienteToUI(cliente);
        clientesUI.push(addAppointmentsData(clienteUI, citas));
      }
      
      return clientesUI;
    } catch (error) {
      console.error('Error en obtenerTodosLosClientes:', error);
      throw error;
    }
  },

  // Buscar clientes
  buscarClientes: async (query: string, config?: AxiosRequestConfig) => {
    try {
      const response = await api.get<{ status: string; data: ClienteAPI[] }>(
        `/clientes/buscar?q=${query}`, 
        config
      );
      
      // Adaptar clientes al formato UI
      const clientesUI: Cliente[] = [];
      
      for (const cliente of response.data.data) {
        // También obtener citas para resultados de búsqueda
        let citas: CitaCliente[] = [];
        try {
          const citasResponse = await api.get<{ status: string; data: CitaCliente[] }>(
            `/clientes/${cliente.id}/citas`
          );
          citas = citasResponse.data.data;
        } catch (error) {
          console.error(`Error al obtener citas para cliente ${cliente.id}:`, error);
        }
        
        const clienteUI = adaptClienteToUI(cliente);
        clientesUI.push(addAppointmentsData(clienteUI, citas));
      }
      
      return clientesUI;
    } catch (error) {
      console.error('Error en buscarClientes:', error);
      throw error;
    }
  },

  // Obtener perfil de cliente específico con sus citas
  obtenerPerfilCliente: async (id: string, config?: AxiosRequestConfig) => {
    try {
      // Validación del ID
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Se requiere un ID de cliente válido');
      }

      // Obtener datos del cliente
      const clienteResponse = await api.get<{ status: string; data: ClienteAPI }>(
        `/clientes/${id}`, 
        config
      );
      
      // Obtener citas del cliente
      let citas: CitaCliente[] = [];
      try {
        const citasResponse = await api.get<{ status: string; data: CitaCliente[] }>(
          `/clientes/${id}/citas`
        );
        citas = citasResponse.data.data;
      } catch (error) {
        console.error(`Error al obtener citas para cliente ${id}:`, error);
      }
      
      // Adaptar datos al formato UI y agregar información de citas
      const clienteUI = adaptClienteToUI(clienteResponse.data.data);
      return addAppointmentsData(clienteUI, citas);
    } catch (error) {
      console.error('Error en obtenerPerfilCliente:', error);
      throw error;
    }
  },

  // Obtener citas de un cliente específico
  obtenerCitasCliente: async (id: string, config?: AxiosRequestConfig) => {
    try {
      // Validación del ID
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Se requiere un ID de cliente válido');
      }

    const response = await api.get<{ status: string; data: CitaCliente[] }>(`/clientes/${id}/citas`, config);
    return response.data.data;
    } catch (error) {
      console.error('Error en obtenerCitasCliente:', error);
      throw error;
    }
  },

  // Obtener perfil completo con todos los datos del cliente
  obtenerPerfilCompleto: async (id: string, config?: AxiosRequestConfig) => {
    try {
      // Validación del ID
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Se requiere un ID de cliente válido');
      }

      // Obtener cliente
      const cliente = await clienteService.obtenerPerfilCliente(id, config);
      
      // Obtener citas
      const citas = await clienteService.obtenerCitasCliente(id, config);
      
      // TODO: Cuando existan los endpoints, obtener tratamientos, documentos y pagos reales
      // Por ahora usamos datos de ejemplo
      const tratamientos: TratamientoCliente[] = [
        {
          id: '1',
          name: 'Ortodoncia',
          startDate: '15/04/2025',
          status: 'in_progress',
          progress: 60,
          dentist: 'Dr. García',
          sessions: 10,
          completedSessions: 6,
          notes: 'Progreso adecuado del tratamiento'
        },
        {
          id: '2', 
          name: 'Limpieza Dental', 
          startDate: '10/05/2025', 
          status: 'completed', 
          progress: 100,
          dentist: 'Dra. Rodríguez',
          sessions: 1,
          completedSessions: 1,
          notes: 'Completado sin incidencias'
        }
      ];
      
      const documentos: DocumentoCliente[] = [
        {
          id: '1',
          name: 'Radiografía panorámica',
          type: 'x-ray',
          date: '15/01/2025',
          size: '2.4 MB',
          url: '/uploads/xrays/123.jpg'
        },
        {
          id: '2',
          name: 'Consentimiento ortodoncia',
          type: 'document',
          date: '15/04/2025',
          size: '540 KB',
          url: '/uploads/documents/456.pdf'
        }
      ];
      
      const pagos: PagoCliente[] = [
        {
          id: '1',
          date: '15/04/2025',
          amount: 600,
          concept: 'Primera sesión ortodoncia',
          status: 'paid',
          method: 'Tarjeta de crédito'
        },
        {
          id: '2',
          date: '10/05/2025',
          amount: 80,
          concept: 'Limpieza dental',
          status: 'paid',
          method: 'Efectivo'
        }
      ];

      return {
        cliente,
        citas,
        tratamientos,
        documentos,
        pagos,
        historialMedico: cliente.medical
      };
    } catch (error) {
      console.error('Error en obtenerPerfilCompleto:', error);
      throw error;
    }
  },

  // Actualizar cliente
  actualizarCliente: async (id: string, datos: ActualizarClienteDTO, config?: AxiosRequestConfig) => {
    // Enviamos los datos directamente al backend sin transformación
    const response = await api.patch<{ status: string; data: ClienteAPI }>(`/clientes/${id}`, datos, config);
    
    // Convertimos la respuesta al formato UI
    return adaptClienteToUI(response.data.data);
  },

  registrarCliente: async (data: RegistroClienteDTO, config?: AxiosRequestConfig) => {
    const response = await api.post<Cliente>('/clientes', data, config);
    return response.data;
  },

  // Eliminar cliente
  eliminarCliente: async (id: string, config?: AxiosRequestConfig) => {
    const response = await api.delete<{ status: string; message: string }>(`/clientes/${id}`, config);
    return response.data.message;
  }
};
