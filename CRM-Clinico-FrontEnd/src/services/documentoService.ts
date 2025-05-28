import { api } from './api';
import type { AxiosRequestConfig } from 'axios';
import { clienteService } from './clienteService';
import type { Cliente } from './clienteService';
import axios from 'axios';

export interface DocumentoAPI {
  id: string;
  clienteId: string;
  nombre: string;
  tipo: string;
  fechaCreacion: string;
  tamano: number;
  ruta: string;
}

export interface TratamientoAPI {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'activo' | 'completado' | 'cancelado';
  progreso: number;
  dentistaId: string;
  dentistaNombre?: string;
  sesionesTotales: number;
  sesionesCompletadas: number;
  notas?: string;
}

export const documentoService = {
  // Obtener documentos de un cliente
  obtenerDocumentosCliente: async (clienteId: string, config?: AxiosRequestConfig) => {
    try {
      // Esta ruta es hipotética y debe existir en el backend
      const response = await api.get<{ status: string; data: DocumentoAPI[] }>(
        `/clientes/${clienteId}/documentos`,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener documentos del cliente:', error);
      // Si la API no existe aún, devolvemos un array vacío
      return [];
    }
  },

  // Subir un documento
  subirDocumento: async (
    clienteId: string,
    file: File,
    tipo: string,
    nombre?: string,
    config?: AxiosRequestConfig
  ) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    if (nombre) {
      formData.append('nombre', nombre);
    }

    try {
      const response = await api.post<{ status: string; data: DocumentoAPI }>(
        `/clientes/${clienteId}/documentos`,
        formData,
        {
          ...config,
          headers: {
            ...config?.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  },

  // Eliminar un documento
  eliminarDocumento: async (documentoId: string, config?: AxiosRequestConfig) => {
    try {
      const response = await api.delete<{ status: string; message: string }>(
        `/documentos/${documentoId}`,
        config
      );
      return response.data.message;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw error;
    }
  }
};

export const tratamientoService = {
  // Obtener tratamientos de un cliente
  obtenerTratamientosCliente: async (clienteId: string, config?: AxiosRequestConfig) => {
    try {
      // Esta ruta es hipotética y debe existir en el backend
      const response = await api.get<{ status: string; data: TratamientoAPI[] }>(
        `/clientes/${clienteId}/tratamientos`,
        config
      );
      return response.data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Si el endpoint aún no está implementado, devolvemos un array vacío
        console.info('El endpoint de tratamientos aún no está implementado. Devolviendo lista vacía.');
        return [];
      }
      
      // Para otros errores, mostramos el error en consola
      console.error('Error al obtener tratamientos del cliente:', error);
      return [];
    }
  },

  // Crear un nuevo tratamiento
  crearTratamiento: async (
    clienteId: string,
    datos: {
      nombre: string;
      descripcion?: string;
      fechaInicio: string;
      dentistaId: string;
      sesionesTotales: number;
      notas?: string;
    },
    config?: AxiosRequestConfig
  ) => {
    try {
      const response = await api.post<{ status: string; data: TratamientoAPI }>(
        `/clientes/${clienteId}/tratamientos`,
        datos,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al crear tratamiento:', error);
      throw error;
    }
  },

  // Actualizar progreso de un tratamiento
  actualizarTratamiento: async (
    tratamientoId: string,
    datos: {
      progreso?: number;
      sesionesCompletadas?: number;
      estado?: 'activo' | 'completado' | 'cancelado';
      notas?: string;
      fechaFin?: string;
    },
    config?: AxiosRequestConfig
  ) => {
    try {
      const response = await api.patch<{ status: string; data: TratamientoAPI }>(
        `/tratamientos/${tratamientoId}`,
        datos,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar tratamiento:', error);
      throw error;
    }
  }
};

// Función para combinar todos los datos de un perfil de cliente
export async function obtenerPerfilCompletoCliente(clienteId: string): Promise<{
  cliente: Cliente;
  tratamientos: TratamientoAPI[];
  documentos: DocumentoAPI[];
  historialMedico?: any;
}> {
  try {
    const [cliente, documentos, tratamientos] = await Promise.all([
      clienteService.obtenerPerfilCliente(clienteId),
      documentoService.obtenerDocumentosCliente(clienteId).catch(error => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.info('El endpoint de documentos aún no está implementado. Devolviendo lista vacía.');
          return [];
        }
        throw error;
      }),
      tratamientoService.obtenerTratamientosCliente(clienteId).catch(error => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.info('El endpoint de tratamientos aún no está implementado. Devolviendo lista vacía.');
          return [];
        }
        throw error;
      })
    ]);

  return {
    cliente,
    tratamientos,
    documentos,
    historialMedico: cliente.medical || {}
  };
  } catch (error) {
    console.error('Error al obtener el perfil completo del cliente:', error);
    throw new Error('No se pudo obtener el perfil completo del cliente');
  }
}
