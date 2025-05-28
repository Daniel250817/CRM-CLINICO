import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent,
  Grid as MuiGrid,
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
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  FilterList as FilterListIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Today as TodayIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FullCalendar from '@fullcalendar/react';
import type { CalendarApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
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
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { servicioService, type Servicio } from '../../services/servicioService';

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface NewAppointmentFormData {
  patient: string;
  dentist: string;
  service: string;
  dateTime: dayjs.Dayjs | null;
  duration: number;
  notes: string;
}

interface CitaResponse {
  id: string;
  fechaHora: string;
  duracion: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  servicio: {
    id: string;
    nombre: string;
  };
  dentista: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
  cliente: {
    id: string;
    usuario: {
      nombre: string;
    }
  };
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

interface Patient {
  id: string;
  name: string;
}

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
}

interface PatientActions {
  viewProfile: (id: string) => void;
  createAppointment: (id: string) => void;
  viewHistory: (id: string) => void;
  editPatient: (id: string) => void;
}

const AppointmentCalendar = () => {
  const { addNotification } = useNotification();
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [openNewAppointment, setOpenNewAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
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
  });
  const [services, setServices] = useState<Servicio[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);

  // Referencia al calendario
  const calendarRef = useRef<FullCalendar>(null);
  const navigate = useNavigate();

  // Añadir un estado para el diálogo de horarios
  const [horariosDentistaSeleccionado, setHorariosDentistaSeleccionado] = useState<HorariosDentistaSeleccionado | null>(null);

  // Cargar pacientes
  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        setLoadingPatients(true);
        const data = await clienteService.obtenerTodosLosClientes();
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
  }, [currentDate]);

  // Cargar próximas citas
  useEffect(() => {
    const cargarProximasCitas = async () => {
      try {
        setLoadingCitas(true);
        const hoy = new Date();
        const response = await citaService.obtenerCitas({
          params: {
            desde: hoy.toISOString(),
            estado: 'pendiente,confirmada'
          }
        });
        
        // Ordenar por fecha y tomar las próximas 5
        const citasOrdenadas = response
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
          .slice(0, 5);
        
        setProximasCitas(citasOrdenadas);
        setErrorCitas(null);
      } catch (error) {
        console.error('Error al cargar próximas citas:', error);
        setErrorCitas('No se pudieron cargar las próximas citas');
      } finally {
        setLoadingCitas(false);
      }
    };

    cargarProximasCitas();
  }, []);

  // Cargar citas para el calendario
  useEffect(() => {
    const cargarCitasCalendario = async () => {
      try {
        setLoadingCitas(true);
        const response = await citaService.obtenerCitas();
        
        // Transformar las citas al formato que espera FullCalendar
        const events = response.map(cita => ({
          id: cita.id,
          title: cita.servicio.nombre,
          start: cita.fechaHora,
          end: new Date(new Date(cita.fechaHora).getTime() + cita.duracion * 60000).toISOString(),
          extendedProps: {
            status: cita.estado,
            patient: cita.cliente.usuario.nombre,
            dentist: cita.dentista.usuario.nombre,
            service: cita.servicio.nombre,
            duration: cita.duracion
          },
          className: `event-${cita.estado}`
        }));
        
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
    
    setSelectedDate(selectedDate);
    setNewAppointmentData({
      ...newAppointmentData,
      dateTime: selectedDate
    });
    setOpenNewAppointment(true);
  };

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
    const citaId = clickInfo.event.id;
    const cita = calendarEvents.find(event => event.id === citaId);
    
    if (cita) {
      setSelectedAppointment({
        id: cita.id,
        title: cita.title,
        start: cita.start,
        end: cita.end,
        patient: cita.extendedProps.patient,
        dentist: cita.extendedProps.dentist,
        service: cita.extendedProps.service,
        status: cita.extendedProps.status
      });
      setOpenAppointmentDetails(true);
    }
  };

  // Formato de eventos para el calendario
  const eventContent = (eventInfo: any) => {
    const { timeText, event } = eventInfo;
    const { extendedProps } = event;
    
    return (
      <Box className="appointment-card">
        <Box className="appointment-time">
          <AccessTimeIcon sx={{ fontSize: '0.875rem' }} />
          {timeText} • Horario de cita
        </Box>
        
        <Typography className="appointment-title">
          {event.title}
        </Typography>
        
        <Box className="appointment-patient">
          <PersonIcon sx={{ fontSize: '0.875rem' }} />
          {extendedProps.patient}
        </Box>

        <Typography className="appointment-status">
          {extendedProps.status}
        </Typography>
      </Box>
    );
  };

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
      };

      setCalendarEvents(prevEvents => [...prevEvents, nuevoEvento]);

      // Actualizar las próximas citas
      const nuevasProximasCitas = await citaService.obtenerCitas({
        params: {
          desde: new Date().toISOString(),
          estado: 'pendiente,confirmada'
        }
      });
      setProximasCitas(nuevasProximasCitas.slice(0, 5));

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
      const localDate = dayjs.tz(value, dayjs.tz.guess());
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (errorDentistas) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {errorDentistas}
        </Alert>
      );
    }

    if (dentistas.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay dentistas disponibles para esta fecha
          </Typography>
        </Box>
      );
    }

    return dentistas.map((dentista, index) => (
      <Box key={dentista.id}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            p: 2,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 40,
              height: 40
            }}
          >
            {dentista.usuario.nombre.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {dentista.usuario.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dentista.especialidad || 'Médico dentista'}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
        </Box>
        {index < dentistas.length - 1 && <Divider />}
      </Box>
    ));
  };

  // Acciones para pacientes
  const patientActions: PatientActions = {
    viewProfile: (id: string) => {
      navigate(`/patients/${id}`);
    },
    createAppointment: (id: string) => {
      setNewAppointmentData(prev => ({
        ...prev,
        patient: id
      }));
      setOpenNewAppointment(true);
    },
    viewHistory: async (id: string) => {
      try {
        const historial = await clienteService.obtenerPerfilCompleto(id);
        // Aquí podrías abrir un modal para mostrar el historial
        console.log('Historial del paciente:', historial);
      } catch (error) {
        console.error('Error al obtener historial:', error);
      }
    },
    editPatient: (id: string) => {
      navigate(`/patients/${id}/edit`);
    }
  };

  // Renderizar menú de acciones para paciente
  const renderPatientActions = (patient: Cliente) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Ver perfil">
        <IconButton 
          size="small"
          onClick={() => patientActions.viewProfile(patient.id)}
        >
          <PersonIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Nueva cita">
        <IconButton 
          size="small"
          onClick={() => patientActions.createAppointment(patient.id)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Ver historial">
        <IconButton 
          size="small"
          onClick={() => patientActions.viewHistory(patient.id)}
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Editar paciente">
        <IconButton 
          size="small"
          onClick={() => patientActions.editPatient(patient.id)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

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
        duracion
      });

      // Actualizar en el backend
      await citaService.actualizarFechaHoraCita(citaId, nuevaFecha.toISOString(), duracion);

      // Mostrar notificación de éxito
      addNotification('Cita actualizada exitosamente', 'success');

      // Actualizar la lista de próximas citas
      const nuevasProximasCitas = await citaService.obtenerCitas({
        params: {
          desde: new Date().toISOString(),
          estado: 'pendiente,confirmada'
        }
      });
      setProximasCitas(nuevasProximasCitas.slice(0, 5));
    } catch (error: any) {
      console.error('Error al mover cita:', error);
      
      // Revertir el cambio en el calendario
      dropInfo.revert();
      
      // Mostrar mensaje de error
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la cita';
      addNotification(errorMessage, 'error');
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
        duracion
      });

      // Actualizar en el backend
      await citaService.actualizarFechaHoraCita(citaId, fechaInicio.toISOString(), duracion);

      // Mostrar notificación de éxito
      addNotification('Duración de la cita actualizada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al redimensionar cita:', error);
      
      // Revertir el cambio
      resizeInfo.revert();
      
      // Mostrar mensaje de error
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la duración de la cita';
      addNotification(errorMessage, 'error');
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
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'medium' }}>
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant={view === 'dayGridMonth' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('dayGridMonth')}
            size="small"
          >
            Mes
          </Button>
          <Button
            variant={view === 'timeGridWeek' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('timeGridWeek')}
            size="small"
          >
            Semana
          </Button>
          <Button
            variant={view === 'timeGridDay' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('timeGridDay')}
            size="small"
          >
            Día
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedDate(dayjs());
              setOpenNewAppointment(true);
            }}
          >
            Nueva Cita
          </Button>
          <Tooltip title="Filtrar">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
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
                events={calendarEvents}
                eventContent={eventContent}
                selectable={true}
                editable={true}
                dayMaxEvents={true}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                expandRows={true}
                locale={esLocale}
                height="auto"
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
                nowIndicator={true}
              />
            )}
          </Paper>
        </Box>

        {/* Panel lateral */}
        <Box sx={{ 
          width: { xs: '100%', md: '300px' }, 
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Dentistas disponibles */}
          <Card>
            <CardHeader 
              title="Dentistas Disponibles" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent sx={{ 
              p: 0, 
              maxHeight: '300px', 
              overflowY: 'auto',
              '&:last-child': { pb: 0 },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#bdbdbd',
                borderRadius: '4px',
                '&:hover': {
                  background: '#9e9e9e'
                }
              }
            }}>
              {renderDentistasDisponibles()}
            </CardContent>
          </Card>

          {/* Próximas Citas */}
          <Card sx={{ width: '100%' }}>
            <CardHeader
              title="Próximas Citas"
              action={
                <Button 
                  size="small"
                  endIcon={<ArrowDropDownIcon />}
                >
                  Hoy
                </Button>
              }
              titleTypographyProps={{ variant: 'h6' }}
              sx={{ px: 3 }}
            />
            <Divider />
            <Box sx={{ 
              p: 2,
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '& .appointment-item': {
                width: '100%',
                '& .MuiBox-root': {
                  width: '100%'
                }
              },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#bdbdbd',
                borderRadius: '4px',
                '&:hover': {
                  background: '#9e9e9e'
                }
              }
            }}>
              {loadingCitas ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : errorCitas ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {errorCitas}
                </Alert>
              ) : proximasCitas.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay citas próximas
                  </Typography>
                </Box>
              ) : (
                proximasCitas.map((cita, index) => (
                  <Box key={cita.id} className="appointment-item">
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {dayjs(cita.fechaHora).format('HH:mm')} - {dayjs(cita.fechaHora).add(cita.duracion, 'minute').format('HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2">
                        {cita.servicio.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cita.cliente.usuario.nombre}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small"
                        label={cita.estado === 'pendiente' ? 'Pendiente' : 
                               cita.estado === 'confirmada' ? 'Confirmada' : 
                               cita.estado === 'completada' ? 'Completada' : 'Cancelada'}
                        color={cita.estado === 'pendiente' ? 'warning' : 
                               cita.estado === 'confirmada' ? 'success' : 
                               cita.estado === 'completada' ? 'info' : 'error'}
                        variant="outlined"
                      />
                    </Stack>
                    {index < proximasCitas.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))
              )}
            </Box>
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
                &times;
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
                        selectedAppointment.status === 'confirmed' ? 'success.main' :
                        selectedAppointment.status === 'pending' ? 'warning.main' :
                        selectedAppointment.status === 'completed' ? 'info.main' : 'error.main'
                    }}
                  />
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedAppointment.status === 'confirmed' ? 'Confirmada' :
                     selectedAppointment.status === 'pending' ? 'Pendiente' :
                     selectedAppointment.status === 'completed' ? 'Completada' : 'Cancelada'}
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
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedAppointment.status !== 'cancelled' && (
                <Button 
                  color="error" 
                  variant="outlined"
                >
                  Cancelar Cita
                </Button>
              )}
              {selectedAppointment.status === 'pending' && (
                <Button 
                  color="success" 
                  variant="outlined"
                >
                  Confirmar
                </Button>
              )}
              <Button 
                onClick={() => setOpenAppointmentDetails(false)}
              >
                Cerrar
              </Button>
              <Button 
                variant="contained"
                color="primary"
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* El diálogo de horarios se ha eliminado ya que ahora se muestra en el panel derecho */}
    </Box>
  );
};

export default AppointmentCalendar;
