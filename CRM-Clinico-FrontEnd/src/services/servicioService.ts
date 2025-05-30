import { api } from './api';
import type { AxiosRequestConfig } from 'axios';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
  imagen?: string;
  categoria?: string;
  codigoServicio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  imagen?: string;
  categoria?: string;
  codigoServicio?: string;
  activo?: boolean;
}

// Helper para construir URLs de imágenes
export const construirUrlImagen = (rutaImagen?: string): string | undefined => {
  if (!rutaImagen) return undefined;
  
  // Si ya es una URL completa, devolverla tal como está
  if (rutaImagen.startsWith('http')) {
    return rutaImagen;
  }
  
  // Si es una ruta relativa, construir la URL completa
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${baseUrl}${rutaImagen}`;
};

const crearFormData = (datos: Partial<CrearServicioDTO>, imagen?: File | null) => {
  const formData = new FormData();
  
  // Agregar datos del servicio
  Object.entries(datos).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  // Agregar imagen si existe
  if (imagen) {
    formData.append('imagen', imagen);
  }

  return formData;
};

export const servicioService = {
  // Obtener todos los servicios
  obtenerServicios: async (params?: { activo?: boolean }, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Servicio[] }>('/servicios', {
      ...config,
      params: {
        ...config?.params,
        ...params
      }
    });
    return response.data.data;
  },

  // Obtener un servicio por ID
  obtenerServicioPorId: async (id: number, config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: Servicio }>(`/servicios/${id}`, config);
    return response.data.data;
  },

  crearServicio: async (servicio: CrearServicioDTO, imagen?: File | null, config?: AxiosRequestConfig) => {
    const formData = crearFormData(servicio, imagen);
    const response = await api.post<{ status: string; data: Servicio }>(
      '/servicios',
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
  },

  actualizarServicio: async (id: number, datos: Partial<CrearServicioDTO>, imagen?: File | null, config?: AxiosRequestConfig) => {
    // Limpiar y convertir datos
    const datosLimpios: Partial<CrearServicioDTO> = {};
    
    if (datos.nombre !== undefined) datosLimpios.nombre = datos.nombre;
    if (datos.descripcion !== undefined) datosLimpios.descripcion = datos.descripcion || '';
    if (datos.precio !== undefined) datosLimpios.precio = Number(datos.precio);
    if (datos.duracion !== undefined) datosLimpios.duracion = Number(datos.duracion);
    if (datos.categoria !== undefined) datosLimpios.categoria = datos.categoria;
    if (datos.codigoServicio !== undefined) datosLimpios.codigoServicio = datos.codigoServicio;
    if (datos.activo !== undefined) datosLimpios.activo = datos.activo;

    const formData = crearFormData(datosLimpios, imagen);
    const response = await api.patch<{ status: string; data: Servicio }>(
      `/servicios/${id}`,
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
  },

  eliminarServicio: async (id: number, config?: AxiosRequestConfig) => {
    const response = await api.delete<{ status: string; message: string }>(`/servicios/${id}`, config);
    return response.data;
  },

  obtenerCategorias: async (config?: AxiosRequestConfig) => {
    const response = await api.get<{ status: string; data: string[] }>('/servicios/categorias', config);
    return response.data.data;
  }
}; 