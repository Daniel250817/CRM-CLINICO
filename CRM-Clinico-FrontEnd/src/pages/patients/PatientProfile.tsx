import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Tab, 
  Tabs,
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  MenuItem,
  useTheme,
  alpha,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  FolderSpecial as FolderIcon,
  MedicalInformation as MedicalIcon,
  Timeline as TimelineIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Cake as CakeIcon,
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  MedicalServices as HospitalIcon,
  EventAvailable as EventAvailableIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { clienteService, type Cliente, type TratamientoCliente } from '../../services/clienteService';
import { obtenerPerfilCompletoCliente, type DocumentoAPI, type TratamientoAPI } from '../../services/documentoService';
import { citaService, type Cita } from '../../services/citaService';

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
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [documentForm, setDocumentForm] = useState({
    nombre: "",
    tipo: "xray",
    archivo: null as File | null
  });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  
  // Estados para la obtención de datos de la API
  const [patientData, setPatientData] = useState<{
    cliente: Cliente;
    historialMedico?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Validación inicial del ID y redirección si es inválido
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('ID de paciente no válido');
      setLoading(false);
      // Redirigir a la lista de pacientes después de un breve delay
      const timer = setTimeout(() => {
        navigate('/patients/list');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [id, navigate]);
  
  // Cargar los datos del paciente desde la API
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!id || id === 'undefined' || id === 'null') {
        return;
      }
      
      try {
        setLoading(true);
        const data = await clienteService.obtenerPerfilCliente(id);
        if (!data) {
          throw new Error('No se encontró el paciente solicitado');
        }
        setPatientData({ cliente: data });
        setError(null);
      } catch (err) {
        console.error('Error al obtener el perfil del paciente:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`No se pudo cargar el perfil del paciente: ${errorMessage}`);
        // Redirigir a la lista de pacientes después de un breve delay en caso de error
        const timer = setTimeout(() => {
          navigate('/patients/list');
        }, 3000);
        return () => clearTimeout(timer);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientProfile();
  }, [id, navigate]);

  // Cargar las citas del paciente
  useEffect(() => {
    const fetchCitas = async () => {
      if (!id) return;
      
      try {
        setLoadingCitas(true);
        const citasData = await citaService.obtenerCitasCliente(id);
        setCitas(citasData);
        
        // Encontrar la próxima cita (primera cita futura)
        const now = new Date();
        const citasFuturas = citasData
          .filter(cita => new Date(cita.fechaHora) > now)
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        
        setProximaCita(citasFuturas.length > 0 ? citasFuturas[0] : null);
        setErrorCitas(null);
      } catch (err) {
        console.error('Error al cargar las citas:', err);
        setErrorCitas('No se pudieron cargar las citas');
      } finally {
        setLoadingCitas(false);
      }
    };

    fetchCitas();
  }, [id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMedicalDialogOpen = () => {
    setOpenMedicalDialog(true);
  };

  const handleMedicalDialogClose = () => {
    setOpenMedicalDialog(false);
  };

  const handleMedicalNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMedicalNotes(e.target.value);
  };

  const handleSaveMedicalNotes = async () => {
    if (!id || !patientData) return;

    try {
      // Actualizar historial médico del cliente
      await clienteService.actualizarCliente(id, {
        usuario: {
          ...patientData.cliente.usuario,
          fechaNacimiento: patientData.cliente.usuario.fechaNacimiento 
            ? patientData.cliente.usuario.fechaNacimiento.toISOString()
            : null
        },
        direccion: patientData.cliente.direccion || null,
        ciudad: patientData.cliente.ciudad || null,
        codigoPostal: patientData.cliente.codigoPostal || null,
        ocupacion: patientData.cliente.ocupacion || null,
        estadoCivil: patientData.cliente.estadoCivil || null,
        contactoEmergencia: patientData.cliente.contactoEmergencia || null,
        historialMedico: {
          ...patientData.cliente.historialMedico,
          alergias: patientData.cliente.historialMedico?.alergias || null,
          enfermedadesCronicas: patientData.cliente.historialMedico?.enfermedadesCronicas || null,
          medicamentosActuales: patientData.cliente.historialMedico?.medicamentosActuales || null,
          cirugiasPrevias: medicalNotes || null
        }
      });

      // Actualizar estado local
      setPatientData({
        ...patientData,
        historialMedico: {
          ...patientData.cliente.historialMedico,
          history: medicalNotes
        }
      });

      handleMedicalDialogClose();
    } catch (err) {
      console.error('Error al guardar el historial médico:', err);
      // Mostrar mensaje de error
    }
  };

  const handleDocumentFormChange = (field: string, value: string | File | null) => {
    setDocumentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patientData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No se encontró el paciente solicitado'}</Alert>
      </Box>
    );
  }

  const { cliente } = patientData;

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Cabecera del Perfil */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          color: 'white',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            alignItems: 'center'
          }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid white',
                  boxShadow: theme.shadows[3]
                }}
              >
                {cliente.usuario.nombre.charAt(0)}
              </Avatar>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {cliente.usuario.nombre}
              </Typography>
              <Stack direction="row" spacing={2}>
                {loadingCitas ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : proximaCita ? (
                  <Chip
                    icon={<EventAvailableIcon />}
                    label={`Próxima cita: ${new Date(proximaCita.fechaHora).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}`}
                    sx={{ bgcolor: alpha(theme.palette.common.white, 0.9), color: theme.palette.primary.main }}
                  />
                ) : (
                  <Chip
                    icon={<EventAvailableIcon />}
                    label="Sin citas programadas"
                    sx={{ bgcolor: alpha(theme.palette.common.white, 0.9), color: theme.palette.primary.main }}
                  />
                )}
              </Stack>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/patients/${id}/edit`)}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9)
                  }
                }}
              >
                Editar Perfil
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Información Rápida */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        mb: 3
      }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 16px)' } }}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Información de Contacto
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Teléfono"
                    secondary={cliente.usuario.telefono || 'No especificado'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email"
                    secondary={cliente.usuario.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Dirección"
                    secondary={cliente.direccion || 'No especificada'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 16px)' } }}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Información Personal
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CakeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fecha de Nacimiento"
                    secondary={cliente.usuario.fechaNacimiento?.toLocaleDateString() || 'No especificada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ocupación"
                    secondary={cliente.ocupacion || 'No especificada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FavoriteIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Estado Civil"
                    secondary={cliente.estadoCivil || 'No especificado'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 16px)' } }}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Información Médica Relevante
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <HospitalIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Alergias"
                    secondary={cliente.historialMedico?.alergias || 'Ninguna registrada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MedicalIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Enfermedades Crónicas"
                    secondary={cliente.historialMedico?.enfermedadesCronicas || 'Ninguna registrada'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HospitalIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Medicamentos Actuales"
                    secondary={cliente.historialMedico?.medicamentosActuales || 'Ninguno registrado'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Pestañas de Contenido */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.9rem'
            }
          }}
        >
          <Tab 
            icon={<CalendarIcon />} 
            label="Citas" 
            iconPosition="start"
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="Tratamientos" 
            iconPosition="start"
          />
          <Tab 
            icon={<FolderIcon />} 
            label="Documentos" 
            iconPosition="start"
          />
          <Tab 
            icon={<MedicalIcon />} 
            label="Historial Médico" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Pagos" 
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {/* Contenido de Citas */}
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Próximas Citas</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/appointments/new?patientId=${id}`)}
                  >
                    Nueva Cita
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Hora</TableCell>
                        <TableCell>Dentista</TableCell>
                        <TableCell>Tratamiento</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Mapear citas aquí */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Contenido de Tratamientos */}
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Tratamientos Activos</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {/* Manejar nuevo tratamiento */}}
                  >
                    Nuevo Tratamiento
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {/* Mapear tratamientos aquí */}
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Contenido de Documentos */}
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Documentos del Paciente</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDocumentDialog(true)}
                  >
                    Nuevo Documento
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {/* Mapear documentos aquí */}
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Contenido de Historial Médico */}
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Historial Médico Detallado</Typography>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleMedicalDialogOpen}
                  >
                    Actualizar Historial
                  </Button>
                </Box>
                <Grid container spacing={3}>
                  {/* Contenido del historial médico */}
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {/* Contenido de Pagos */}
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Historial de Pagos</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Mapear pagos aquí */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </Paper>

      {/* Diálogos existentes */}
      {/* ... mantener los diálogos existentes ... */}
    </Box>
  );
};

export default PatientProfile;
