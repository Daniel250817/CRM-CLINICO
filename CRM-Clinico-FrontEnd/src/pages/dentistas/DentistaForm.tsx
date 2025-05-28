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
  apellidos: string;
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
  biografia?: string;
  nuevoUsuario?: {
    nombre?: string;
    apellidos?: string;
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
    data?: {
      message?: string;
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
        horarioBD[diaNombre].push({
          inicio: horario.inicio,
          fin: horario.fin
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
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuarioFields>({
    nombre: '',
    apellidos: '',
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
            !dentistaUserIds.includes(user.id) || user.id === currentUserId
          );
          
          console.log('Usuario actual ID:', currentUserId);
          console.log('Usuarios disponibles en edición:', usersAvailable.length);
          setAvailableUsers(usersAvailable);
        } else {
          const dentistas = await dentistaService.obtenerDentistas();
          const dentistaUserIds = dentistas.map(dentista => dentista.userId);
          console.log('UserIDs ya asignados a dentistas:', dentistaUserIds);
          
          const usersAvailable = allUsers.filter(user => !dentistaUserIds.includes(user.id));
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
    
    if (!formData.userId) {
      errors.userId = 'Debe seleccionar un usuario';
    }
    
    if (!formData.especialidad.trim()) {
      errors.especialidad = 'La especialidad es requerida';
    }
    
    try {
      if (formData.horarioTrabajo) {
        JSON.parse(formData.horarioTrabajo);
      }
    } catch (e) {
      errors.horarioTrabajo = 'El formato del horario es inválido';
    }
    
    if (!formData.status) {
      errors.status = 'El estado es requerido';
    }
    
    // Validar que años de experiencia sea un número
    if (formData.añosExperiencia && isNaN(Number(formData.añosExperiencia))) {
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
      userId: newValue?.id || ''
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
    
    if (!nuevoUsuario.nombre) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!nuevoUsuario.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(nuevoUsuario.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!nuevoUsuario.password) {
      errors.password = 'La contraseña es requerida';
    } else if (nuevoUsuario.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (nuevoUsuario.telefono && !/^[0-9]{8}$/.test(nuevoUsuario.telefono)) {
      errors.telefono = 'El teléfono debe tener 8 dígitos';
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
      let userId = formData.userId;
      
      if (isCreatingNewUser) {
        const nuevoUsuarioData = {
          ...nuevoUsuario,
          rol: 'dentista' as const,
          estado: 'activo' as const
        };
        
        const usuarioCreado = await usuarioService.crearUsuario(nuevoUsuarioData);
        userId = usuarioCreado.id;
      }

      // Validar que haya al menos un horario válido
      const horariosValidos = horarios.some(h => 
        h.inicio && h.fin && h.dias && h.dias.length > 0
      );

      if (!horariosValidos) {
        setError('Debe especificar al menos un horario válido con días seleccionados');
        setLoading(false);
        return;
      }

      const horarioTrabajoBD = convertirHorarioFrontendaBD(horarios);

      // Validar que el horario convertido no esté vacío
      if (Object.keys(horarioTrabajoBD).length === 0) {
        setError('El horario de trabajo no puede estar vacío');
        setLoading(false);
        return;
      }

      const dentistaData: DentistaCreacionDatos = {
        userId: userId.toString(),
        especialidad: formData.especialidad.trim(),
        horarioTrabajo: horarioTrabajoBD,
        status: formData.status,
        titulo: formData.titulo?.trim() || undefined,
        numeroColegiado: formData.numeroColegiado?.trim() || undefined,
        añosExperiencia: formData.añosExperiencia ? parseInt(formData.añosExperiencia) : undefined,
        biografia: formData.biografia?.trim() || undefined
      };

      // Agregar logs para debugging
      console.log('Enviando datos al backend:', {
        url: `${config.API_BASE_URL}/dentistas`,
        data: dentistaData,
        horarioTrabajo: horarioTrabajoBD
      });
      
      if (isEditMode && id) {
        await dentistaService.actualizarDentista(id, dentistaData);
      } else {
        await dentistaService.crearDentista(dentistaData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dentistas');
      }, 1500);
      
    } catch (error) {
      console.error('Error al guardar dentista:', error);
      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
        setError(apiError.response.data.message);
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
                <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                  <Autocomplete
                    id="user-select"
                    options={availableUsers}
                    value={selectedUser}
                    onChange={handleUserChange}
                    getOptionLabel={(option) => `${option.nombre} (${option.email})`}
                    loading={loadingUsers}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={nuevoUsuario.nombre}
                  onChange={handleNuevoUsuarioChange('nombre')}
                  error={!!formErrors.nuevoUsuario?.nombre}
                  helperText={formErrors.nuevoUsuario?.nombre}
                  required
                />
                <TextField
                  fullWidth
                  label="Apellidos"
                  value={nuevoUsuario.apellidos}
                  onChange={handleNuevoUsuarioChange('apellidos')}
                  error={!!formErrors.nuevoUsuario?.apellidos}
                  helperText={formErrors.nuevoUsuario?.apellidos}
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
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={nuevoUsuario.telefono}
                  onChange={handleNuevoUsuarioChange('telefono')}
                  error={!!formErrors.nuevoUsuario?.telefono}
                  helperText={formErrors.nuevoUsuario?.telefono}
                  placeholder="Ejemplo: 12345678"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña"
                  value={nuevoUsuario.password}
                  onChange={handleNuevoUsuarioChange('password')}
                  error={!!formErrors.nuevoUsuario?.password}
                  helperText={formErrors.nuevoUsuario?.password}
                  required
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

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Título"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Número de Colegiado"
                  name="numeroColegiado"
                  value={formData.numeroColegiado}
                  onChange={handleChange}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Años de Experiencia"
                  name="añosExperiencia"
                  value={formData.añosExperiencia}
                  onChange={handleChange}
                  error={!!formErrors.añosExperiencia}
                  helperText={formErrors.añosExperiencia}
                />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Biografía"
                  name="biografia"
                  value={formData.biografia}
                  onChange={handleChange}
                />
              </Box>
            </Box>

            {/* Sección de horario */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Horario de Trabajo
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Horario</TableCell>
                        <TableCell>Días</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {horarios.map((horario, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <TimePicker
                                label="Hora inicio"
                                value={dayjs(`2024-01-01T${horario.inicio}`)}
                                onChange={(newValue) => {
                                  if (newValue) {
                                    handleHorarioChange(index, 'inicio', newValue.format('HH:mm'));
                                  }
                                }}
                              />
                              <Typography>-</Typography>
                              <TimePicker
                                label="Hora fin"
                                value={dayjs(`2024-01-01T${horario.fin}`)}
                                onChange={(newValue) => {
                                  if (newValue) {
                                    handleHorarioChange(index, 'fin', newValue.format('HH:mm'));
                                  }
                                }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="error" 
                              onClick={() => eliminarHorario(index)}
                              disabled={horarios.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LocalizationProvider>
              
              <Button
                startIcon={<AddIcon />}
                onClick={agregarHorario}
                variant="outlined"
                size="small"
              >
                Agregar Horario
              </Button>
            </Box>

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
