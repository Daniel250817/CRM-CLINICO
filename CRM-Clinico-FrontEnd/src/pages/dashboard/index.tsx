import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  LinearProgress,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Today as TodayIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { dashboardService, type DashboardStats, type DashboardResponse } from '../../services/dashboardService';
import { citaService, type Cita } from '../../services/citaService';
import { tareaService, type Tarea, type ResumenTareas } from '../../services/tareaService';
import { useNotification } from '../../contexts/NotificationContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Valores por defecto para cuando no hay datos
const defaultStats: DashboardStats = {
  resumen: {
    totalClientes: 0,
    totalCitas: 0,
    totalDentistas: 0,
    totalServicios: 0,
    citasPendientes: 0,
    citasConfirmadas: 0,
    citasHoy: 0,
    ingresosTotales: 0
  },
  distribucionCitas: [],
  citasPorDia: [],
  serviciosMasSolicitados: [],
  dentistasMasActivos: [],
  nuevosClientesPorMes: [],
  tasaConversionPorMes: [],
  pacientesRecurrentes: []
};

const Dashboard = () => {
  const { addNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [appointments, setAppointments] = useState<Cita[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [tasksResumen, setTasksResumen] = useState<ResumenTareas>({ 
    pendiente: 0,
    'en progreso': 0,
    completada: 0,
    cancelada: 0,
    vencidas: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Función para obtener los días de la semana a partir del número (1-7)
  const getDayLabel = (day: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[day - 1] || '';
  };

  // Función para obtener el nombre del mes a partir del número (1-12)
  const getMonthLabel = (month: number) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[month - 1] || '';
  };

  // Cargar datos del dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.getEstadisticasGenerales();
      setStats(response.estadisticas || defaultStats);
      setError(null);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setStats(defaultStats);
      throw err;
    }
  };

  // Cargar tareas pendientes
  const fetchTasks = async () => {
    try {
      const [tareasResponse, resumenResponse] = await Promise.all([
        tareaService.obtenerTareas({ 
          pagina: 1, 
          porPagina: 5,
          estado: 'pendiente' 
        }),
        tareaService.getResumenTareas()
      ]);
      
      setTasks(tareasResponse?.data || []);
      setTasksResumen(resumenResponse);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setTasks([]);
      setTasksResumen({ 
        pendiente: 0,
        'en progreso': 0,
        completada: 0,
        cancelada: 0,
        vencidas: 0
      });
      throw err;
    }
  };

  // Cargar citas del día
  const cargarCitasHoy = async () => {
    try {
      setLoadingCitas(true);
      // Obtener la fecha de hoy en formato ISO
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      // Obtener todas las citas y filtrar las de hoy
      const todasLasCitas = await citaService.obtenerCitas();
      const citasHoy = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita >= hoy && fechaCita < manana;
      });
      
      setCitas(citasHoy);
      setErrorCitas(null);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
      setErrorCitas('No se pudieron cargar las citas del día');
    } finally {
      setLoadingCitas(false);
    }
  };

  // Cargar próximas citas
  const cargarProximasCitas = async () => {
    try {
      setLoadingCitas(true);
      const hoy = new Date();
      const proximoMes = new Date(hoy);
      proximoMes.setMonth(hoy.getMonth() + 1);
      
      const todasLasCitas = await citaService.obtenerCitas();
      const citasProximas = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita > hoy && fechaCita <= proximoMes && cita.estado !== 'cancelada';
      }).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
      
      setAppointments(citasProximas);
      setErrorCitas(null);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
      setErrorCitas('No se pudieron cargar las citas');
    } finally {
      setLoadingCitas(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchDashboardData(),
          cargarCitasHoy(),
          cargarProximasCitas(),
          fetchTasks()
        ]);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Preparar datos para los gráficos basados en datos de la API
  const prepareChartData = () => {
    // Datos para el gráfico de líneas (pacientes nuevos por mes)
    const lineChartData = {
      labels: stats?.nuevosClientesPorMes?.map(item => `${getMonthLabel(item.mes)} ${item.año}`) || [],
      datasets: [
        {
          label: 'Nuevos Pacientes',
          data: stats?.nuevosClientesPorMes?.map(item => item.total) || [],
          fill: false,
          backgroundColor: '#1E60FA',
          borderColor: '#1E60FA',
          tension: 0.3
        }
      ]
    };
    
    // Datos para el gráfico de barras (citas por día)
    const barChartData = {
      labels: stats?.citasPorDia?.map(item => getDayLabel(item.dia)) || [],
      datasets: [
        {
          label: 'Citas',
          data: stats?.citasPorDia?.map(item => item.total) || [],
          backgroundColor: '#1E60FA'
        }
      ]
    };
    
    // Datos para el gráfico de donut (distribución de citas)
    const doughnutData = {
      labels: stats?.distribucionCitas?.map(item => 
        item.estado.charAt(0).toUpperCase() + item.estado.slice(1)
      ) || [],
      datasets: [
        {
          data: stats?.distribucionCitas?.map(item => item.total) || [],
          backgroundColor: [
            '#2ED47A', // completada
            '#FFB800', // pendiente
            '#F03D3E', // cancelada
            '#1E60FA'  // confirmada
          ],
          borderColor: '#FFFFFF',
          borderWidth: 2
        }
      ]
    };
    
    return {
      lineChartData,
      barChartData,
      doughnutData
    };
  };
  
  const chartData = prepareChartData();
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  
  // Renderizar citas
  const renderCitas = () => {
    if (loadingCitas) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (errorCitas) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorCitas}
        </Alert>
      );
    }

    if (citas.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No hay citas programadas para hoy
        </Typography>
      );
    }

    return citas.map((cita) => (
      <Card key={cita.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" component="div">
                {cita.servicio.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cita.dentista.usuario.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(cita.fechaHora).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            <Chip
              label={traducirEstado(cita.estado)}
              color={getChipColor(cita.estado)}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    ));
  };

  const traducirEstado = (estado: string) => {
    const traducciones: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'completada': 'Completada',
      'cancelada': 'Cancelada',
      'no asistió': 'No asistió'
    };
    return traducciones[estado] || estado;
  };

  const getChipColor = (estado: string): 'success' | 'primary' | 'error' | 'warning' | 'default' => {
    switch (estado) {
      case 'completada':
        return 'success';
      case 'confirmada':
        return 'primary';
      case 'cancelada':
        return 'error';
      case 'no asistió':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Si está cargando, mostrar indicador de carga
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <TodayIcon />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Citas Hoy
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.resumen.citasHoy}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
              <AttachMoneyIcon />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Ingresos Totales
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ${stats.resumen.ingresosTotales.toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
              <PeopleIcon />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Pacientes
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.resumen.totalClientes}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
              <AssignmentIcon />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Tareas Pendientes
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {tasksResumen.pendiente}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 3 }}>
        {/* Left Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardHeader
              title="Nuevos Pacientes por Mes"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {(stats?.nuevosClientesPorMes?.length ?? 0) > 0 ? (
                <Line options={chartOptions} data={chartData.lineChartData} height={100} />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datos disponibles para mostrar
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Paper>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ px: 2, pt: 2 }}
            >
              <Tab label="Citas de Hoy" />
              <Tab label="Próximas Citas" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingCitas ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : errorCitas ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="error">{errorCitas}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : citas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No hay citas programadas para hoy
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      citas.map((cita) => (
                        <TableRow
                          key={cita.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1">
                                {cita.dentista.usuario.nombre}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(cita.fechaHora).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>{cita.servicio.nombre}</TableCell>
                          <TableCell>
                            <Chip 
                              label={traducirEstado(cita.estado)}
                              color={getChipColor(cita.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined">Ver</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {loadingCitas ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : errorCitas ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorCitas}
                </Alert>
              ) : appointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No hay próximas citas para mostrar
                </Typography>
              ) : (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Hora</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Dentista</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.map((cita) => (
                        <TableRow
                          key={cita.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1">
                                {cita.cliente?.usuario.nombre}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(cita.fechaHora).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            {new Date(cita.fechaHora).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>{cita.servicio.nombre}</TableCell>
                          <TableCell>{cita.dentista.usuario.nombre}</TableCell>
                          <TableCell>
                            <Chip 
                              label={traducirEstado(cita.estado)}
                              color={getChipColor(cita.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined">Ver</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Card>
              <CardHeader title="Citas por Día" />
              <Divider />
              <CardContent>
                {(stats?.citasPorDia?.length ?? 0) > 0 ? (
                  <Bar options={chartOptions} data={chartData.barChartData} height={150} />
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay datos disponibles para mostrar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Estado de Citas" />
              <Divider />
              <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                {(stats?.distribucionCitas?.length ?? 0) > 0 ? (
                  <Box sx={{ height: 200, width: 200 }}>
                    <Doughnut data={chartData.doughnutData} />
                  </Box>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay datos disponibles para mostrar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardHeader 
              title="Tareas Pendientes" 
              action={
                <IconButton aria-label="refresh">
                  <RefreshIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ px: 0, pb: 0 }}>
              {(tasks?.length ?? 0) > 0 ? (
                <List>
                  {tasks.map((task) => (
                    <Box key={task.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end">
                            <CheckCircleOutlineIcon />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: task.prioridad === 'alta' ? 'error.light' : 'warning.light' }}>
                            {task.prioridad === 'alta' ? '!' : '•'}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <Typography variant="body1">
                            {task.titulo}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <AccessTimeIcon 
                              fontSize="small" 
                              sx={{ mr: 0.5, fontSize: 16 }} 
                              color="action" 
                            />
                            <Typography variant="body2" color="text.secondary" component="span">
                              {new Date(task.fechaLimite).toLocaleDateString('es-ES')}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                      <Divider component="li" />
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay tareas pendientes
                  </Typography>
                </Box>
              )}
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  color="primary" 
                  variant="outlined"
                  onClick={() => navigate('/tasks')}
                >
                  Ver Todas las Tareas
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="Próximas Citas" 
              subheader="Hoy"
            />
            <Divider />
            {(appointments?.length ?? 0) > 0 ? (
              <List>
                {appointments.slice(0, 3).map((appointment, index) => (
                  <Box key={appointment.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <CalendarTodayIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Typography variant="body1">
                          {appointment.cliente?.usuario.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} color="action" />
                          <Typography variant="body2" color="text.secondary" component="span">
                            {new Date(appointment.fechaHora).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })} - {appointment.servicio?.nombre}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)} 
                        size="small"
                        color={
                          appointment.estado === 'confirmada' ? 'success' : 
                          appointment.estado === 'completada' ? 'primary' : 
                          appointment.estado === 'pendiente' ? 'warning' : 'error'
                        }
                      />
                    </ListItem>
                    {index < appointments.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay citas programadas para hoy
                </Typography>
              </Box>
            )}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Button color="primary" variant="outlined" onClick={() => navigate('/appointments/calendar')}>
                Ver Todas las Citas
              </Button>
            </Box>
          </Card>

          <Card>
            <CardHeader 
              title="Objetivo Mensual" 
              subheader={`${new Date().toLocaleString('es-ES', { month: 'long' })} ${new Date().getFullYear()}`}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progreso
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {Math.round((stats.distribucionCitas.find(c => c.estado === 'completada')?.total || 0) / (stats.resumen.totalCitas || 1) * 100)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.round((stats.distribucionCitas.find(c => c.estado === 'completada')?.total || 0) / (stats.resumen.totalCitas || 1) * 100)} 
                color="success"
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" align="center">
                    {stats?.resumen?.totalCitas ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Citas
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" align="center">
                    {(stats?.nuevosClientesPorMes?.length ?? 0) > 0 ? 
                      stats.nuevosClientesPorMes[stats.nuevosClientesPorMes.length - 1].total : 
                      0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Nuevos Usuarios
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" align="center">
                    ${((stats?.resumen?.ingresosTotales ?? 0) / 1000).toFixed(1)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Ingresos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;