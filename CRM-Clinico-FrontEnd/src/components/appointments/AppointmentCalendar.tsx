import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent,
  Grid,
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
  History as HistoryIcon
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
import { dentistaService, type Dentista } from '../../services/dentistaService';
import { citaService, type Cita } from '../../services/citaService';
import { clienteService, type Cliente } from '../../services/clienteService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { servicioService, type Servicio } from '../../services/servicioService';

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
          title: `${cita.servicio.nombre} - ${cita.dentista.usuario.nombre}`,
          start: cita.fechaHora,
          end: new Date(new Date(cita.fechaHora).getTime() + cita.duracion * 60000).toISOString(),
          extendedProps: {
            status: cita.estado,
            patient: cita.dentista.usuario.nombre,
            dentist: cita.dentista.usuario.nombre,
            service: cita.servicio.nombre
          }
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
    setSelectedDate(dayjs(selectInfo.start));
    setNewAppointmentData({
      ...newAppointmentData,
      dateTime: dayjs(selectInfo.start)
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
  const getEventClassNames = (eventInfo: any) => {
    const status = eventInfo.event.extendedProps.status;
    
    switch (status) {
      case 'confirmed':
        return 'event-confirmed';
      case 'pending':
        return 'event-pending';
      case 'completed':
        return 'event-completed';
      case 'cancelled':
        return 'event-cancelled';
      default:
        return '';
    }
  };

  // Verificar disponibilidad del dentista
  const verificarDisponibilidad = async (dentistaId: number, fecha: string, duracion: number) => {
    try {
      console.log('Verificando disponibilidad para:', {
        dentistaId,
        fecha,
        duracion
      });

      const disponibilidad = await dentistaService.obtenerDisponibilidad(dentistaId.toString(), {
        params: { fecha }
      });

      console.log('Disponibilidad recibida:', disponibilidad);

      // Si no hay slots disponibles, retornar false
      if (!disponibilidad.slotsDisponibles || disponibilidad.slotsDisponibles.length === 0) {
        console.log('No hay slots disponibles para esta fecha');
        return false;
      }

      // Convertir la fecha de la cita a objeto Date
      const fechaCita = new Date(fecha);
      const finCita = new Date(fechaCita.getTime() + duracion * 60000);

      console.log('Buscando slot para:', {
        fechaCita: fechaCita.toISOString(),
        finCita: finCita.toISOString()
      });

      // Verificar si el horario está dentro de los slots disponibles
      const slotDisponible = disponibilidad.slotsDisponibles.some(slot => {
        const inicioSlot = new Date(slot.inicio);
        const finSlot = new Date(slot.fin);

        const disponible = fechaCita >= inicioSlot && finCita <= finSlot;
        
        if (disponible) {
          console.log('Slot encontrado:', {
            inicio: inicioSlot.toISOString(),
            fin: finSlot.toISOString()
          });
        }

        return disponible;
      });

      if (!slotDisponible) {
        console.log('No se encontró un slot disponible que coincida con el horario solicitado');
      }

      return slotDisponible;
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      if (error instanceof Error) {
        throw new Error(`No se pudo verificar la disponibilidad del dentista: ${error.message}`);
      } else {
        throw new Error('No se pudo verificar la disponibilidad del dentista');
      }
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
        console.error('Datos del paciente:', {
          selectedId: newAppointmentData.patient,
          availablePatients: patients.map(p => ({ id: p.id, nombre: p.usuario.nombre }))
        });
        addNotification('El paciente seleccionado no es válido', 'error');
        return;
      }

      // Verificar disponibilidad antes de crear la cita
      const fechaHora = newAppointmentData.dateTime.format('YYYY-MM-DDTHH:mm:ss');
      const disponible = await verificarDisponibilidad(
        Number(newAppointmentData.dentist),
        fechaHora,
        newAppointmentData.duration
      );

      if (!disponible) {
        addNotification('El dentista no está disponible en ese horario', 'error');
        return;
      }

      const nuevaCita: NuevaCitaDTO = {
        clienteId: Number(pacienteSeleccionado.id),
        dentistaId: Number(newAppointmentData.dentist),
        servicioId: Number(newAppointmentData.service),
        fechaHora: fechaHora,
        duracion: Number(newAppointmentData.duration),
        notas: (newAppointmentData.notes || '').trim(),
        estado: 'pendiente' as const
      };

      console.log('Datos de la nueva cita:', nuevaCita);

      // Guardar la cita en el backend
      const citaCreada = await citaService.crearCita(nuevaCita);

      console.log('Cita creada:', citaCreada);

      // Verificar que tenemos todos los datos necesarios
      if (!citaCreada?.cliente?.usuario?.nombre || !citaCreada?.dentista?.usuario?.nombre || !citaCreada?.servicio?.nombre) {
        console.error('Datos incompletos en la respuesta:', citaCreada);
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
      console.error('Error al crear la cita:', error);
      // Mostrar mensaje de error específico
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la cita';
      addNotification(errorMessage, 'error');
    }
  };

  // Cambiar los datos de la nueva cita
  const handleNewAppointmentChange = (field: keyof NewAppointmentFormData, value: any) => {
    setNewAppointmentData({ 
      ...newAppointmentData, 
      [field]: value,
      // Si cambia el servicio, actualizamos la duración automáticamente
      ...(field === 'service' && {
        duration: services.find(s => s.id === Number(value))?.duracion || 30
      })
    });
  };

  // Función para ver la agenda de un dentista específico
  const handleViewDentistSchedule = async (dentistaId: string) => {
    try {
      const fecha = dayjs(currentDate).format('YYYY-MM-DD');
      const disponibilidad = await dentistaService.obtenerDisponibilidad(dentistaId, { params: { fecha } });
      // Aquí puedes implementar la lógica para mostrar la disponibilidad
      console.log('Disponibilidad del dentista:', disponibilidad);
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
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
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {dentista.usuario.nombre.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {`${dentista.usuario.nombre} ${dentista.usuario.apellidos}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dentista.especialidad}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
            onClick={() => handleViewDentistSchedule(dentista.id)}
          >
            Ver Agenda
          </Button>
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

  // Modificar el formulario de nueva cita
  const renderNewAppointmentForm = () => (
    <DialogContent>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <DateTimePicker
            label="Fecha y hora"
            value={newAppointmentData.dateTime}
            onChange={(date) => handleNewAppointmentChange('dateTime', date)}
          />

          {renderPatientSelector()}

          <TextField
            select
            label="Dentista"
            fullWidth
            value={newAppointmentData.dentist}
            onChange={(e) => handleNewAppointmentChange('dentist', e.target.value)}
          >
            <MenuItem value="" disabled>
              Seleccionar dentista
            </MenuItem>
            {loadingDentistas ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Cargando dentistas...
              </MenuItem>
            ) : errorDentistas ? (
              <MenuItem disabled>
                Error al cargar dentistas
              </MenuItem>
            ) : dentistas.length === 0 ? (
              <MenuItem disabled>
                No hay dentistas disponibles
              </MenuItem>
            ) : (
              dentistas.map((dentista) => (
                <MenuItem key={dentista.id} value={dentista.id}>
                  {`${dentista.usuario.nombre} ${dentista.usuario.apellidos}`}
                </MenuItem>
              ))
            )}
          </TextField>

          {renderServiceSelector()}

          <TextField
            label="Notas"
            multiline
            rows={4}
            fullWidth
            value={newAppointmentData.notes}
            onChange={(e) => handleNewAppointmentChange('notes', e.target.value)}
          />
        </Stack>
      </LocalizationProvider>
    </DialogContent>
  );

  const renderAppointment = (cita: Cita) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <AccessTimeIcon color="action" fontSize="small" />
        <Typography variant="body2">
          {new Date(cita.fechaHora).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PersonIcon color="action" fontSize="small" />
        <Typography variant="body2">
          {cita.dentista.usuario.nombre}
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mt: 1 
      }}>
        <Typography variant="body2" color="text.secondary">
          {cita.servicio.nombre}
        </Typography>
        <Chip
          size="small"
          label={cita.estado}
          color={
            cita.estado === 'confirmada' ? 'success' :
            cita.estado === 'pendiente' ? 'warning' :
            cita.estado === 'cancelada' ? 'error' :
            'default'
          }
        />
      </Box>
    </Box>
  );

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
                eventClassNames={getEventClassNames}
                selectable={true}
                editable={true}
                dayMaxEvents={true}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                expandRows={true}
                locale={esLocale}
                height="auto"
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
                    {renderAppointment(cita)}
                    {index < proximasCitas.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Modal para crear nueva cita */}
      <Dialog open={openNewAppointment} onClose={() => setOpenNewAppointment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cita</DialogTitle>
        {renderNewAppointmentForm()}
        <DialogActions>
          <Button onClick={() => setOpenNewAppointment(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveNewAppointment} 
            variant="contained"
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
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
    </Box>
  );
};

export default AppointmentCalendar;
