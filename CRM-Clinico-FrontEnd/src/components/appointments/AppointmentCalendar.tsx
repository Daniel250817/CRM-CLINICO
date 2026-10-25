import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent,
  Paper,
  Typography,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  FilterList as FilterListIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import dentistaService from '../../services/dentistaService';
import type { Dentista } from '../../services/dentistaService';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

interface RangoHorario {
  inicio: string;
  fin: string;
}

interface HorarioTrabajo {
  [dia: string]: RangoHorario[];
}

interface HorariosDentistaSeleccionado {
  nombre: string;
  horarioTrabajo: HorarioTrabajo;
}

interface DentistaConHorario extends Dentista {
  horarioTrabajo: HorarioTrabajo;
}

import { citaService, type Cita } from '../../services/citaService';
import { clienteService, type Cliente } from '../../services/clienteService';
import { useNotification } from '../../contexts/NotificationContext';
import { servicioService, type Servicio } from '../../services/servicioService';
import { exportDailyAppointmentReportToExcel } from '../../utils/citasReportExcel';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

// Tipos de datos
interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  patient: string;
  dentist: string;
  service: string;
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';
  notes?: string;
}

interface NewAppointmentFormData {
  patient: string;
  dentist: string;
  service: string;
  dateTime: dayjs.Dayjs | null;
  duration: number;
  notes: string;
  status?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';
}

interface NuevaCitaDTO {
  clienteId: number;
  dentistaId: number;
  servicioId: number;
  fechaHora: string;
  duracion: number;
  notas: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
}

const AppointmentCalendar = () => {
  const { addNotification } = useNotification();
  const { settings } = useAuth();
  const theme = useTheme();
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [openNewAppointment, setOpenNewAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [openAppointmentDetails, setOpenAppointmentDetails] = useState(false);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loadingDentistas, setLoadingDentistas] = useState(false);
  const [errorDentistas, setErrorDentistas] = useState<string | null>(null);
  const [proximasCitas, setProximasCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [patients, setPatients] = useState<Cliente[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [errorPatients, setErrorPatients] = useState<string | null>(null);
  const [newAppointmentData, setNewAppointmentData] = useState<NewAppointmentFormData>({
    patient: '',
    dentist: '',
    service: '',
    dateTime: null,
    duration: 30,
    notes: '',
    status: 'pendiente'
  });
  const [services, setServices] = useState<Servicio[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);

  // Referencia al calendario
  const calendarRef = useRef<FullCalendar>(null);

  const formatStatusLabel = (status: string | undefined | null) => {
    if (!status) return '';
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      'no asistió': 'No Asistió'
    };
    return map[status] || status;
  };

  // Scroll the calendar to a specific event by id and highlight it briefly
  const scrollToCalendarEvent = (eventId: string) => {
    try {
      const calendar = calendarRef.current;
      const api = calendar?.getApi();
      if (!api) return;

      const ev = api.getEventById(eventId);
      if (!ev) return;

      // Switch to day view and go to the event date for precise positioning
      api.changeView('timeGridDay');
      setView('timeGridDay');
      api.gotoDate(ev.start!);

      // Wait a bit for the view to render, then find the DOM element and scroll
      setTimeout(() => {
        // Try common selectors FullCalendar uses
        const selectors = [
          `[data-event-id="${eventId}"]`,
          `.fc-event[data-event-id="${eventId}"]`,
          `#${eventId}`,
          `.fc-event` // fallback
        ];

        let el: Element | null = null;
        for (const sel of selectors) {
          if (sel === '.fc-event') continue;
          el = document.querySelector(sel);
          if (el) break;
        }

        if (!el) {
          // fallback: try matching by title text (less precise)
          const all = Array.from(document.querySelectorAll('.fc-event'));
          el = all.find(node => node.textContent && node.textContent.includes(ev.title)) || null;
        }

        if (el) {
          // scroll into view within the calendar container
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

          // add a temporary highlight
          el.classList.add('fc-highlight-scroll');
          setTimeout(() => el && el.classList.remove('fc-highlight-scroll'), 1800);
        }
      }, 300);
    } catch (err) {
      console.error('Error scrolling to calendar event:', err);
    }
  };

  // Añadir un estado para el diálogo de horarios
  const [horariosDentistaSeleccionado, setHorariosDentistaSeleccionado] = useState<HorariosDentistaSeleccionado | null>(null);

  // Añadir nuevos estados para la edición y eliminación de citas
  const [openEditAppointment, setOpenEditAppointment] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Añadir nuevos estados para el diálogo de selección manual de paciente
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [tempAppointmentData, setTempAppointmentData] = useState<any>(null);
  const [openFilters, setOpenFilters] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<Array<'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió'>>([]);
  const [reportDate, setReportDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dailyReportAppointments, setDailyReportAppointments] = useState<Cita[]>([]);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [errorDailyReport, setErrorDailyReport] = useState<string | null>(null);

  // Cargar pacientes
  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        setLoadingPatients(true);
        const data = await clienteService.obtenerTodosLosClientes();
        console.log('Pacientes cargados:', data);
        setPatients(data);
        setErrorPatients(null);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
        setErrorPatients('No se pudieron cargar los pacientes');
      } finally {
        setLoadingPatients(false);
      }
    };

    cargarPacientes();
  }, []);

  // Cargar dentistas
  useEffect(() => {
    const cargarDentistas = async () => {
      try {
        setLoadingDentistas(true);
        const fecha = dayjs(currentDate).format('YYYY-MM-DD');
        const dentistasData = await dentistaService.obtenerDentistasDisponibles(fecha);
        setDentistas(dentistasData);
        setErrorDentistas(null);
      } catch (error) {
        console.error('Error al cargar dentistas:', error);
        setErrorDentistas('No se pudieron cargar los dentistas disponibles');
      } finally {
        setLoadingDentistas(false);
      }
    };

    cargarDentistas();
  }, [currentDate]);  // Cargar citas de hoy
  useEffect(() => {
    const cargarCitasDeHoy = async () => {
      try {
        setLoadingCitas(true);
        // Obtener la fecha de hoy en formato ISO (igual que en dashboard)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        // Obtener todas las citas y filtrar las de hoy (igual que en dashboard)
        const todasLasCitas = await citaService.obtenerCitas();
        const citasHoy = todasLasCitas.filter(cita => {
          const fechaCita = new Date(cita.fechaHora);
          return fechaCita >= hoy && fechaCita < manana && cita.estado !== 'cancelada';
        });
        
        // Ordenar por fecha y tomar las próximas 5
        const citasOrdenadas = citasHoy
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
          .slice(0, 5);
        
        setProximasCitas(citasOrdenadas);
        setErrorCitas(null);
      } catch (error) {
        console.error('Error al cargar citas de hoy:', error);
        setErrorCitas('No se pudieron cargar las citas de hoy');
      } finally {
        setLoadingCitas(false);
      }
    };

    cargarCitasDeHoy();
  }, []);

  // Cargar citas para el calendario
  useEffect(() => {
    const cargarCitasCalendario = async () => {
      try {
        setLoadingCitas(true);
        const response = await citaService.obtenerCitas();
        
        // Transformar las citas al formato que espera FullCalendar
        const events = response.map(cita => {
          // Preferir nombre compuesto del cliente: primero mirar `cliente.usuario`, luego `cliente.nombre`/`cliente.apellidos` si existen
          let patientName = 'Paciente';
          if (cita.cliente) {
            if ((cita.cliente as any).usuario && ((cita.cliente as any).usuario.nombre || (cita.cliente as any).usuario.apellidos)) {
              patientName = `${(cita.cliente as any).usuario.nombre || ''} ${(cita.cliente as any).usuario.apellidos || ''}`.trim();
            } else if ((cita.cliente as any).nombre || (cita.cliente as any).apellidos) {
              patientName = `${(cita.cliente as any).nombre || ''} ${(cita.cliente as any).apellidos || ''}`.trim();
            }
          }

          const dentistName = cita.dentista?.usuario?.nombre || 'Dentista';

          return {
            id: cita.id,
            title: cita.servicio.nombre,
            start: cita.fechaHora,
            end: new Date(new Date(cita.fechaHora).getTime() + cita.duracion * 60000).toISOString(),
            extendedProps: {
              status: cita.estado,
              patient: patientName,
              dentist: dentistName,
              service: cita.servicio.nombre,
              duration: cita.duracion
            },
            className: `event-${cita.estado}`
          };
        });
        
        setCalendarEvents(events);
        setErrorCitas(null);
      } catch (error) {
        console.error('Error al cargar citas:', error);
        setErrorCitas('No se pudieron cargar las citas');
      } finally {
        setLoadingCitas(false);
      }
    };

    cargarCitasCalendario();
  }, []);

  // Cargar servicios
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        setLoadingServices(true);
        const serviciosData = await servicioService.obtenerServicios({ activo: true });
        setServices(serviciosData);
        setErrorServices(null);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        setErrorServices('No se pudieron cargar los servicios');
      } finally {
        setLoadingServices(false);
      }
    };

    cargarServicios();
  }, []);

  // Evento cuando se selecciona una fecha en el calendario
  const handleDateSelect = (selectInfo: any) => {
    const selectedDate = dayjs(selectInfo.start);
    console.log('Fecha seleccionada:', {
      original: selectedDate.format('YYYY-MM-DD HH:mm:ss'),
      timezone: dayjs.tz.guess(),
      offset: selectedDate.format('Z')
    });

    setNewAppointmentData({
      ...newAppointmentData,
      dateTime: selectedDate
    });
    setOpenNewAppointment(true);
  };

  const toggleStatusFilter = (status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió') => {
    setSelectedStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(item => item !== status)
        : [...prev, status]
    );
  };

  const clearStatusFilters = () => {
    setSelectedStatusFilters([]);
  };

  const visibleCalendarEvents = selectedStatusFilters.length > 0
    ? calendarEvents.filter(event => selectedStatusFilters.includes(event.extendedProps.status))
    : calendarEvents;

  const dailyReportSummary = [
    {
      estado: 'confirmada' as const,
      etiqueta: 'Confirmadas',
      cantidad: dailyReportAppointments.filter((cita) => cita.estado === 'confirmada').length
    },
    {
      estado: 'cancelada' as const,
      etiqueta: 'Canceladas',
      cantidad: dailyReportAppointments.filter((cita) => cita.estado === 'cancelada').length
    }
  ];

  const totalDailyReportAppointments = dailyReportSummary.reduce((accumulator, item) => accumulator + item.cantidad, 0);
  const reportDateLabel = dayjs(reportDate).format('DD [de] MMMM [de] YYYY');

  // Gestionar el cambio de vista del calendario
  const handleViewChange = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    const calendar = calendarRef.current;
    if (calendar) {
      calendar.getApi().changeView(newView);
      setView(newView);
    }
  };

  // Navegar en el calendario
  const handleCalendarNavigate = (action: 'prev' | 'next' | 'today') => {
    const calendar = calendarRef.current;
    if (calendar) {
      const api = calendar.getApi();
      if (action === 'prev') {
        api.prev();
      } else if (action === 'next') {
        api.next();
      } else {
        api.today();
      }
      setCurrentDate(api.getDate());
    }
  };

  // Evento cuando se hace clic en una cita existente
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    if (!event) return;

    setSelectedAppointmentId(event.id);

    setSelectedAppointment({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      patient: event.extendedProps.patient,
      dentist: event.extendedProps.dentist,
      service: event.extendedProps.service,
      status: event.extendedProps.status,
      notes: event.extendedProps.notes
    });

    setOpenAppointmentDetails(true);
  };

  // Render para el contenido del evento (tarjeta rediseñada)
  const eventContent = (eventInfo: any) => {
    const { timeText, event } = eventInfo;
    const { extendedProps } = event;

    const status = extendedProps.status as string | undefined;
    const statusMap: Record<string, { bg: string; color: string }>= {
      pendiente: { bg: theme.palette.warning.light, color: theme.palette.warning.dark },
      confirmada: { bg: theme.palette.success.light, color: theme.palette.success.dark },
      completada: { bg: theme.palette.info.light, color: theme.palette.info.dark },
      cancelada: { bg: theme.palette.error.light, color: theme.palette.error.dark },
      'no asistió': { bg: theme.palette.grey[200], color: theme.palette.text.secondary }
    };

    const statusStyle = status ? (statusMap[status] || { bg: theme.palette.background.paper, color: theme.palette.text.primary }) : { bg: theme.palette.background.paper, color: theme.palette.text.primary };

    // Use full border to indicate status (instead of filling background)
    const borderColor = statusStyle.color || theme.palette.divider;

    return (
      <Box sx={{
        height: '100%',
        p: 0.5,
        borderRadius: 1.5,
        bgcolor: 'transparent',
        border: `2px solid ${borderColor}`,
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{timeText}</Typography>
          </Box>
          <Tooltip title={extendedProps.patient} arrow placement="top">
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{(extendedProps.patient || 'P').charAt(0)}</Avatar>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</Typography>
          {extendedProps.service && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{extendedProps.service}</Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Box component="span" sx={{ px: 0.75, py: '4px', borderRadius: 1.25, bgcolor: 'rgba(0,0,0,0.04)', color: statusStyle.color, fontSize: 11, fontWeight: 600 }}>
            {formatStatusLabel(status)}
          </Box>
        </Box>
      </Box>
    );
  };

  // Inject small highlight CSS for scroll target
  useEffect(() => {
    const styleId = 'fc-highlight-scroll-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .fc-highlight-scroll { 
        box-shadow: 0 0 0 6px rgba(30,96,250,0.12) !important; 
        transform: scale(1.02); 
        transition: box-shadow 200ms ease, transform 200ms ease; 
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Función para ver la agenda de un dentista específico
  const handleViewDentistSchedule = async (dentistaId: string) => {
    try {
      // Obtener el dentista y sus datos
      const dentista = dentistas.find(d => d.id === dentistaId) as DentistaConHorario;
      
      if (!dentista || !dentista.usuario) {
        throw new Error('No se encontró el dentista seleccionado');
      }

      // Si no hay horario de trabajo definido, usar un objeto vacío
      if (!dentista.horarioTrabajo || typeof dentista.horarioTrabajo !== 'object') {
        setHorariosDentistaSeleccionado({
          nombre: dentista.usuario.nombre,
          horarioTrabajo: {}
        });
        return;
      }

      // Usar el horario del dentista
      setHorariosDentistaSeleccionado({
        nombre: dentista.usuario.nombre,
        horarioTrabajo: dentista.horarioTrabajo
      });
    } catch (error) {
      console.error('Error al obtener horarios del dentista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      addNotification(`Error al obtener los horarios: ${errorMessage}`, 'error');
    }
  };

  const handleExportDailyReport = async () => {
    try {
      await exportDailyAppointmentReportToExcel(dailyReportAppointments, reportDate);
      addNotification('Reporte exportado exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar el reporte diario:', error);
      addNotification('No se pudo exportar el reporte diario', 'error');
    }
  };

  const cargarReporteDiario = async () => {
    try {
      setLoadingDailyReport(true);
      const inicio = dayjs(reportDate).startOf('day');
      const fin = dayjs(reportDate).endOf('day');

      const citasDelDia = await citaService.obtenerCitas({
        params: {
          desde: inicio.toISOString(),
          hasta: fin.toISOString()
        }
      });

      setDailyReportAppointments(
        citasDelDia.filter((cita) => cita.estado === 'confirmada' || cita.estado === 'cancelada')
      );
      setErrorDailyReport(null);
    } catch (error) {
      console.error('Error al cargar el reporte diario:', error);
      setErrorDailyReport('No se pudo cargar el reporte diario');
    } finally {
      setLoadingDailyReport(false);
    }
  };

  useEffect(() => {
    cargarReporteDiario();
  }, [reportDate]);

  // Guardar una nueva cita
  const handleSaveNewAppointment = async () => {
    try {
      // Validar campos requeridos
      if (!newAppointmentData.patient || !newAppointmentData.dentist || 
          !newAppointmentData.service || !newAppointmentData.dateTime) {
        addNotification('Por favor complete todos los campos requeridos', 'error');
        return;
      }

      // Validar que la fecha no sea en el pasado
      if (newAppointmentData.dateTime.isBefore(dayjs(), 'minute')) {
        addNotification('No se pueden crear citas en fechas pasadas', 'error');
        return;
      }

      // Validar duración mínima
      if (newAppointmentData.duration < 15) {
        addNotification('La duración mínima de una cita debe ser 15 minutos', 'error');
        return;
      }

      // Validar que el paciente exista en la lista de pacientes
      const pacienteSeleccionado = patients.find(p => p.id === newAppointmentData.patient);
      if (!pacienteSeleccionado) {
        addNotification('El paciente seleccionado no es válido', 'error');
        return;
      }

      // Obtener la fecha local y convertirla a UTC
      const fechaLocal = dayjs.tz(newAppointmentData.dateTime, dayjs.tz.guess());
      const fechaUTC = fechaLocal.tz('UTC');

      console.log('🕒 Proceso de conversión de hora:', {
        fechaSeleccionadaOriginal: newAppointmentData.dateTime.format('YYYY-MM-DD HH:mm:ss'),
        zonaHorariaLocal: dayjs.tz.guess(),
        offsetLocal: fechaLocal.format('Z'),
        horaLocal: fechaLocal.format('HH:mm'),
        horaUTC: fechaUTC.format('HH:mm'),
        diferenciaHoras: fechaUTC.diff(fechaLocal, 'hour')
      });

      // Crear el objeto de la cita
      const nuevaCita: NuevaCitaDTO = {
        clienteId: Number(pacienteSeleccionado.id),
        dentistaId: Number(newAppointmentData.dentist),
        servicioId: Number(newAppointmentData.service),
        fechaHora: fechaUTC.toISOString(),
        duracion: Number(newAppointmentData.duration),
        notas: (newAppointmentData.notes || '').trim(),
        estado: 'pendiente' as const
      };

      console.log('📤 Datos finales a enviar:', {
        ...nuevaCita,
        horaLocalOriginal: fechaLocal.format('HH:mm'),
        horaUTCFinal: dayjs(nuevaCita.fechaHora).format('HH:mm')
      });

      // Guardar la cita en el backend
      const citaCreada = await citaService.crearCita(nuevaCita);

      // Verificar que tenemos todos los datos necesarios
      if (!citaCreada?.cliente?.usuario?.nombre || !citaCreada?.dentista?.usuario?.nombre || !citaCreada?.servicio?.nombre) {
        throw new Error('La respuesta del servidor no incluye todos los datos necesarios');
      }

      // Actualizar el estado local
      const nuevoEvento = {
        id: citaCreada.id,
        title: `${citaCreada.servicio.nombre} - ${citaCreada.cliente.usuario.nombre}`,
        start: citaCreada.fechaHora,
        end: dayjs(citaCreada.fechaHora)
          .add(citaCreada.duracion, 'minute')
          .format('YYYY-MM-DDTHH:mm:ss'),
        extendedProps: {
          status: citaCreada.estado,
          patient: citaCreada.cliente.usuario.nombre,
          dentist: citaCreada.dentista.usuario.nombre,
          service: citaCreada.servicio.nombre
        }
      };      setCalendarEvents(prevEvents => [...prevEvents, nuevoEvento]);

      // Actualizar las citas de hoy usando la misma lógica del dashboard
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const todasLasCitas = await citaService.obtenerCitas();
      const citasHoy = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita >= hoy && fechaCita < manana && cita.estado !== 'cancelada';
      });
      
      const citasOrdenadas = citasHoy
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 5);
      
      setProximasCitas(citasOrdenadas);

      // Mostrar mensaje de éxito
      addNotification('Cita creada exitosamente', 'success');

      // Cerrar el modal y limpiar el formulario
      setOpenNewAppointment(false);
      setNewAppointmentData({
        patient: '',
        dentist: '',
        service: '',
        dateTime: null,
        duration: 30,
        notes: '',
        status: 'pendiente'
      });
    } catch (error: any) {
      console.error('❌ Error al crear la cita:', error);
      // Mostrar el mensaje de error que viene del backend
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la cita';
      addNotification(errorMessage, 'error');
    }
  };

  // Cambiar los datos de la nueva cita
  const handleNewAppointmentChange = (field: keyof NewAppointmentFormData, value: any) => {
    if (field === 'dateTime' && value) {
      // Asegurarnos de que la fecha esté en la zona horaria local
      const localDate = dayjs(value).tz(dayjs.tz.guess());
      console.log('Actualizando fecha en el formulario:', {
        fechaOriginal: value.format('YYYY-MM-DD HH:mm:ss'),
        fechaLocal: localDate.format('YYYY-MM-DD HH:mm:ss'),
        zonaHoraria: dayjs.tz.guess(),
        offset: localDate.format('Z')
      });
      setNewAppointmentData(prev => ({ ...prev, [field]: localDate }));
    } else {
      setNewAppointmentData(prev => ({ 
        ...prev, 
        [field]: value,
        ...(field === 'service' && {
          duration: services.find(s => s.id === Number(value))?.duracion || 30
        })
      }));

      // Si se cambia el estado en el formulario, no hacemos nada extra aquí; se procesará en la actualización
    }

    // Si se selecciona un dentista, cargar los horarios inmediatamente
    if (field === 'dentist' && value) {
      handleViewDentistSchedule(value);
    }
  };
  // Modificar la sección de dentistas disponibles
  const renderDentistasDisponibles = () => {
    if (loadingDentistas) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: 4,
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={32} color="primary" />
          <Typography variant="body2" color="text.secondary">
            Cargando dentistas...
          </Typography>
        </Box>
      );
    }

    if (errorDentistas) {
      return (
        <Alert 
          severity="error" 
          sx={{ 
            m: 2,
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'center'
            }
          }}
        >
          {errorDentistas}
        </Alert>
      );
    }

    if (dentistas.length === 0) {
      return (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <PersonIcon 
            sx={{ 
              fontSize: 48, 
              color: 'text.disabled' 
            }} 
          />
          <Typography variant="body1" color="text.secondary" fontWeight="500">
            No hay dentistas disponibles
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Los dentistas disponibles aparecerán aquí
          </Typography>
        </Box>
      );
    }

      return dentistas.map((dentista, index) => (
      <Paper
        key={dentista.id}
        elevation={1}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            elevation: 3,
            borderColor: 'primary.light',
            bgcolor: 'action.hover'
          },
          mb: index < dentistas.length - 1 ? 1.5 : 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 20,
            cursor: 'pointer'
          }}
          onClick={() => handleViewDentistSchedule(dentista.id)}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 45,
              height: 45,
              fontSize: '1.2rem',
              fontWeight: 600
            }}
          >
            {dentista.usuario.nombre.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
              {dentista.usuario.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              {dentista.especialidad || 'Médico dentista'}
            </Typography>
          </div>
          <IconButton
            size="small"
            sx={{ 
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.dark'
              }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      </Paper>
    ));
  };

  // Modificar el selector de pacientes en el formulario
  const renderPatientSelector = () => (
    <TextField
      select
      label="Paciente"
      fullWidth
      value={newAppointmentData.patient || ''}
      onChange={(e) => {
        const selectedId = e.target.value;
        console.log('Paciente seleccionado:', {
          id: selectedId,
          paciente: patients.find(p => p.id === selectedId)
        });
        handleNewAppointmentChange('patient', selectedId);
      }}
      error={!newAppointmentData.patient}
      helperText={!newAppointmentData.patient ? 'Por favor seleccione un paciente' : ''}
    >
      <MenuItem value="" disabled>
        <em>Seleccionar paciente</em>
      </MenuItem>
      {loadingPatients ? (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Cargando pacientes...
        </MenuItem>
      ) : errorPatients ? (
        <MenuItem disabled>
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorPatients}
          </Alert>
        </MenuItem>
      ) : patients.length === 0 ? (
        <MenuItem disabled>
          No hay pacientes registrados
        </MenuItem>
      ) : (
        patients.map((patient) => (
          <MenuItem 
            key={patient.id} 
            value={patient.id}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1">
                {`${patient.usuario?.nombre || 'Sin nombre'} ${patient.usuario?.apellidos || ''}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {patient.usuario?.email || 'Sin correo'} • {patient.usuario?.telefono || 'Sin teléfono'}
              </Typography>
            </Box>
          </MenuItem>
        ))
      )}
    </TextField>
  );

  // Modificar el selector de servicios en el formulario
  const renderServiceSelector = () => (
    <TextField
      select
      label="Servicio"
      fullWidth
      value={newAppointmentData.service}
      onChange={(e) => handleNewAppointmentChange('service', e.target.value)}
    >
      <MenuItem value="" disabled>
        Seleccionar servicio
      </MenuItem>
      {loadingServices ? (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Cargando servicios...
        </MenuItem>
      ) : errorServices ? (
        <MenuItem disabled>
          Error al cargar servicios
        </MenuItem>
      ) : services.length === 0 ? (
        <MenuItem disabled>
          No hay servicios disponibles
        </MenuItem>
      ) : (
        services.map((service) => (
          <MenuItem key={service.id} value={service.id}>
            {service.nombre} ({service.duracion} min)
          </MenuItem>
        ))
      )}
    </TextField>
  );

  // Evento cuando se mueve una cita
  const handleEventDrop = async (dropInfo: any) => {
    try {
      const { event } = dropInfo;
      const citaId = event.id;
      const nuevaFecha = event.start;
      const duracion = dayjs(event.end).diff(dayjs(event.start), 'minute');

      console.log('Moviendo cita:', {
        citaId,
        nuevaFecha: dayjs(nuevaFecha).format('YYYY-MM-DD HH:mm:ss'),
        nuevaFechaISO: nuevaFecha.toISOString(),
        duracion
      });

      // Actualizar en el backend
      await citaService.actualizarFechaHoraCita(citaId, nuevaFecha.toISOString(), duracion);      // Mostrar notificación de éxito
      addNotification('Cita actualizada exitosamente', 'success');

      // Actualizar la lista de citas de hoy usando la misma lógica del dashboard
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const todasLasCitas = await citaService.obtenerCitas();
      const citasHoy = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita >= hoy && fechaCita < manana && cita.estado !== 'cancelada';
      });
      
      const citasOrdenadas = citasHoy
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 5);
      
      setProximasCitas(citasOrdenadas);
      
      // Refrescar los eventos del calendario
      await actualizarEventosCalendario();
    } catch (error: any) {
      console.error('Error al mover cita:', error);
      
      // Revertir el cambio en el calendario
      dropInfo.revert();
      
      // Mostrar mensaje de error detallado
      let errorMessage = 'Error al actualizar la cita';
      
      if (error.response) {
        console.log('Error response:', error.response);
        // Si es un error del servidor con datos
        if (error.response.data && error.response.data.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        } else if (error.response.status === 400) {
          errorMessage = 'Error: La fecha y hora seleccionada no es válida o está fuera del horario del dentista';
        } else if (error.response.status === 409) {
          errorMessage = 'Error: Ya existe una cita programada en ese horario';
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      addNotification(errorMessage, 'error');
    }
  };

  // Actualizar eventos del calendario
  const actualizarEventosCalendario = async () => {
    try {
      const response = await citaService.obtenerCitas();
      
      // Transformar las citas al formato que espera FullCalendar
      const events = response.map(cita => {
        // Preferir nombre compuesto del cliente: primero mirar `cliente.usuario`, luego `cliente.nombre`/`cliente.apellidos` si existen
        let patientName = 'Paciente';
        if (cita.cliente) {
          if ((cita.cliente as any).usuario && (((cita.cliente as any).usuario.nombre) || ((cita.cliente as any).usuario.apellidos))) {
            patientName = `${(cita.cliente as any).usuario.nombre || ''} ${(cita.cliente as any).usuario.apellidos || ''}`.trim();
          } else if ((cita.cliente as any).nombre || (cita.cliente as any).apellidos) {
            patientName = `${(cita.cliente as any).nombre || ''} ${(cita.cliente as any).apellidos || ''}`.trim();
          }
        }

        const dentistName = cita.dentista?.usuario?.nombre || 'Dentista';

        return {
          id: cita.id,
          title: cita.servicio.nombre,
          start: cita.fechaHora,
          end: new Date(new Date(cita.fechaHora).getTime() + cita.duracion * 60000).toISOString(),
          extendedProps: {
            status: cita.estado,
            patient: patientName,
            dentist: dentistName,
            service: cita.servicio.nombre,
            duration: cita.duracion
          },
          className: `event-${cita.estado}`
        };
      });
      
      setCalendarEvents(events);
      return events;
    } catch (error) {
      console.error('Error al actualizar eventos del calendario:', error);
      addNotification('No se pudieron actualizar los eventos del calendario', 'error');
      return [];
    }
  };

  // Evento cuando se redimensiona una cita
  const handleEventResize = async (resizeInfo: any) => {
    try {
      const { event } = resizeInfo;
      const citaId = event.id;
      const fechaInicio = event.start;
      const duracion = dayjs(event.end).diff(dayjs(event.start), 'minute');

      console.log('Redimensionando cita:', {
        citaId,
        fechaInicio: dayjs(fechaInicio).format('YYYY-MM-DD HH:mm:ss'),
        fechaInicioISO: fechaInicio.toISOString(),
        duracion
      });

      // Actualizar en el backend
      await citaService.actualizarFechaHoraCita(citaId, fechaInicio.toISOString(), duracion);

      // Mostrar notificación de éxito
      addNotification('Duración de la cita actualizada exitosamente', 'success');
      
      // Refrescar los eventos del calendario
      await actualizarEventosCalendario();
    } catch (error: any) {
      console.error('Error al redimensionar cita:', error);
      
      // Revertir el cambio
      resizeInfo.revert();
      
      // Mostrar mensaje de error detallado
      let errorMessage = 'Error al actualizar la duración de la cita';
      
      if (error.response) {
        console.log('Error response:', error.response);
        // Si es un error del servidor con datos
        if (error.response.data && error.response.data.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        } else if (error.response.status === 400) {
          errorMessage = 'Error: La duración seleccionada no es válida o está fuera del horario del dentista';
        } else if (error.response.status === 409) {
          errorMessage = 'Error: La nueva duración genera un conflicto con otra cita programada';
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      addNotification(errorMessage, 'error');
    }
  };

  // Función para manejar la selección manual de paciente
  const handleManualPatientSelection = (selectedPatientId: string) => {
    if (!tempAppointmentData) return;

    const pacienteSeleccionado = patients.find(p => p.id === selectedPatientId);
    if (!pacienteSeleccionado) return;

    const newData = {
      ...tempAppointmentData,
      patient: selectedPatientId
    };

    setNewAppointmentData(newData);
    setOpenPatientSelector(false);
    setOpenEditAppointment(true);
  };

  // Función para manejar la edición de cita
  const handleEditAppointment = async () => {
    try {
      if (!selectedAppointment) {
        console.error('No hay cita seleccionada');
        return;
      }

      if (patients.length === 0) {
        console.error('La lista de pacientes está vacía');
        addNotification('Error: No se han cargado los pacientes', 'error');
        return;
      }
      
      // Primero, obtener los detalles completos de la cita para tener el ID del paciente
      console.log('Obteniendo detalles completos de la cita ID:', selectedAppointmentId);
      let citaCompleta;
      
      try {
        citaCompleta = await citaService.obtenerCitaPorId(selectedAppointmentId || '');
        console.log('Detalles completos de la cita:', citaCompleta);
      } catch (error: any) {
        console.error('Error al obtener detalles de la cita:', error);
        const errorMessage = error?.message || 'No se pudieron obtener los detalles completos de la cita';
        addNotification(errorMessage, 'error');
        return;
      }
      
      // Con el ID del cliente, buscar el paciente directamente
      const pacienteSeleccionado = patients.find(p => p.id === citaCompleta.cliente.id);
      console.log('Paciente encontrado por ID:', pacienteSeleccionado);
      
      // Si no se encuentra el paciente por ID, intentar buscar por nombre como fallback
      let pacientePorNombre = null;
      if (!pacienteSeleccionado) {
        pacientePorNombre = patients.find(p => {
          const nombrePaciente = `${p.usuario?.nombre || ''} ${p.usuario?.apellidos || ''}`.trim().toLowerCase();
          const nombreBuscado = selectedAppointment.patient.toLowerCase().trim();
          return nombrePaciente.includes(nombreBuscado) || nombreBuscado.includes(nombrePaciente);
        });
        console.log('Paciente encontrado por nombre como fallback:', pacientePorNombre);
      }

      // Buscar dentista por ID y luego por nombre como fallback
      let dentistaSeleccionado = dentistas.find(d => d.id === citaCompleta.dentista.id);
      if (!dentistaSeleccionado) {
        dentistaSeleccionado = dentistas.find(d => {
          const nombreDentista = d.usuario?.nombre?.toLowerCase().trim() || '';
          const nombreBuscado = selectedAppointment.dentist.toLowerCase().trim();
          return nombreDentista.includes(nombreBuscado) || nombreBuscado.includes(nombreDentista);
        });
      }
      console.log('Dentista seleccionado:', dentistaSeleccionado);      // Buscar servicio por ID y luego por nombre como fallback
      let servicioSeleccionado = services.find(s => s.id === Number(citaCompleta.servicio.id));
      if (!servicioSeleccionado) {
        servicioSeleccionado = services.find(s => {
          const nombreServicio = s.nombre.toLowerCase().trim();
          const nombreBuscado = selectedAppointment.service.toLowerCase().trim();
          return nombreServicio === nombreBuscado || selectedAppointment.title.toLowerCase().includes(nombreServicio);
        });
      }
      console.log('Servicio seleccionado:', servicioSeleccionado);

      // Si no se encuentra el paciente pero sí el dentista y el servicio, mostrar selector manual
      if (!pacienteSeleccionado && !pacientePorNombre && dentistaSeleccionado && servicioSeleccionado) {
        const tempData = {
          dentist: dentistaSeleccionado.id,
          service: servicioSeleccionado.id.toString(),
          dateTime: dayjs(selectedAppointment.start),
          duration: typeof selectedAppointment.end === 'string' && typeof selectedAppointment.start === 'string' ? 
            dayjs(selectedAppointment.end).diff(dayjs(selectedAppointment.start), 'minute') : 30,
            // Preferir la nota proveniente de la API completa (citaCompleta), si está disponible
            notes: (citaCompleta && citaCompleta.notas) ? citaCompleta.notas : (selectedAppointment.notes || ''),
            status: (citaCompleta && citaCompleta.estado) ? citaCompleta.estado : (selectedAppointment.status as any)
        };
        
        setTempAppointmentData(tempData);
        setOpenAppointmentDetails(false);
        setOpenPatientSelector(true);
        return;
      }

      // Si faltan otros datos, mostrar error
      if (!dentistaSeleccionado || !servicioSeleccionado) {
        let mensajeError = 'Error al preparar la edición:';
        if (!dentistaSeleccionado) mensajeError += ' No se encontró el dentista.';
        if (!servicioSeleccionado) mensajeError += ' No se encontró el servicio.';
        
        addNotification(mensajeError, 'error');
        return;
      }

      // Si todo está bien, proceder con la edición
      const newData = {
        patient: (pacienteSeleccionado || pacientePorNombre)!.id,
        dentist: dentistaSeleccionado.id,
        service: servicioSeleccionado.id.toString(),
        dateTime: dayjs(selectedAppointment.start),
        duration: typeof selectedAppointment.end === 'string' && typeof selectedAppointment.start === 'string' ? 
          dayjs(selectedAppointment.end).diff(dayjs(selectedAppointment.start), 'minute') : 
          citaCompleta.duracion || 30,
        // Preferir la nota que devuelve el endpoint de la cita completa
        notes: (citaCompleta && citaCompleta.notas) ? citaCompleta.notas : (selectedAppointment.notes || ''),
        status: (citaCompleta && citaCompleta.estado) ? citaCompleta.estado : (selectedAppointment.status as any)
      };

      setNewAppointmentData(newData);
      setOpenAppointmentDetails(false);
      setOpenEditAppointment(true);
    } catch (error) {
      console.error('Error al preparar la edición de la cita:', error);
      addNotification('Error al preparar la edición de la cita', 'error');
    }
  };
  // Función para manejar la eliminación de cita
  const handleDeleteAppointment = async () => {
    try {
      if (!selectedAppointmentId) return;
      
      await citaService.eliminarCita(selectedAppointmentId);
      
      // Actualizar el estado local
      setCalendarEvents(prevEvents => 
        prevEvents.filter(event => event.id !== selectedAppointmentId)
      );
      
      // Actualizar las citas de hoy usando la misma lógica del dashboard
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const todasLasCitas = await citaService.obtenerCitas();
      const citasHoy = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita >= hoy && fechaCita < manana && cita.estado !== 'cancelada';
      });
      
      const citasOrdenadas = citasHoy
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 5);
      
      setProximasCitas(citasOrdenadas);
      
      addNotification('Cita eliminada exitosamente', 'success');
      setOpenDeleteConfirm(false);
      setOpenAppointmentDetails(false);
    } catch (error) {
      console.error('Error al eliminar la cita:', error);
      addNotification('Error al eliminar la cita', 'error');
    }
  };

  // Función para actualizar una cita
  const handleUpdateAppointment = async () => {
    try {
      if (!selectedAppointmentId) {
        addNotification('Error: ID de cita no encontrado', 'error');
        return;
      }
      
      if (!newAppointmentData.dateTime) {
        addNotification('Error: Debe seleccionar fecha y hora', 'error');
        return;
      }
      
      if (!newAppointmentData.patient) {
        addNotification('Error: Debe seleccionar un paciente', 'error');
        return;
      }
      
      if (!newAppointmentData.dentist) {
        addNotification('Error: Debe seleccionar un dentista', 'error');
        return;
      }
      
      if (!newAppointmentData.service) {
        addNotification('Error: Debe seleccionar un servicio', 'error');
        return;
      }

      // Mostrar indicador de carga durante la actualización
      addNotification('Actualizando cita...', 'info');

      // Convertir la fecha local a UTC
      const fechaLocal = dayjs.tz(newAppointmentData.dateTime, dayjs.tz.guess());
      const fechaUTC = fechaLocal.tz('UTC');
      
      console.log('Actualizando cita con datos:', {
        id: selectedAppointmentId,
        fechaLocal: fechaLocal.format('YYYY-MM-DD HH:mm:ss'),
        fechaUTC: fechaUTC.format('YYYY-MM-DD HH:mm:ss'),
        clienteId: newAppointmentData.patient,
        dentistaId: newAppointmentData.dentist,
        servicioId: newAppointmentData.service,
        duracion: newAppointmentData.duration
      });

      const citaActualizada = {
        clienteId: Number(newAppointmentData.patient),
        dentistaId: Number(newAppointmentData.dentist),
        servicioId: Number(newAppointmentData.service),
        fechaHora: fechaUTC.toISOString(),
        duracion: Number(newAppointmentData.duration),
        notas: newAppointmentData.notes?.trim() || '',
      // estado is handled separately via the estado endpoint
      };      const response = await citaService.actualizarCita(selectedAppointmentId, citaActualizada);
      console.log('Respuesta de actualización de cita:', response);

      // Si el estado cambió, actualizarlo usando el endpoint específico
      if (newAppointmentData.status && newAppointmentData.status !== selectedAppointment?.status) {
        try {
          await citaService.actualizarEstadoCita(selectedAppointmentId, newAppointmentData.status as string);
          await cargarReporteDiario();
        } catch (err) {
          console.error('Error al actualizar estado de la cita:', err);
          addNotification('Error al actualizar el estado de la cita', 'error');
        }
      }
      
      // Actualizar todos los eventos del calendario
      await actualizarEventosCalendario();

      // Actualizar las citas de hoy usando la misma lógica del dashboard
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      
      const todasLasCitas = await citaService.obtenerCitas();
      const citasHoy = todasLasCitas.filter(cita => {
        const fechaCita = new Date(cita.fechaHora);
        return fechaCita >= hoy && fechaCita < manana && cita.estado !== 'cancelada';
      });
      
      const citasOrdenadas = citasHoy
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 5);
      
      setProximasCitas(citasOrdenadas);

      addNotification('Cita actualizada exitosamente', 'success');
      setOpenEditAppointment(false);
    } catch (error: any) {
      console.error('Error al actualizar la cita:', error);
      
      let mensajeError = 'Error al actualizar la cita';
      
      if (error.response) {
        console.log('Error response:', error.response);
        if (error.response.data && error.response.data.message) {
          mensajeError = `Error: ${error.response.data.message}`;
        } else if (error.response.status === 400) {
          mensajeError = 'Error: Los datos de la cita no son válidos';
        } else if (error.response.status === 409) {
          mensajeError = 'Error: La fecha y hora seleccionada genera un conflicto con otra cita';
        }
      } else if (error.message) {
        mensajeError = `Error: ${error.message}`;
      }
      
      addNotification(mensajeError, 'error');
    }
  };

  

  // Renderizar la app
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Calendario de Citas
      </Typography>

      {/* Control Bar */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          width: '100%'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            variant="outlined"
            startIcon={<NavigateBeforeIcon />}
            onClick={() => handleCalendarNavigate('prev')}
          >
            Anterior
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleCalendarNavigate('today')}
            startIcon={<TodayIcon />}
          >
            Hoy
          </Button>
          <Button
            variant="outlined"
            endIcon={<NavigateNextIcon />}
            onClick={() => handleCalendarNavigate('next')}
          >
            Siguiente
          </Button>
          {/** Use the user's language from settings to localize labels and dates */}
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'medium' }}>
            {(() => {
              const lang = settings?.language || navigator.language || 'es-ES';
              const localeCode = lang.startsWith('en') ? 'en-GB' : 'es-ES';
              return currentDate.toLocaleString(localeCode, { month: 'long', year: 'numeric' });
            })()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(() => {
            const lang = settings?.language || navigator.language || 'es';
            const labels: any = {
              es: { month: 'Mes', week: 'Semana', day: 'Día', newAppointment: 'Nueva Cita', filter: 'Filtrar' },
              en: { month: 'Month', week: 'Week', day: 'Day', newAppointment: 'New Appointment', filter: 'Filter' }
            };
            const k = lang.startsWith('en') ? 'en' : 'es';
            return (
              <>
                <Button variant={view === 'dayGridMonth' ? 'contained' : 'outlined'} onClick={() => handleViewChange('dayGridMonth')} size="small">{labels[k].month}</Button>
                <Button variant={view === 'timeGridWeek' ? 'contained' : 'outlined'} onClick={() => handleViewChange('timeGridWeek')} size="small">{labels[k].week}</Button>
                <Button variant={view === 'timeGridDay' ? 'contained' : 'outlined'} onClick={() => handleViewChange('timeGridDay')} size="small">{labels[k].day}</Button>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setOpenNewAppointment(true); }}>{labels[k].newAppointment}</Button>
                <Tooltip title={labels[k].filter}>
                  <IconButton onClick={() => setOpenFilters(true)}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
              </>
            );
          })()}
        </Box>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3,
        width: '100%',
        maxWidth: '100%'
      }}>
        {/* Calendario */}
        <Box sx={{ 
          flex: '1 1 auto', 
          minWidth: 0,
          width: '100%'
        }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            {loadingCitas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : errorCitas ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {errorCitas}
              </Alert>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                headerToolbar={false}
                initialView={view}
                views={{
                  dayGridMonth: {},
                  timeGridWeek: {},
                  timeGridDay: {}
                }}
                eventClick={handleEventClick}
                select={handleDateSelect}
                events={visibleCalendarEvents}
                eventContent={eventContent}
                selectable={true}
                editable={true}
                dayMaxEvents={true}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                expandRows={true}
                locale={(settings?.language || navigator.language || '').startsWith('en') ? enLocale : esLocale}
                height="auto"
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
                nowIndicator={true}
              />
            )}
          </Paper>
        </Box>        {/* Panel lateral */}
        <Box sx={{ 
          width: { xs: '100%', md: '350px' }, 
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
            <Card 
              elevation={2}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden'
              }}
            >
              <CardHeader 
                title="Reporte de Afluencia" 
                titleTypographyProps={{ 
                  variant: 'h6', 
                  fontWeight: 600,
                  color: '#1e60fa'
                }}
                sx={{ 
                  bgcolor: '#1e60fa',
                  color: 'white',
                  py: 2,
                  '& .MuiCardHeader-title': {
                    color: 'white'
                  }
                }}
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleExportDailyReport}
                    disabled={loadingDailyReport || dailyReportAppointments.length === 0}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.7)',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.08)'
                      }
                    }}
                  >
                    Excel
                  </Button>
                }
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Fecha del reporte"
                  type="date"
                  size="small"
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Typography variant="body2" color="text.secondary">
                  Resumen del {reportDateLabel}
                </Typography>

                {loadingDailyReport ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : errorDailyReport ? (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {errorDailyReport}
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                      <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: 'success.light' }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          {dailyReportSummary[0].cantidad}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Confirmadas
                        </Typography>
                      </Card>
                      <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: 'error.light' }}>
                        <Typography variant="h5" fontWeight="bold" color="error.main">
                          {dailyReportSummary[1].cantidad}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Canceladas
                        </Typography>
                      </Card>
                      <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderColor: 'info.light' }}>
                        <Typography variant="h5" fontWeight="bold" color="info.main">
                          {totalDailyReportAppointments}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total
                        </Typography>
                      </Card>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Cantidad</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Porcentaje</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyReportSummary.map((item) => (
                            <TableRow key={item.estado}>
                              <TableCell>{item.etiqueta}</TableCell>
                              <TableCell align="center">{item.cantidad}</TableCell>
                              <TableCell align="center">
                                {totalDailyReportAppointments > 0
                                  ? `${((item.cantidad / totalDailyReportAppointments) * 100).toFixed(1)}%`
                                  : '0%'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {dailyReportAppointments.length === 0 && (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        No hay citas confirmadas o canceladas para esta fecha.
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

          {/* Dentistas disponibles */}
          <Card 
            elevation={2}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >            <CardHeader 
              title="Dentistas Disponibles" 
              titleTypographyProps={{ 
                variant: 'h6', 
                fontWeight: 600,
                color: '#1e60fa'
              }}
              sx={{ 
                bgcolor: '#1e60fa',
                color: 'white',
                py: 2,
                '& .MuiCardHeader-title': {
                  color: 'white'
                }
              }}/>
            <CardContent sx={{ 
              p: 3, 
              maxHeight: '300px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              bgcolor: 'background.paper',
              '&:last-child': { pb: 3 },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f5f5f5',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a1a1a1'
                }
              }
            }}>
              {renderDentistasDisponibles()}
            </CardContent>
          </Card>{/* Citas de Hoy */}
          <Card 
            elevation={2}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >            <CardHeader
              title="Citas de Hoy"              action={
                <Chip 
                  size="small"
                  label={`${proximasCitas.length} citas`}
                  sx={{ 
                    color: 'white',
                    borderColor: 'white',
                    '& .MuiChip-label': {
                      color: 'white'
                    }
                  }}
                  variant="outlined"
                />
              }
              titleTypographyProps={{ 
                variant: 'h6', 
                fontWeight: 600,
                color: '#1e60fa'
              }}
              sx={{ 
                bgcolor: '#1e60fa',
                color: 'white',
                py: 2,
                '& .MuiCardHeader-title': {
                  color: 'white'
                }
              }}
            />
            <CardContent sx={{ 
              p: 3,
               maxHeight: '400px',
               overflowY: 'auto',
               display: 'flex',
               flexDirection: 'column',
               gap: 2,
               alignItems: 'center',
               bgcolor: 'background.paper',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f5f5f5',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a1a1a1'
                }
              }
            }}>
              {loadingCitas ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  p: 4,
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <CircularProgress size={32} color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Cargando citas...
                  </Typography>
                </Box>
              ) : errorCitas ? (
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      width: '100%',
                      textAlign: 'center'
                    }
                  }}
                >
                  {errorCitas}
                </Alert>
              ) : proximasCitas.length === 0 ? (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <EventNoteIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'text.disabled' 
                    }} 
                  />
                  <Typography variant="body1" color="text.secondary" fontWeight="500">
                    No hay citas para hoy
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Las citas programadas aparecerán aquí
                  </Typography>
                </Box>
              ) : (
                proximasCitas.map((cita) => (
                      <Paper
                          key={cita.id}
                          elevation={1}
                          sx={{
                            width: '100%',
                            maxWidth: 420,
                            mx: 'auto',
                            p: 2.5,
                            cursor: 'pointer',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s ease-in-out',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                              elevation: 3,
                              borderColor: 'primary.light',
                              bgcolor: 'action.hover'
                            }
                          }}
                        onClick={() => scrollToCalendarEvent(cita.id)}>
                          <Stack spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        width: '100%'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon 
                            fontSize="small" 
                            color="primary"
                            sx={{ bgcolor: 'primary.light', p: 0.5, borderRadius: 1 }}
                          />
                          <Typography variant="body1" fontWeight="600" color="primary.main">
                            {dayjs(cita.fechaHora).format('HH:mm')} - {dayjs(cita.fechaHora).add(cita.duracion, 'minute').format('HH:mm')}
                          </Typography>
                        </Box>
                        <Chip 
                          size="small"
                             label={formatStatusLabel(cita.estado)}
                          color={cita.estado === 'pendiente' ? 'warning' : 
                                 cita.estado === 'confirmada' ? 'success' : 
                                 cita.estado === 'completada' ? 'info' : 'error'}
                          variant="filled"
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>
                      
                      <Typography variant="h6" fontWeight="600" color="text.primary" sx={{ textAlign: 'center' }}>
                        {cita.servicio.nombre}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%' }}>
                        <PersonIcon 
                          fontSize="small" 
                          color="action"
                          sx={{ bgcolor: 'grey.100', p: 0.5, borderRadius: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          {cita.cliente.usuario.nombre}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Modal para crear nueva cita */}
      <Dialog 
        open={openNewAppointment} 
        onClose={() => setOpenNewAppointment(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'row'
          }
        }}
      >
        {/* Panel izquierdo - Formulario */}
        <Box sx={{ 
          flex: '1 1 60%', 
          maxWidth: '60%', 
          borderRight: 1, 
          borderColor: 'divider',
          overflowY: 'auto'
        }}>
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EventIcon color="primary" />
            <Typography variant="h5" component="span" fontWeight="500">
              Nueva Cita
            </Typography>
          </DialogTitle>

          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={3}>
                {/* Sección de Fecha y Hora */}
                <Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Fecha y Hora de la Cita
                  </Typography>
                  <DateTimePicker
                    label="Seleccionar fecha y hora"
                    value={newAppointmentData.dateTime}
                    onChange={(date) => {
                      if (date) {
                        // Convertir la fecha seleccionada a la zona horaria local
                        const localDate = dayjs(date).tz(dayjs.tz.guess());
                        console.log('Fecha seleccionada en DateTimePicker:', {
                          fechaSeleccionada: date.format('YYYY-MM-DD HH:mm:ss'),
                          fechaLocal: localDate.format('YYYY-MM-DD HH:mm:ss'),
                          zonaHoraria: dayjs.tz.guess(),
                          offset: localDate.format('Z')
                        });
                        handleNewAppointmentChange('dateTime', localDate);
                      }
                    }}
                    timezone="system"
                    sx={{ width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Horario del dentista: 09:00 - 14:00 (hora local)
                  </Typography>
                </Box>

                {/* Sección de Paciente */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Información del Paciente
                  </Typography>
                  {renderPatientSelector()}
                </Box>

                {/* Sección de Dentista y Servicio */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Detalles del Servicio
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      select
                      label="Seleccionar dentista"
                      fullWidth
                      value={newAppointmentData.dentist}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        console.log('Dentista seleccionado:', {
                          id: selectedId,
                          dentista: dentistas.find(d => d.id === selectedId),
                          fechaActual: newAppointmentData.dateTime?.format('YYYY-MM-DD HH:mm:ss')
                        });
                        handleNewAppointmentChange('dentist', selectedId);
                      }}
                    >
                      <MenuItem value="" disabled>
                        Seleccionar dentista
                      </MenuItem>
                      {dentistas.map((dentista) => (
                        <MenuItem key={dentista.id} value={dentista.id}>
                          <Stack direction="row" alignItems="center" spacing={2} width="100%">
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              {dentista.usuario.nombre.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2">
                                {dentista.usuario.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dentista.especialidad || 'Médico dentista'}
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                    {renderServiceSelector()}
                  </Stack>
                </Box>

                {/* Sección de Notas */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Notas Adicionales
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Agregue notas o información adicional para la cita"
                    value={newAppointmentData.notes}
                    onChange={(e) => handleNewAppointmentChange('notes', e.target.value)}
                  />
                </Box>
              </Stack>
            </LocalizationProvider>
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setOpenNewAppointment(false)}
              variant="outlined"
              startIcon={<CloseIcon />}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNewAppointment}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={!newAppointmentData.patient || !newAppointmentData.dentist || !newAppointmentData.service || !newAppointmentData.dateTime}
            >
              Guardar Cita
            </Button>
          </DialogActions>
        </Box>

        {/* Panel derecho - Horarios */}
        <Box sx={{ 
          flex: '1 1 40%', 
          maxWidth: '40%', 
          p: 3,
          bgcolor: 'grey.50'
        }}>
          <Typography variant="h6" gutterBottom>
            Horarios Disponibles
          </Typography>
          
          {newAppointmentData.dentist && newAppointmentData.dateTime ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {dayjs(newAppointmentData.dateTime).format('DD [de] MMMM, YYYY')}
              </Typography>
              
              {horariosDentistaSeleccionado ? (
                <>
                  {Object.keys(horariosDentistaSeleccionado.horarioTrabajo).length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      {Object.entries(horariosDentistaSeleccionado.horarioTrabajo)
                        .sort((a, b) => {
                          const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                          return dias.indexOf(a[0]) - dias.indexOf(b[0]);
                        })
                        .map(([dia, rangos]) => {
                          // Asegurarnos de que rangos sea un array y tenga la estructura correcta
                          const rangosArray = Array.isArray(rangos) ? rangos : [];
                          
                          // Formatear el nombre del día
                          const nombreDia = dia.charAt(0).toUpperCase() + dia.slice(1);
                          
                          return (
                            <Box key={dia} sx={{ 
                              mb: 2,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: 'background.paper',
                              boxShadow: 1
                            }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                {nombreDia}
                              </Typography>
                              <Stack spacing={0.5}>
                                {rangosArray.map((rango, index) => (
                                  <Typography key={index} variant="body1" sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}>
                                    <AccessTimeIcon fontSize="small" color="action" />
                                    {rango.inicio} - {rango.fin}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          );
                        })}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No hay horarios disponibles para esta fecha
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Cargando horarios disponibles...
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="info">
              Seleccione un dentista y una fecha para ver los horarios disponibles
            </Alert>
          )}
        </Box>
      </Dialog>

      {/* Modal para detalles de una cita */}
      <Dialog 
        open={openAppointmentDetails} 
        onClose={() => setOpenAppointmentDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAppointment && (
          <>
            <DialogTitle>
              Detalles de la Cita
              <IconButton
                aria-label="close"
                onClick={() => setOpenAppointmentDetails(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      mr: 1,
                      bgcolor: 
                        selectedAppointment.status === 'confirmada' ? 'success.main' :
                        selectedAppointment.status === 'pendiente' ? 'warning.main' :
                        selectedAppointment.status === 'completada' ? 'info.main' : 
                        selectedAppointment.status === 'no asistió' ? 'grey.500' : 'error.main'
                    }}
                  />
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedAppointment.status === 'confirmada' ? 'Confirmada' :
                     selectedAppointment.status === 'pendiente' ? 'Pendiente' :
                     selectedAppointment.status === 'completada' ? 'Completada' : 
                     selectedAppointment.status === 'no asistió' ? 'No Asistió' : 'Cancelada'}
                  </Typography>
                </Box>

                <Typography variant="h5" gutterBottom>
                  {selectedAppointment.service}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(selectedAppointment.start).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Horario
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(selectedAppointment.start).format('HH:mm')} - {dayjs(selectedAppointment.end).format('HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Información del Paciente
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {selectedAppointment.patient.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedAppointment.patient}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paciente
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Información del Dentista
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                    {selectedAppointment.dentist.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedAppointment.dentist}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dentista
                    </Typography>
                  </Box>
                </Box>

                {selectedAppointment.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Notas
                    </Typography>
                    <Typography variant="body1">
                      {selectedAppointment.notes}
                    </Typography>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button 
                color="error" 
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteConfirm(true)}
              >
                Eliminar
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button 
                onClick={() => setOpenAppointmentDetails(false)}
                variant="outlined"
              >
                Cerrar
              </Button>
              <Button 
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditAppointment}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar esta cita? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenDeleteConfirm(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAppointment}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar cita */}
      <Dialog 
        open={openEditAppointment} 
        onClose={() => setOpenEditAppointment(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Editar Cita
          <IconButton
            aria-label="close"
            onClick={() => setOpenEditAppointment(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <DateTimePicker
                label="Fecha y hora"
                value={newAppointmentData.dateTime}
                onChange={(date) => {
                  if (date) {
                    const localDate = dayjs(date).tz(dayjs.tz.guess());
                    handleNewAppointmentChange('dateTime', localDate);
                  }
                }}
                timezone="system"
              />
                <TextField
                  select
                  label="Estado"
                  value={newAppointmentData.status}
                  onChange={(e) => handleNewAppointmentChange('status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="confirmada">Confirmada</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                  <MenuItem value="no asistió">No asistió</MenuItem>
                </TextField>
              {renderPatientSelector()}
              {renderServiceSelector()}
              <TextField
                multiline
                rows={4}
                label="Notas"
                fullWidth
                value={newAppointmentData.notes}
                onChange={(e) => handleNewAppointmentChange('notes', e.target.value)}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenEditAppointment(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateAppointment}
            variant="contained"
            color="primary"
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para selección manual de paciente */}
      <Dialog
        open={openPatientSelector}
        onClose={() => setOpenPatientSelector(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Seleccionar Paciente
          <IconButton
            aria-label="close"
            onClick={() => setOpenPatientSelector(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No se pudo encontrar automáticamente el paciente. Por favor, seleccione el paciente correcto de la lista.
          </Typography>
          <Box sx={{ mt: 2 }}>
            {patients.map((patient) => (
              <Box
                key={patient.id}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  mb: 1
                }}
                onClick={() => handleManualPatientSelection(patient.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {patient.usuario?.nombre?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {`${patient.usuario?.nombre || ''} ${patient.usuario?.apellidos || ''}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.usuario?.email || 'Sin correo'} • {patient.usuario?.telefono || 'Sin teléfono'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPatientSelector(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFilters} onClose={() => setOpenFilters(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Filtrar citas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona uno o más estados para mostrar en el calendario.
          </Typography>
          <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
            {[
              { value: 'pendiente', label: 'Pendiente', color: 'warning' as const },
              { value: 'confirmada', label: 'Confirmada', color: 'success' as const },
              { value: 'completada', label: 'Completada', color: 'info' as const },
              { value: 'cancelada', label: 'Cancelada', color: 'error' as const },
              { value: 'no asistió', label: 'No asistió', color: 'default' as const }
            ].map(item => {
              const status = item.value as 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no asistió';

              return (
                <Chip
                  key={item.value}
                  label={item.label}
                  onClick={() => toggleStatusFilter(status)}
                  variant={selectedStatusFilters.includes(status) ? 'filled' : 'outlined'}
                  color={item.color}
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearStatusFilters}>Limpiar</Button>
          <Button onClick={() => setOpenFilters(false)} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AppointmentCalendar;
