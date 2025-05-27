import { api } from './api';

export interface Notification {
  id: number;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'info' | 'alerta' | 'recordatorio' | 'error';
  entidadTipo?: string;
  entidadId?: number;
  accion?: string;
}

interface NotificationResponse {
  status: string;
  results: number;
  total: number;
  pagina: number;
  paginasTotales: number;
  data: Notification[];
}

const notificationService = {
  // Obtener notificaciones
  getNotifications: async (page = 0, limit = 10, leidas?: boolean): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    params.append('pagina', page.toString());
    params.append('limite', limit.toString());
    if (leidas !== undefined) {
      params.append('leidas', leidas.toString());
    }
    
    const response = await api.get<NotificationResponse>(`/notificaciones?${params.toString()}`);
    return response.data;
  },

  // Obtener número de notificaciones no leídas
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ status: string; data: { total: number } }>('/notificaciones/no-leidas');
    return response.data.data.total;
  },

  // Marcar una notificación como leída
  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notificaciones/${id}/marcar-leida`);
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notificaciones/marcar-todas-leidas');
  },

  // Eliminar una notificación
  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notificaciones/${id}`);
  }
};

export { notificationService }; 