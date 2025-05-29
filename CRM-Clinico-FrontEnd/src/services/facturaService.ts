import { api } from './api';

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  cantidad: number;
}

export interface Factura {
  id?: number;
  numeroFactura?: string;
  citaId: number;
  clienteId: number;
  dentistaId: number;
  servicios: Servicio[];
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'cancelada' | 'vencida';
  metodoPago?: 'efectivo' | 'tarjeta' | 'paypal' | 'transferencia';
  transaccionId?: string;
  paypalOrderId?: string;
  fechaVencimiento: string;
  fechaPago?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relaciones
  cita?: any;
  cliente?: any;
  dentista?: any;
}

export interface FacturaCreateData {
  citaId: number;
  clienteId: number;
  dentistaId: number;
  servicios: Servicio[];
  descuento?: number;
  porcentajeDescuento?: number; // Nuevo campo para porcentaje
  fechaVencimiento: string;
  notas?: string;
}

export interface PaymentData {
  paypalOrderId: string;
  transaccionId: string;
}

export interface FacturaEstadistica {
  estado: string;
  cantidad: number;
  total: number;
}

export interface EstadisticaFacturacion {
  totalFacturado: number;
  totalPendiente: number;
  totalPagado: number;
  totalCancelado: number;
  facturasPorMes: Array<{
    mes: string;
    total: number;
    cantidad: number;
  }>;
  facturasPorEstado: FacturaEstadistica[];
  promedioPorFactura: number;
  crecimientoMensual: number;
}

export interface FacturasResponse {
  status: string;
  data: {
    facturas: Factura[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

class FacturaService {
  private apiPath = '/facturas';
  // Obtener todas las facturas con filtros opcionales
  async obtenerFacturas(filtros?: {
    estado?: string;
    clienteId?: number;
    dentistaId?: number;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }): Promise<FacturasResponse> {
    try {
      const params = new URLSearchParams();
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get<FacturasResponse>(`${this.apiPath}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  }
  // Obtener factura por ID
  async obtenerFacturaPorId(id: number) {
    try {
      const response = await api.get(`${this.apiPath}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura:', error);
      throw error;
    }
  }

  // Crear nueva factura
  async crearFactura(facturaData: FacturaCreateData) {
    try {
      const response = await api.post(this.apiPath, facturaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura:', error);
      throw error;
    }
  }

  // Actualizar factura
  async actualizarFactura(id: number, facturaData: Partial<FacturaCreateData>) {
    try {
      const response = await api.put(`${this.apiPath}/${id}`, facturaData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  }

  // Eliminar factura
  async eliminarFactura(id: number) {
    try {
      await api.delete(`${this.apiPath}/${id}`);
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      throw error;
    }
  }
  // Crear orden de PayPal
  async crearOrdenPayPal(facturaId: number) {
    try {
      const response = await api.post(`${this.apiPath}/${facturaId}/paypal/create-order`);
      return response.data;
    } catch (error) {
      console.error('Error al crear orden PayPal:', error);
      throw error;
    }
  }

  // Capturar pago de PayPal
  async capturarPagoPayPal(facturaId: number, paymentData: PaymentData) {
    try {
      const response = await api.post(`${this.apiPath}/${facturaId}/paypal/capture`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error al capturar pago PayPal:', error);
      throw error;
    }
  }

  // Marcar factura como pagada (para otros métodos de pago)
  async marcarComoPagada(facturaId: number, metodoPago: 'efectivo' | 'tarjeta' | 'transferencia', transaccionId?: string) {
    try {
      const response = await api.post(`${this.apiPath}/${facturaId}/mark-paid`, {
        metodoPago,
        transaccionId
      });
      return response.data;
    } catch (error) {
      console.error('Error al marcar factura como pagada:', error);
      throw error;
    }
  }

  // Cancelar factura
  async cancelarFactura(facturaId: number, motivo?: string) {
    try {
      const response = await api.post(`${this.apiPath}/${facturaId}/cancel`, { motivo });
      return response.data;
    } catch (error) {
      console.error('Error al cancelar factura:', error);
      throw error;
    }
  }  // Obtener estadísticas de facturación
  async obtenerEstadisticas(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    dentistaId?: number;
  }): Promise<{ data: EstadisticaFacturacion }> {
    try {
      const params = new URLSearchParams();
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      interface EstadisticaBackend {
        estado: string;
        cantidad: string;
        total: string;
      }
      
      interface BackendResponse {
        status: string;
        data: {
          estadisticas: EstadisticaBackend[];
          resumen: {
            totalFacturas: number;
            totalIngresos: number;
          };
        };
      }
      
      const response = await api.get<BackendResponse>(`${this.apiPath}/estadisticas?${params.toString()}`);
      
      // Transformar la respuesta del backend al formato esperado por el frontend
      if (response.data && response.data.status === 'success') {
        const backendData = response.data.data;
        const estadisticas = backendData.estadisticas || [];
        
        // Inicializamos valores por defecto
        const result: EstadisticaFacturacion = {
          totalFacturado: 0,
          totalPendiente: 0,
          totalPagado: 0,
          totalCancelado: 0,
          facturasPorMes: [],
          facturasPorEstado: estadisticas.map((item: EstadisticaBackend) => ({
            estado: item.estado || 'desconocido',
            cantidad: parseInt(item.cantidad) || 0,
            total: parseFloat(item.total) || 0
          })),
          promedioPorFactura: 0,
          crecimientoMensual: 0 // Valor por defecto
        };
        
        // Calcular totales basados en estadísticas por estado
        estadisticas.forEach((item: EstadisticaBackend) => {
          const total = parseFloat(item.total) || 0;
          result.totalFacturado += total;
          
          switch(item.estado) {
            case 'pendiente':
              result.totalPendiente = total;
              break;
            case 'pagada':
              result.totalPagado = total;
              break;
            case 'cancelada':
              result.totalCancelado = total;
              break;
          }
        });
        
        // Calcular promedio por factura
        const totalFacturas = backendData.resumen?.totalFacturas || 0;
        if (totalFacturas > 0) {
          result.promedioPorFactura = result.totalFacturado / totalFacturas;
        }
        
        // Generar datos ficticios para los últimos 6 meses (hasta implementar en el backend)
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
        result.facturasPorMes = meses.map((mes) => ({
          mes,
          total: Math.round((result.totalFacturado / 6) * (0.7 + Math.random() * 0.6)),
          cantidad: Math.round((totalFacturas / 6) * (0.7 + Math.random() * 0.6))
        }));
        
        // Estimar crecimiento mensual
        if (result.facturasPorMes.length >= 2) {
          const lastMonth = result.facturasPorMes[result.facturasPorMes.length - 1].total;
          const prevMonth = result.facturasPorMes[result.facturasPorMes.length - 2].total;
          if (prevMonth > 0) {
            result.crecimientoMensual = ((lastMonth - prevMonth) / prevMonth) * 100;
          }
        }
        
        return { data: result };
      }
      
      // Si no hay datos o hay un error, devolver estructura vacía
      return { 
        data: {
          totalFacturado: 0,
          totalPendiente: 0,
          totalPagado: 0,
          totalCancelado: 0,
          facturasPorMes: [],
          facturasPorEstado: [],
          promedioPorFactura: 0,
          crecimientoMensual: 0
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Si hay un error, devolver estructura vacía en lugar de lanzar el error
      return { 
        data: {
          totalFacturado: 0,
          totalPendiente: 0,
          totalPagado: 0,
          totalCancelado: 0,
          facturasPorMes: [],
          facturasPorEstado: [],
          promedioPorFactura: 0,
          crecimientoMensual: 0
        }
      };
    }
  }

  // Generar PDF de factura
  async generarPDF(facturaId: number) {
    try {
      const response = await api.get<Blob>(`${this.apiPath}/${facturaId}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar el PDF
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-${facturaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }

  // Enviar factura por email
  async enviarPorEmail(facturaId: number, email: string) {
    try {
      const response = await api.post(`${this.apiPath}/${facturaId}/send-email`, { email });
      return response.data;
    } catch (error) {
      console.error('Error al enviar factura por email:', error);
      throw error;
    }
  }
}

export default new FacturaService();
