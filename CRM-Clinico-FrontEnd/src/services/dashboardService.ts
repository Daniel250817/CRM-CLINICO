import { api } from './api';
import type { AxiosResponse } from 'axios';

// Tipos para las respuestas del backend
export interface DashboardStats {
  resumen: {
    totalClientes: number;
    totalCitas: number;
    totalDentistas: number;
    totalServicios: number;
    citasPendientes: number;
    citasConfirmadas: number;
    citasHoy: number;
    ingresosTotales: number;
  };
  distribucionCitas: Array<{
    estado: string;
    total: number;
  }>;
  citasPorDia: Array<{
    dia: number;
    total: number;
  }>;
  serviciosMasSolicitados: Array<{
    nombre: string;
    total: number;
  }>;
  dentistasMasActivos: Array<{
    nombre: string;
    total_citas: number;
  }>;
  nuevosClientesPorMes: Array<{
    año: number;
    mes: number;
    total: number;
  }>;
  tasaConversionPorMes: Array<{
    año: number;
    mes: number;
    completadas: number;
    total: number;
    tasa_conversion: number;
  }>;
  pacientesRecurrentes: Array<{
    nombre: string;
    total_visitas: number;
    ultima_visita: string;
  }>;
}

export interface DashboardResponse {
  estadisticas: DashboardStats;
}

// Servicio para el dashboard
const dashboardService = {
  // Obtener estadísticas generales del dashboard
  getEstadisticasGenerales: async (): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/dashboard/estadisticas');
    return response.data;
  },

  // Obtener estadísticas de un dentista específico
  getEstadisticasDentista: async (dentistaId: number): Promise<any> => {
    try {
      const response = await api.get<{estadisticas: any}>(`/dashboard/dentista/${dentistaId}`);
      return response.data.estadisticas;
    } catch (error) {
      console.error(`Error al obtener estadísticas del dentista ${dentistaId}:`, error);
      throw error;
    }
  }
};

export { dashboardService };
