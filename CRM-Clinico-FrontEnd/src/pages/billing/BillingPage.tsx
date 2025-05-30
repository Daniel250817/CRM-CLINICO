import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Schedule as PendingIcon,
  CheckCircle as PaidIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

import InvoiceList from '../../components/billing/InvoiceList';
import facturaService from '../../services/facturaService';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Filler,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface EstadisticasFacturacion {
  totalFacturado: number;
  totalPendiente: number;
  totalPagado: number;
  totalCancelado: number;
  facturasPorMes: { mes: string; total: number; cantidad: number }[];
  facturasPorEstado: { estado: string; cantidad: number; total: number }[];
  promedioPorFactura: number;
  crecimientoMensual: number;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon 
                sx={{ 
                  color: trend >= 0 ? 'success.main' : 'error.main',
                  fontSize: 16,
                  mr: 0.5
                }} 
              />
              <Typography 
                variant="body2" 
                color={trend >= 0 ? 'success.main' : 'error.main'}
              >
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color: color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const BillingPage: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasFacturacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await facturaService.obtenerEstadisticas();
      setEstadisticas(response.data);
      
      // Log para verificar los datos recibidos del backend
      console.log('Datos de facturas recibidos:', response.data);
      console.log('Facturas por mes:', response.data.facturasPorMes);
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
      // Mostrar información más detallada del error para depuración
      if (err.response) {
        console.error('Error de respuesta:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('No se recibió respuesta del servidor');
      } else {
        console.error('Error de configuración de la petición:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  // Función para formatear las etiquetas de meses
  const formatearEtiquetasMeses = (meses: string[]) => {
    // Si no hay datos, mostrar los últimos 6 meses desde la fecha actual
    if (meses.length === 0) {
      const today = new Date();
      return Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(today.getMonth() - 5 + i);
        return d.toLocaleString('es', { month: 'long' });
      });
    }
    return meses;
  };
  // Datos para gráfico de barras (ingresos mensuales)
  const ingresosMensualesData = {
    labels: formatearEtiquetasMeses(estadisticas?.facturasPorMes?.map(item => item.mes) || []),
    datasets: [
      {
        label: 'Ingresos ($)',
        data: estadisticas?.facturasPorMes?.map(item => item.total) || Array(6).fill(0),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Registro para monitorear si hay datos para los gráficos
  if (!estadisticas?.facturasPorMes?.length) {
    console.log('No hay datos de facturas por mes disponibles');
  } else {
    console.log('Datos para gráficos:', estadisticas.facturasPorMes.length, 'meses encontrados');
  }

  // Datos para gráfico de línea (cantidad de facturas)
  const facturasMensualesData = {
    labels: formatearEtiquetasMeses(estadisticas?.facturasPorMes?.map(item => item.mes) || []),
    datasets: [
      {
        label: 'Cantidad de Facturas',
        data: estadisticas?.facturasPorMes?.map(item => item.cantidad) || Array(6).fill(0),
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Datos para gráfico de dona (distribución por estado)
  const facturasPorEstadoData = {
    labels: estadisticas?.facturasPorEstado.map(item => 
      item.estado.charAt(0).toUpperCase() + item.estado.slice(1)
    ) || [],
    datasets: [
      {
        data: estadisticas?.facturasPorEstado.map(item => item.cantidad) || [],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',   // Pendiente - Amarillo
          'rgba(76, 175, 80, 0.8)',   // Pagada - Verde
          'rgba(244, 67, 54, 0.8)',   // Cancelada - Rojo
          'rgba(156, 39, 176, 0.8)'   // Vencida - Púrpura
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(156, 39, 176, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  };

  // Para mostrar mensaje de carga en los gráficos
  const renderChartOrLoading = (chart: React.ReactNode) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="250px">
          <Typography variant="subtitle1" color="text.secondary">Cargando datos...</Typography>
        </Box>
      );
    }
    
    if (!estadisticas?.facturasPorMes?.length) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="250px">
          <Typography variant="subtitle1" color="text.secondary">No hay datos disponibles</Typography>
        </Box>
      );
    }
    
    return chart;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando estadísticas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Facturación y Pagos
        </Typography>
        <Tooltip title="Actualizar estadísticas">
          <IconButton onClick={cargarEstadisticas} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>      {/* Tarjetas de estadísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard
          title="Total Facturado"
          value={`$${estadisticas?.totalFacturado?.toFixed(2) || '0.00'}`}
          icon={<MoneyIcon sx={{ fontSize: 40 }} />}
          color="primary.main"
          trend={estadisticas?.crecimientoMensual}
        />
        <StatCard
          title="Facturas Pendientes"
          value={`$${estadisticas?.totalPendiente?.toFixed(2) || '0.00'}`}
          icon={<PendingIcon sx={{ fontSize: 40 }} />}
          color="warning.main"
        />
        <StatCard
          title="Facturas Pagadas"
          value={`$${estadisticas?.totalPagado?.toFixed(2) || '0.00'}`}
          icon={<PaidIcon sx={{ fontSize: 40 }} />}
          color="success.main"
        />
        <StatCard
          title="Promedio por Factura"
          value={`$${estadisticas?.promedioPorFactura?.toFixed(2) || '0.00'}`}
          icon={<ReceiptIcon sx={{ fontSize: 40 }} />}
          color="info.main"
        />
      </Box>      {/* Gráficos */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Ingresos Mensuales */}
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Ingresos Mensuales
          </Typography>
          <Box height="90%">
            {renderChartOrLoading(
              <Bar data={ingresosMensualesData} options={chartOptions} />
            )}
          </Box>
        </Paper>

        {/* Cantidad de Facturas por Mes */}
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Facturas por Mes
          </Typography>
          <Box height="90%">
            {renderChartOrLoading(
              <Line data={facturasMensualesData} options={chartOptions} />
            )}
          </Box>
        </Paper>

        {/* Distribución por Estado */}
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Distribución por Estado
          </Typography>          <Box height="90%">
            {renderChartOrLoading(
              <Doughnut 
                data={facturasPorEstadoData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'bottom' as const,
                    }
                  }
                }} 
              />
            )}
          </Box>
        </Paper>

        {/* Resumen adicional */}
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Resumen de Estados
          </Typography>
          <Box mt={2}>
            {estadisticas?.facturasPorEstado.map((item) => (
              <Box 
                key={item.estado}
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                mb={2}
                p={2}
                bgcolor="grey.50"
                borderRadius={1}
              >
                <Box display="flex" alignItems="center">
                  {item.estado === 'pendiente' && <PendingIcon color="warning" sx={{ mr: 1 }} />}
                  {item.estado === 'pagada' && <PaidIcon color="success" sx={{ mr: 1 }} />}
                  {item.estado === 'cancelada' && <CancelIcon color="error" sx={{ mr: 1 }} />}
                  {item.estado === 'vencida' && <CancelIcon color="error" sx={{ mr: 1 }} />}
                  <Typography>
                    {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="textSecondary">
                    {item.cantidad} facturas
                  </Typography>
                  <Typography variant="h6">
                    ${item.total?.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Lista de facturas */}
      <Paper sx={{ p: 2 }}>
        <InvoiceList />
      </Paper>
    </Box>
  );
};

export default BillingPage;
