import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid as MuiGrid,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { useNotification } from '../../contexts/NotificationContext';
import { clienteService, type ActualizarClienteDTO } from '../../services/clienteService';

interface FormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: Dayjs | null;
  genero: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  ocupacion: string;
  estadoCivil: string;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
  historialMedico: {
    alergias: string;
    enfermedadesCronicas: string;
    medicamentosActuales: string;
    cirugiasPrevias: string;
  };
}

const Grid = MuiGrid as any; // Temporal fix para los errores de tipado

const PatientEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    fechaNacimiento: null,
    genero: 'prefiero no decir',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    ocupacion: '',
    estadoCivil: '',
    contactoEmergencia: {
      nombre: '',
      telefono: '',
      relacion: ''
    },
    historialMedico: {
      alergias: '',
      enfermedadesCronicas: '',
      medicamentosActuales: '',
      cirugiasPrevias: ''
    }
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validatePhone = (phone: string, field: string) => {
    const phoneRegex = /^[0-9]{8,9}$/;
    if (!phoneRegex.test(phone)) {
      setErrors(prev => ({
        ...prev,
        [field]: 'El teléfono debe contener solo números y tener entre 8 y 9 dígitos'
      }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    return true;
  };

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await clienteService.obtenerPerfilCliente(id);
        
        // Convertir los datos del paciente al formato del formulario
        setFormData({
          nombre: data.usuario.nombre,
          apellidos: data.usuario.apellidos,
          email: data.usuario.email,
          telefono: data.usuario.telefono,
          fechaNacimiento: data.usuario.fechaNacimiento ? dayjs(data.usuario.fechaNacimiento) : null,
          genero: data.usuario.genero || 'prefiero no decir',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
          codigoPostal: data.codigoPostal || '',
          ocupacion: data.ocupacion || '',
          estadoCivil: data.estadoCivil || '',
          contactoEmergencia: data.contactoEmergencia || {
            nombre: '',
            telefono: '',
            relacion: ''
          },
          historialMedico: {
            alergias: data.historialMedico?.alergias || '',
            enfermedadesCronicas: data.historialMedico?.enfermedadesCronicas || '',
            medicamentosActuales: data.historialMedico?.medicamentosActuales || '',
            cirugiasPrevias: data.historialMedico?.cirugiasPrevias || ''
          }
        });
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del paciente:', err);
        setError('No se pudieron cargar los datos del paciente. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const handleInputChange = (field: string, value: string | Dayjs | null) => {
    const fields = field.split('.');
    if (fields.length === 1) {
      // Si es el campo teléfono, validar que solo sean números
      if (field === 'telefono') {
        // Remover cualquier caracter que no sea número
        const numericValue = (value?.toString() || '').replace(/[^0-9]/g, '');
        setFormData(prev => ({
          ...prev,
          [field]: numericValue
        }));
        validatePhone(numericValue, field);
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else {
      // Para campos anidados como contactoEmergencia.telefono
      if (fields[1] === 'telefono') {
        const numericValue = (value?.toString() || '').replace(/[^0-9]/g, '');
        setFormData(prev => {
          const fieldKey = fields[0] as keyof FormData;
          const subField = fields[1];
          const currentValue = prev[fieldKey] as Record<string, any>;
          
          return {
            ...prev,
            [fieldKey]: {
              ...currentValue,
              [subField]: numericValue
            }
          };
        });
        validatePhone(numericValue, `${fields[0]}.${fields[1]}`);
      } else {
        setFormData(prev => {
          const fieldKey = fields[0] as keyof FormData;
          const subField = fields[1];
          const currentValue = prev[fieldKey] as Record<string, any>;
          
          return {
            ...prev,
            [fieldKey]: {
              ...currentValue,
              [subField]: value
            }
          };
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validar teléfonos
    if (!validatePhone(formData.telefono, 'telefono') || 
        (formData.contactoEmergencia.telefono && 
         !validatePhone(formData.contactoEmergencia.telefono, 'contactoEmergencia.telefono'))) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const datosActualizados: ActualizarClienteDTO = {
        usuario: {
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          fechaNacimiento: formData.fechaNacimiento?.format('YYYY-MM-DD') || null,
          genero: formData.genero
        },
        direccion: formData.direccion.trim() || '',
        ciudad: formData.ciudad.trim() || '',
        codigoPostal: formData.codigoPostal.trim() || '',
        ocupacion: formData.ocupacion.trim() || '',
        estadoCivil: formData.estadoCivil || '',
        contactoEmergencia: {
          nombre: formData.contactoEmergencia.nombre.trim() || '',
          telefono: formData.contactoEmergencia.telefono.trim() || '',
          relacion: formData.contactoEmergencia.relacion.trim() || ''
        },
        historialMedico: {
          alergias: formData.historialMedico.alergias.trim() || '',
          enfermedadesCronicas: formData.historialMedico.enfermedadesCronicas.trim() || '',
          medicamentosActuales: formData.historialMedico.medicamentosActuales.trim() || '',
          cirugiasPrevias: formData.historialMedico.cirugiasPrevias.trim() || ''
        }
      };

      await clienteService.actualizarCliente(id, datosActualizados);
      addNotification('Paciente actualizado exitosamente', 'success');
      navigate(`/patients/${id}`);
    } catch (err: any) {
      console.error('Error al actualizar paciente:', err);
      
      if (err.response?.status === 422) {
        const errorData = err.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((error: any) => {
            if (error.field === 'email') {
              return error.message;
            }
            return `${error.message} (${error.field})`;
          }).join('\n');
          setError(errorMessages);
          addNotification(errorMessages, 'error');
        } else {
          const errorMessage = errorData.message || 'Error al actualizar el paciente. Por favor, revise los datos ingresados.';
          setError(errorMessage);
          addNotification(errorMessage, 'error');
        }
      } else {
        const errorMessage = 'Error al actualizar el paciente. Por favor, intente nuevamente.';
        setError(errorMessage);
        addNotification(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.nombre) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Editar Paciente
      </Typography>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Información Personal */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Información Personal
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Apellidos"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      type="email"
                      label="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Teléfono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      error={!!errors.telefono}
                      helperText={errors.telefono}
                      inputProps={{
                        maxLength: 9,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha de Nacimiento"
                        value={formData.fechaNacimiento}
                        onChange={(date) => handleInputChange('fechaNacimiento', date)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Género</FormLabel>
                      <RadioGroup
                        row
                        value={formData.genero}
                        onChange={(e) => handleInputChange('genero', e.target.value)}
                      >
                        <FormControlLabel value="masculino" control={<Radio />} label="Masculino" />
                        <FormControlLabel value="femenino" control={<Radio />} label="Femenino" />
                        <FormControlLabel value="otro" control={<Radio />} label="Otro" />
                        <FormControlLabel value="prefiero no decir" control={<Radio />} label="Prefiero no decir" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Información de Contacto */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Información de Contacto
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dirección"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ciudad"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Código Postal"
                      value={formData.codigoPostal}
                      onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ocupación"
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Estado Civil"
                      value={formData.estadoCivil}
                      onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                      size="medium"
                      sx={{
                        '& .MuiInputBase-root': {
                          height: '56px'
                        }
                      }}
                    >
                      <MenuItem value="">Seleccionar</MenuItem>
                      <MenuItem value="soltero">Soltero/a</MenuItem>
                      <MenuItem value="casado">Casado/a</MenuItem>
                      <MenuItem value="divorciado">Divorciado/a</MenuItem>
                      <MenuItem value="viudo">Viudo/a</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contacto de Emergencia */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Contacto de Emergencia
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre del Contacto"
                      value={formData.contactoEmergencia.nombre}
                      onChange={(e) => handleInputChange('contactoEmergencia.nombre', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono del Contacto"
                      value={formData.contactoEmergencia.telefono}
                      onChange={(e) => handleInputChange('contactoEmergencia.telefono', e.target.value)}
                      error={!!errors['contactoEmergencia.telefono']}
                      helperText={errors['contactoEmergencia.telefono'] || 'Ingrese 8 dígitos numéricos'}
                      inputProps={{
                        maxLength: 8,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Relación con el Paciente"
                      value={formData.contactoEmergencia.relacion}
                      onChange={(e) => handleInputChange('contactoEmergencia.relacion', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Historial Médico */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Historial Médico
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Alergias"
                      value={formData.historialMedico.alergias}
                      onChange={(e) => handleInputChange('historialMedico.alergias', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Enfermedades Crónicas"
                      value={formData.historialMedico.enfermedadesCronicas}
                      onChange={(e) => handleInputChange('historialMedico.enfermedadesCronicas', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Medicamentos Actuales"
                      value={formData.historialMedico.medicamentosActuales}
                      onChange={(e) => handleInputChange('historialMedico.medicamentosActuales', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Cirugías Previas"
                      value={formData.historialMedico.cirugiasPrevias}
                      onChange={(e) => handleInputChange('historialMedico.cirugiasPrevias', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Botones */}
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/patients/${id}`)}
              disabled={loading}
              size="large"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
              size="large"
            >
              Guardar Cambios
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PatientEdit;