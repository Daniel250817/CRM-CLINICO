import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { Dayjs } from 'dayjs';
import { useNotification } from '../../contexts/NotificationContext';
import { clienteService } from '../../services/clienteService';
import type { RegistroClienteDTO } from '../../services/clienteService';

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

const PatientRegistration = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    fechaNacimiento: null,
    genero: 'no_especificado',
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

  const handleInputChange = (field: string, value: string | Dayjs | null) => {
    const fields = field.split('.');
    if (fields.length === 1) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (fields[0] === 'contactoEmergencia') {
      setFormData(prev => ({
        ...prev,
        contactoEmergencia: {
          ...prev.contactoEmergencia,
          [fields[1]]: value
        }
      }));
    } else if (fields[0] === 'historialMedico') {
      setFormData(prev => ({
        ...prev,
        historialMedico: {
          ...prev.historialMedico,
          [fields[1]]: value
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate emergency contact phone if provided
    if (formData.contactoEmergencia.telefono.trim()) {
      // Basic phone validation - 8 digits
      const phonePattern = /^\d{8}$/;
      if (!phonePattern.test(formData.contactoEmergencia.telefono.trim().replace(/\D/g, ''))) {
        setError('El teléfono de contacto de emergencia debe contener exactamente 8 dígitos numéricos.');
        return;
      }
    }
    
    setLoading(true);
    setError(null);

    try {
      // Convertir Dayjs a formato YYYY-MM-DD para el API
      const fechaNacimiento = formData.fechaNacimiento?.format('YYYY-MM-DD') || null;
      
      const registroData: RegistroClienteDTO = {
        usuario: {
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          fechaNacimiento,
          genero: formData.genero || 'no_especificado'
        },
        direccion: formData.direccion.trim() || '',
        ciudad: formData.ciudad.trim() || '',
        codigoPostal: formData.codigoPostal.trim() || '',
        ocupacion: formData.ocupacion.trim() || '',
        estadoCivil: formData.estadoCivil || '',
        // Siempre enviar telefonoEmergencia como string vacío si no hay valor
        telefonoEmergencia: formData.contactoEmergencia.telefono.trim() || '',
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

      try {
      const nuevoCliente = await clienteService.registrarCliente(registroData);
      addNotification('Paciente registrado exitosamente', 'success');
      navigate(`/patients/${nuevoCliente.id}`);
      } catch (err: any) {
      console.error('Error al registrar paciente:', err);
        
        // Manejar errores de validación
        if (err.response?.status === 422) {
          const errores = err.response.data.errors;
          let mensajeError = 'Por favor corrija los siguientes errores:';
          
          if (Array.isArray(errores)) {
            errores.forEach(error => {
              mensajeError += `\n- ${error.mensaje} (${error.campo})`;
            });
          } else {
            mensajeError = err.response.data.message || 'Error de validación en los datos';
          }
          
          setError(mensajeError);
        } else {
          // Otros tipos de errores
          const errorMessage = err.response?.data?.message || err.message || 'Error al registrar el paciente';
          setError(errorMessage);
        }
        
        addNotification('Error al registrar paciente', 'error');
      }
    } catch (err: any) {
      console.error('Error al procesar el formulario:', err);
      setError('Error al procesar el formulario. Por favor, revise los datos ingresados.');
      addNotification('Error al procesar el formulario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Registro de Nuevo Paciente
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
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha de Nacimiento"
                        value={formData.fechaNacimiento}
                        onChange={(date) => handleInputChange('fechaNacimiento', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Género</FormLabel>
                      <RadioGroup
                        row
                        value={formData.genero}
                        onChange={(e) => handleInputChange('genero', e.target.value)}
                      >
                        <FormControlLabel value="masculino" control={<Radio />} label="Masculino" />
                        <FormControlLabel value="femenino" control={<Radio />} label="Femenino" />
                        <FormControlLabel value="no_especificado" control={<Radio />} label="No especificar" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dirección */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Dirección
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Información Adicional */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Información Adicional
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ocupación"
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <FormLabel sx={{ mb: 1, fontSize: '1rem', color: 'text.primary' }}>
                        Estado Civil
                      </FormLabel>
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
                    </FormControl>
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
                      helperText="Debe contener exactamente 8 dígitos numéricos"
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
              onClick={() => navigate('/patients')}
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
              Registrar Paciente
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PatientRegistration; 