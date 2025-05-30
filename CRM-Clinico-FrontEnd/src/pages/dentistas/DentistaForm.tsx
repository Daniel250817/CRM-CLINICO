import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Chip,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import dentistaService from '../../services/dentistaService';
import type { Dentista, DentistaCreacionDatos } from '../../services/dentistaService';
import { usuarioService } from '../../services/usuarioService';
import type { Usuario } from '../../services/usuarioService';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import config from '../../config';
import authService, { AuthError } from '../../services/authService';

interface DentistaFormFields {
  userId: string;
  especialidad: string;
  horarioTrabajo: string;
  status: 'activo' | 'inactivo' | 'vacaciones';
  titulo: string;
  numeroColegiado: string;
  añosExperiencia: string;
  biografia: string;
}

interface NuevoUsuarioFields {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

interface FormErrors {
  userId?: string;
  especialidad?: string;
  horarioTrabajo?: string;
  status?: string;
  titulo?: string;
  numeroColegiado?: string;
  añosExperiencia?: string;
  biografia?: string;  nuevoUsuario?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    password?: string;
  };
}

interface HorarioItem {
  inicio: string;
  fin: string;
  dias: number[];
}

interface HorarioBD {
  [key: string]: Array<{ inicio: string; fin: string }>;
}

interface UserResponse {
  status?: string;
  data: {
    usuario?: Usuario;
    usuarios?: Usuario[];
  };
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Array<{
        campo: string;
        mensaje: string;
        codigo: string;
      }>;
    };
  };
}

const diasSemana = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
  { id: 0, nombre: 'Domingo' },
];

// Función para convertir el formato de horario de la BD al formato del frontend
const convertirHorarioBDaFrontend = (horarioBD: any): HorarioItem[] => {
  if (!horarioBD || typeof horarioBD !== 'object') {
    return [{ inicio: '09:00', fin: '14:00', dias: [1, 2, 3, 4, 5] }];
  }

  const diasMap: { [key: string]: number } = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  };

  try {
    const horarioParsed = typeof horarioBD === 'string' ? JSON.parse(horarioBD) : horarioBD;
    const horariosUnicos = new Set<string>();
    const diasPorHorario: { [key: string]: number[] } = {};

    // Primero recolectamos todos los horarios únicos y sus días
    Object.entries(horarioParsed).forEach(([dia, horarios]: [string, any]) => {
      if (Array.isArray(horarios)) {
        horarios.forEach(h => {
          const horarioKey = `${h.inicio}-${h.fin}`;
          horariosUnicos.add(horarioKey);
          if (!diasPorHorario[horarioKey]) {
            diasPorHorario[horarioKey] = [];
          }
          diasPorHorario[horarioKey].push(diasMap[dia]);
        });
      }
    });

    // Convertimos al formato del frontend
    return Array.from(horariosUnicos).map(horarioKey => {
      const [inicio, fin] = horarioKey.split('-');
      return {
        inicio,
        fin,
        dias: diasPorHorario[horarioKey].sort((a, b) => a - b)
      };
    });
  } catch (error) {
    console.error('Error al convertir horario:', error);
    return [{ inicio: '09:00', fin: '14:00', dias: [1, 2, 3, 4, 5] }];
  }
};

// Función para convertir el formato del frontend al formato de la BD
const convertirHorarioFrontendaBD = (horarios: HorarioItem[]) => {
  const diasMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const horarioBD: { [key: string]: Array<{ inicio: string; fin: string }> } = {
    domingo: [],
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: []
  };

  // Si no hay horarios definidos, establecer un horario por defecto
  if (!horarios || horarios.length === 0) {
    horarioBD.lunes = [{ inicio: '09:00', fin: '14:00' }];
    horarioBD.martes = [{ inicio: '09:00', fin: '14:00' }];
    horarioBD.miercoles = [{ inicio: '09:00', fin: '14:00' }];
    horarioBD.jueves = [{ inicio: '09:00', fin: '14:00' }];
    horarioBD.viernes = [{ inicio: '09:00', fin: '14:00' }];
    return horarioBD;
  }

  horarios.forEach(horario => {
    if (!horario.inicio || !horario.fin || !horario.dias || horario.dias.length === 0) {
      return; // Ignorar horarios incompletos
    }

    horario.dias.forEach(diaNum => {
      if (diaNum >= 0 && diaNum <= 6) { // Validar que el día sea válido
        const diaNombre = diasMap[diaNum];
        if (!horarioBD[diaNombre]) {
          horarioBD[diaNombre] = [];
        }
        // Asegurar que los valores sean strings válidos
        horarioBD[diaNombre].push({
          inicio: typeof horario.inicio === 'string' ? horario.inicio : '09:00',
          fin: typeof horario.fin === 'string' ? horario.fin : '14:00'
        });
      }
    });
  });

  // Eliminar días sin horarios
  Object.keys(horarioBD).forEach(dia => {
    if (horarioBD[dia].length === 0) {
      delete horarioBD[dia];
    }
  });

  return horarioBD;
};

const DentistaForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== 'nuevo');

  const [loading, setLoading] = useState(false);
  const [loadingDentista, setLoadingDentista] = useState(isEditMode);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Usuario[]>([]);
  const [horarios, setHorarios] = useState<HorarioItem[]>([
    { inicio: '09:00', fin: '14:00', dias: [1, 2, 3, 4, 5] }
  ]);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuarioFields>({
    nombre: '',
    email: '',
    telefono: '',
    password: ''
  });

  const [formData, setFormData] = useState<DentistaFormFields>({
    userId: '',
    especialidad: '',
    horarioTrabajo: JSON.stringify([
      { inicio: '09:00', fin: '14:00', dias: [1, 2, 3, 4, 5] },
      { inicio: '16:00', fin: '20:00', dias: [1, 2, 3, 4] }
    ], null, 2),
    status: 'activo',
    titulo: '',
    numeroColegiado: '',
    añosExperiencia: '',
    biografia: ''
  });

  // Cargar usuarios disponibles (que no sean ya dentistas)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await usuarioService.obtenerUsuarios();
        const allUsers = Array.isArray(response) ? response : [];
        console.log('Usuarios obtenidos:', allUsers?.length);

        if (isEditMode && id) {
          const dentista = await dentistaService.obtenerDentista(id);
          const currentUserId = dentista.userId;

          const dentistas = await dentistaService.obtenerDentistas();
          const dentistaUserIds = dentistas
            .map(d => d.userId)
            .filter(userId => userId !== currentUserId);

          const usersAvailable = allUsers.filter(user => 
            !dentistaUserIds.includes(user.id.toString()) || user.id.toString() === currentUserId.toString()
          );
          
          console.log('Usuario actual ID:', currentUserId);
          console.log('Usuarios disponibles en edición:', usersAvailable.length);
          setAvailableUsers(usersAvailable);
        } else {
          const dentistas = await dentistaService.obtenerDentistas();
          const dentistaUserIds = dentistas.map(dentista => dentista.userId);
          console.log('UserIDs ya asignados a dentistas:', dentistaUserIds);
          
          const usersAvailable = allUsers.filter(user => !dentistaUserIds.includes(user.id.toString()));
          console.log('Usuarios disponibles para asignar:', usersAvailable.length);
          setAvailableUsers(usersAvailable);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setError('No se pudieron cargar los usuarios disponibles');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [id, isEditMode]);

  // Cargar datos del dentista si estamos en modo edición
  useEffect(() => {
    const loadDentistaData = async () => {
      if (!isEditMode || !id) return;
      
      try {
        setLoadingDentista(true);
        const dentista = await dentistaService.obtenerDentista(id);
        
        // Buscar y seleccionar el usuario primero
        if (dentista.userId) {
          try {
            const response = await usuarioService.obtenerUsuario(dentista.userId);
            console.log('Respuesta del usuario:', response);
            
            // Intentar extraer el usuario de la respuesta
            let userData: Usuario | null = null;
            
            if (response && typeof response === 'object') {
              if ('data' in response && response.data && typeof response.data === 'object') {
                // Si la respuesta tiene un formato { data: { usuario: {...} } }
                userData = (response.data as any).usuario;
              } else if ('usuario' in response) {
                // Si la respuesta tiene un formato { usuario: {...} }
                userData = (response as any).usuario;
              } else if ('id' in response) {
                // Si la respuesta es directamente el usuario
                userData = response as Usuario;
              }
            }

            if (userData && 'id' in userData) {
              console.log('Usuario procesado:', userData);
              setSelectedUser(userData);
              setFormData(prev => ({
                ...prev,
                userId: dentista.userId
              }));
            } else {
              throw new Error('No se pudo extraer la información del usuario de la respuesta');
            }
          } catch (error) {
            console.error('Error al cargar detalles del usuario:', error);
            setError('No se pudo cargar la información del usuario asociado');
          }
        }

        // Convertir y establecer los horarios
        const horariosConvertidos = convertirHorarioBDaFrontend(dentista.horarioTrabajo);
        setHorarios(horariosConvertidos);
        
        // Cargar los datos del formulario
        setFormData(prev => ({
          ...prev,
          especialidad: dentista.especialidad || '',
          horarioTrabajo: JSON.stringify(horariosConvertidos, null, 2),
          status: dentista.status || 'activo',
          titulo: dentista.titulo || '',
          numeroColegiado: dentista.numeroColegiado || '',
          añosExperiencia: dentista.añosExperiencia?.toString() || '',
          biografia: dentista.biografia || ''
        }));

      } catch (error) {
        console.error('Error al cargar datos del dentista:', error);
        setError('No se pudo cargar la información del dentista');
      } finally {
        setLoadingDentista(false);
      }
    };

    loadDentistaData();
  }, [id, isEditMode]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Validar usuario seleccionado o nuevo usuario
    if (!formData.userId && !isCreatingNewUser) {
      errors.userId = 'Debe seleccionar un usuario';
    }
    
    // Validar especialidad
    if (!formData.especialidad.trim()) {
      errors.especialidad = 'La especialidad es requerida';
    }
    
    // Validar horarios
    if (!horarios || horarios.length === 0) {
      errors.horarioTrabajo = 'Debe especificar al menos un horario de trabajo';
    } else {
      // Verificar que cada horario tenga días y horas válidas
      const horarioInvalido = horarios.some(h => 
        !h.inicio || !h.fin || !h.dias || h.dias.length === 0
      );

      if (horarioInvalido) {
        errors.horarioTrabajo = 'Todos los horarios deben tener hora de inicio, fin y al menos un día seleccionado';
      }
    }
    
    // Validar estado
    if (!formData.status) {
      errors.status = 'El estado es requerido';
    }
    
    // Validar número de colegiado
    if (!formData.numeroColegiado?.trim()) {
      errors.numeroColegiado = 'El número de colegiado es requerido';
    }
    
    // Validar título
    if (!formData.titulo?.trim()) {
      errors.titulo = 'El título es requerido';
    }
    
    // Validar años de experiencia
    if (!formData.añosExperiencia) {
      errors.añosExperiencia = 'Los años de experiencia son requeridos';
    } else if (isNaN(Number(formData.añosExperiencia))) {
      errors.añosExperiencia = 'Debe ser un número';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUserChange = (_event: any, newValue: Usuario | null) => {
    setSelectedUser(newValue);
    setFormData({
      ...formData,
      userId: newValue?.id.toString() || ''
    });
  };

  const handleNuevoUsuarioChange = (field: keyof NuevoUsuarioFields) => (e: ChangeEvent<HTMLInputElement>) => {
    setNuevoUsuario(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const validateNuevoUsuario = (): boolean => {
    const errors: FormErrors['nuevoUsuario'] = {};
      // Validate nombre
    if (!nuevoUsuario.nombre) {
      errors.nombre = 'El nombre es requerido';
    } else if (nuevoUsuario.nombre.length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (nuevoUsuario.nombre.length > 100) {
      errors.nombre = 'El nombre no puede tener más de 100 caracteres';
    }
    
    if (!nuevoUsuario.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(nuevoUsuario.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!nuevoUsuario.password) {
      errors.password = 'La contraseña es requerida';
    } else if (nuevoUsuario.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }      // Updated phone validation to match backend requirements
      if (nuevoUsuario.telefono) {
        if (!/^[0-9+\-\s]+$/i.test(nuevoUsuario.telefono)) {
          errors.telefono = 'El teléfono solo puede contener números, +, - y espacios';
        }
      }
    
    setFormErrors(prev => ({
      ...prev,
      nuevoUsuario: errors
    }));
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isCreatingNewUser && !validateNuevoUsuario()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      let userId = formData.userId;      if (isCreatingNewUser) {
        // Register the user first through auth service
        const registerData = {
          nombre: nuevoUsuario.nombre,  // Use only nombre since there's no apellidos field in DB
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
          passwordConfirm: nuevoUsuario.password,  // Add passwordConfirm field to match backend validation
          telefono: nuevoUsuario.telefono,
          rol: 'dentista' as const,
        };
          try {
          const registerResponse = await authService.register(registerData);
          userId = registerResponse.data.id.toString();
        } catch (error: any) {
          console.error('Error al registrar dentista:', error);
          
          // Handle validation errors
          if (error instanceof AuthError && error.statusCode === 422) {
            setError('Error de validación: ' + error.message);
          } else if (error.response?.data?.errors) {
            // Format validation errors from backend
            const errorMessages = error.response.data.errors
              .map((err: any) => `${err.mensaje} (${err.campo})`)
              .join(', ');
            setError(`Error de validación: ${errorMessages}`);
          } else {
            setError(error.message || 'Error al registrar el usuario');
          }
          
          setLoading(false);
          return;
        }
      }

      // Validate that at least one valid schedule exists
      const horariosValidos = horarios.some(h => 
        h.inicio && h.fin && h.dias && h.dias.length > 0
      );

      if (!horariosValidos) {
        setError('Debe especificar al menos un horario válido con días seleccionados');
        setLoading(false);
        return;
      }      const horarioTrabajoBD = convertirHorarioFrontendaBD(horarios);
      
      // Ensure data types are correct before sending to the backend
      const dentistaData = {
        userId: userId ? String(userId) : '', // Ensure userId is a string
        especialidad: formData.especialidad?.trim() || "",
        horarioTrabajo: horarioTrabajoBD,
        status: formData.status || "activo",
        titulo: formData.titulo?.trim() || "",
        numeroColegiado: formData.numeroColegiado?.trim() || "",
        añosExperiencia: formData.añosExperiencia ? Number(formData.añosExperiencia) : undefined,
        biografia: formData.biografia?.trim() || ""
      };

      if (isEditMode && id) {
        await dentistaService.actualizarDentista(id, dentistaData);
        // addNotification('Dentista actualizado con éxito', 'success');
      } else {
        await dentistaService.crearDentista(dentistaData);
        // addNotification('Dentista creado con éxito', 'success');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dentistas');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar dentista:', error);
      const apiError = error as ApiError;
      
      // Handle different types of errors
      if (apiError.response?.status === 422 && apiError.response.data?.errors) {
        // Format validation errors
        console.log('Validation errors:', apiError.response.data.errors);
        
        // Process errors and set form field errors
        const validationErrors: FormErrors = {};
        apiError.response.data.errors.forEach((err: any) => {
          const fieldPath = err.campo.split('.');
          const fieldName = fieldPath[fieldPath.length - 1] as keyof FormErrors;
          
          if (fieldName === 'horarioTrabajo') {
            validationErrors.horarioTrabajo = err.mensaje;
          } else if (fieldName in formData) {
            validationErrors[fieldName as keyof FormErrors] = err.mensaje;
          }
        });
        
        setFormErrors(validationErrors);
        
        // Also set a general error message
        const errorMessages = apiError.response.data.errors
          .map((err: any) => `${err.mensaje} (${err.campo})`)
          .join('\n');
        setError(`Error de validación:\n${errorMessages}`);
      } else if (apiError.response?.data?.message) {
        setError(apiError.response.data.message);
      } else if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('No se pudo guardar la información del dentista. Verifica que el servidor esté corriendo en el puerto correcto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dentistas');
  };

  const handleHorarioChange = (index: number, field: keyof HorarioItem, value: any) => {
    const nuevosHorarios = [...horarios];
    if (field === 'dias') {
      nuevosHorarios[index][field] = value;
    } else {
      nuevosHorarios[index][field] = value;
    }
    setHorarios(nuevosHorarios);
    setFormData({
      ...formData,
      horarioTrabajo: JSON.stringify(nuevosHorarios, null, 2)
    });
  };

  const handleToggleDia = (horarioIndex: number, diaId: number) => {
    const nuevosHorarios = [...horarios];
    const diasActuales = nuevosHorarios[horarioIndex].dias;
    
    if (diasActuales.includes(diaId)) {
      nuevosHorarios[horarioIndex].dias = diasActuales.filter(d => d !== diaId);
    } else {
      nuevosHorarios[horarioIndex].dias = [...diasActuales, diaId].sort();
    }
    
    setHorarios(nuevosHorarios);
    setFormData({
      ...formData,
      horarioTrabajo: JSON.stringify(nuevosHorarios, null, 2)
    });
  };

  const agregarHorario = () => {
    setHorarios([...horarios, { inicio: '09:00', fin: '18:00', dias: [] }]);
  };

  const eliminarHorario = (index: number) => {
    const nuevosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(nuevosHorarios);
    setFormData({
      ...formData,
      horarioTrabajo: JSON.stringify(nuevosHorarios, null, 2)
    });
  };

  if (loadingDentista) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Volver a la lista
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Editar Dentista' : 'Nuevo Dentista'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Dentista guardado correctamente.
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Sección de usuario */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Información del Usuario
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {!isEditMode && (
                <Box sx={{ mb: 3 }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Tipo de registro</FormLabel>
                    <RadioGroup
                      row
                      value={isCreatingNewUser ? 'nuevo' : 'existente'}
                      onChange={(e) => setIsCreatingNewUser(e.target.value === 'nuevo')}
                    >
                      <FormControlLabel value="existente" control={<Radio />} label="Seleccionar usuario existente" />
                      <FormControlLabel value="nuevo" control={<Radio />} label="Crear nuevo usuario" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
            </Box>

            {!isCreatingNewUser ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ flexGrow: 1, minWidth: 300 }}>                  <Autocomplete
                    id="user-select"
                    options={availableUsers}
                    value={selectedUser}
                    onChange={handleUserChange}
                    getOptionLabel={(option) => option ? `${option.nombre} (${option.email})` : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    loading={loadingUsers}
                    renderOption={(props, option) => (
                      <li {...props} key={`user-${option.id}`}>
                        {`${option.nombre} (${option.email})`}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="userId"
                        label="Seleccionar Usuario"
                        error={!!formErrors.userId}
                        helperText={formErrors.userId}
                        required
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    disabled={isEditMode}
                  />
                </Box>

                {selectedUser && (
                  <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={selectedUser.avatar} sx={{ width: 56, height: 56 }}>
                          {selectedUser.nombre?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {selectedUser.nombre} {selectedUser.apellidos}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Email:</strong> {selectedUser.email || 'No especificado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Teléfono:</strong> {selectedUser.telefono || 'No especificado'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={nuevoUsuario.nombre}
                  onChange={handleNuevoUsuarioChange('nombre')}
                  error={!!formErrors.nuevoUsuario?.nombre}
                  helperText={formErrors.nuevoUsuario?.nombre || 'Ingrese el nombre completo (entre 2 y 100 caracteres)'}
                  required
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={nuevoUsuario.email}
                  onChange={handleNuevoUsuarioChange('email')}
                  error={!!formErrors.nuevoUsuario?.email}
                  helperText={formErrors.nuevoUsuario?.email}
                  required
                />
                <TextField                  fullWidth
                  label="Teléfono"
                  value={nuevoUsuario.telefono}
                  onChange={handleNuevoUsuarioChange('telefono')}
                  error={!!formErrors.nuevoUsuario?.telefono}
                  helperText={formErrors.nuevoUsuario?.telefono || 'Puede contener números, +, - y espacios'}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña"
                  value={nuevoUsuario.password}
                  onChange={handleNuevoUsuarioChange('password')}
                  error={!!formErrors.nuevoUsuario?.password}
                  helperText={formErrors.nuevoUsuario?.password || 'Mínimo 6 caracteres'} 
                  required
                  inputProps={{
                    minLength: 6
                  }}
                />
              </Box>
            )}

            {/* Sección de información profesional */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Profesional
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  required
                  label="Especialidad"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  error={!!formErrors.especialidad}
                  helperText={formErrors.especialidad}
                />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  required
                  label="Número de Colegiado"
                  name="numeroColegiado"
                  value={formData.numeroColegiado}
                  onChange={handleChange}
                  error={!!formErrors.numeroColegiado}
                  helperText={formErrors.numeroColegiado}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  required
                  label="Título"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  error={!!formErrors.titulo}
                  helperText={formErrors.titulo}
                />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  required
                  label="Años de Experiencia"
                  name="añosExperiencia"
                  type="number"
                  value={formData.añosExperiencia}
                  onChange={handleChange}
                  error={!!formErrors.añosExperiencia}
                  helperText={formErrors.añosExperiencia}
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <FormControl fullWidth error={!!formErrors.status} required>
                  <InputLabel id="status-label">Estado</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleChange as any}
                    label="Estado"
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                    <MenuItem value="vacaciones">Vacaciones</MenuItem>
                  </Select>
                  {formErrors.status && (
                    <FormHelperText>{formErrors.status}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Horario de Trabajo *
              </Typography>
              <FormHelperText error={!!formErrors.horarioTrabajo}>
                {formErrors.horarioTrabajo || 'Seleccione al menos un horario y días'}
              </FormHelperText>
              <Divider sx={{ mb: 2 }} />
            </Box>

            {horarios.map((horario, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      label="Hora de inicio"
                      value={dayjs(`2000-01-01T${horario.inicio}`)}
                      onChange={(newValue) => handleHorarioChange(index, 'inicio', newValue?.format('HH:mm') || '')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                    <TimePicker
                      label="Hora de fin"
                      value={dayjs(`2000-01-01T${horario.fin}`)}
                      onChange={(newValue) => handleHorarioChange(index, 'fin', newValue?.format('HH:mm') || '')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {diasSemana.map((dia) => (
                    <Chip
                      key={dia.id}
                      label={dia.nombre}
                      onClick={() => handleToggleDia(index, dia.id)}
                      color={horario.dias.includes(dia.id) ? "primary" : "default"}
                      variant={horario.dias.includes(dia.id) ? "filled" : "outlined"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            ))}

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleBack}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Guardando...
                  </>
                ) : isEditMode ? 'Actualizar' : 'Guardar'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default DentistaForm;
