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
  Visibility as VisibilityIcon,
  Cake as CakeIcon,
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  MedicalServices as HospitalIcon,
  EventAvailable as EventAvailableIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { clienteService, type Cliente, type TratamientoCliente } from '../../services/clienteService';
import { obtenerPerfilCompletoCliente, type DocumentoAPI, type TratamientoAPI, documentoService } from '../../services/documentoService';
import { api } from '../../services/api';
import { citaService, type Cita } from '../../services/citaService';
import { useNotification } from '../../contexts/NotificationContext';

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
  const { addNotification } = useNotification();
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
  const [documentos, setDocumentos] = useState<DocumentoAPI[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentoAPI | null>(null);
  const [editDocumentForm, setEditDocumentForm] = useState<{ nombre: string; archivo: File | null }>({ nombre: '', archivo: null });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  
  // Estados para la obtención de datos de la API
  const [patientData, setPatientData] = useState<{
    // Placeholder for future changes
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

  // Cargar documentos del paciente
  useEffect(() => {
    const fetchDocumentos = async () => {
      if (!id) return;
      try {
        setLoadingDocumentos(true);
        const docs = await documentoService.obtenerDocumentosCliente(id);
        // Normalizar rutas: si la ruta es relativa (/uploads/...) la convertimos a URL absoluta usando la baseURL del api
        const normalized = (docs || []).map(d => {
          try {
            // Si ya es una URL absoluta, dejarla
            const isAbsolute = /^(https?:)?\/\//i.test(d.ruta);
            if (isAbsolute) return d;

            // Construir URL absoluta usando la base del cliente API
            let base = api?.baseURL || '';
            // Si la base incluye el prefijo '/api', lo removemos para apuntar al host raíz donde se sirven los uploads
            base = base.replace(/\/api\/?$/, '');
            const baseNoSlash = base.replace(/\/$/, '');
            const ruta = d.ruta?.startsWith('/') ? `${baseNoSlash}${d.ruta}` : `${baseNoSlash}/${d.ruta}`;
            return { ...d, ruta };
          } catch (err) {
            console.warn('No se pudo normalizar la ruta del documento', d, err);
            return d;
          }
        });

        setDocumentos(normalized);
        setErrorDocumentos(null);
      } catch (err) {
        console.error('Error al cargar documentos:', err);
        setDocumentos([]);
        setErrorDocumentos('No se pudieron cargar los documentos');
      } finally {
        setLoadingDocumentos(false);
      }
    };

    fetchDocumentos();
  }, [id, openDocumentDialog]);

  // Cargar las citas del paciente
  useEffect(() => {
    const fetchCitas = async () => {
      // Validar que el ID sea válido antes de hacer la petición
      if (!id || id === 'undefined' || id === 'null') {
        setErrorCitas('ID de paciente no válido para cargar citas');
        setLoadingCitas(false);
        return;
      }
      
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
      await clienteService.actualizarCliente(id, {
        usuario: {
          ...patientData.cliente.usuario,
          fechaNacimiento: patientData.cliente.usuario.fechaNacimiento 
            ? patientData.cliente.usuario.fechaNacimiento.toISOString()
            : null
        },
        direccion: patientData.cliente.direccion || '',
        ciudad: patientData.cliente.ciudad || '',
        codigoPostal: patientData.cliente.codigoPostal || '',
        ocupacion: patientData.cliente.ocupacion || '',
        estadoCivil: patientData.cliente.estadoCivil || '',
        contactoEmergencia: patientData.cliente.contactoEmergencia || {
          nombre: '',
          telefono: '',
          relacion: ''
        },
        historialMedico: {
          alergias: patientData.cliente.historialMedico?.alergias || '',
          enfermedadesCronicas: patientData.cliente.historialMedico?.enfermedadesCronicas || '',
          medicamentosActuales: patientData.cliente.historialMedico?.medicamentosActuales || '',
          cirugiasPrevias: medicalNotes || ''
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
      // TODO: Mostrar mensaje de error al usuario
      addNotification('Error al guardar el historial médico', 'error');
    }
  };

  const handleDocumentFormChange = (field: string, value: string | File | null) => {
    setDocumentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentDialogClose = () => {
    setOpenDocumentDialog(false);
    setDocumentForm({ nombre: '', tipo: 'xray', archivo: null });
  };

  const handleUploadDocument = async () => {
    if (!id) return;
    if (!documentForm.archivo) {
      addNotification('Selecciona un archivo para subir', 'warning');
      return;
    }

    try {
      await documentoService.subirDocumento(id, documentForm.archivo, documentForm.tipo, documentForm.nombre || undefined);
      addNotification('Documento subido correctamente', 'success');
      // Refrescar lista de documentos
      const docs = await documentoService.obtenerDocumentosCliente(id);
      setDocumentos(docs || []);
      handleDocumentDialogClose();
    } catch (err) {
      console.error('Error al subir documento:', err);
      addNotification('Error al subir documento', 'error');
    }
  };

  const handleOpenPreview = (url: string) => {
    console.debug('Opening preview for URL:', url);
    setPreviewUrl(url || null);
    setPreviewOpen(true);
  };

  const handleOpenEditDocument = (doc: DocumentoAPI) => {
    setEditingDocument(doc);
    setEditDocumentForm({ nombre: doc.nombre || '', archivo: null });
  };

  const handleEditDocumentChange = (field: 'nombre' | 'archivo', value: string | File | null) => {
    setEditDocumentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseEditDocument = () => {
    setEditingDocument(null);
    setEditDocumentForm({ nombre: '', archivo: null });
  };

  const handleSaveEditDocument = async () => {
    if (!editingDocument) return;
    try {
      const updated = await documentoService.actualizarDocumento(editingDocument.id, editDocumentForm.archivo, editDocumentForm.nombre || undefined);
      addNotification('Documento actualizado correctamente', 'success');
      // Refrescar lista de documentos
      const docs = await documentoService.obtenerDocumentosCliente(id || '');
      setDocumentos(docs || []);
      handleCloseEditDocument();
    } catch (err) {
      console.error('Error al actualizar documento:', err);
      addNotification('Error al actualizar el documento', 'error');
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
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
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contacto de Emergencia"
                    secondary={
                      cliente.contactoEmergencia?.telefono
                        ? `${cliente.contactoEmergencia.nombre} (${cliente.contactoEmergencia.relacion}) - ${cliente.contactoEmergencia.telefono}`
                        : 'No especificado'
                    }
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
                  {loadingDocumentos && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    </Grid>
                  )}
                  {errorDocumentos && (
                    <Grid item xs={12}>
                      <Alert severity="error">{errorDocumentos}</Alert>
                    </Grid>
                  )}
                  {!loadingDocumentos && documentos.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No hay documentos.</Typography>
                    </Grid>
                  )}
                  {documentos.map(doc => (
                    <Grid item key={doc.id} xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1">{doc.nombre}</Typography>
                              <Typography variant="body2" color="text.secondary">{new Date(doc.fechaCreacion).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                              <IconButton onClick={() => handleOpenPreview(doc.ruta)}>
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton onClick={() => handleOpenEditDocument(doc)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton component="a" href={doc.ruta} target="_blank" rel="noopener">
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>


          <TabPanel value={tabValue} index={3}>
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
          {/* Dialogo para subir documentos (radiografías, imágenes) */}
          <Dialog open={openDocumentDialog} onClose={handleDocumentDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>Nuevo Documento</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Nombre"
                  value={documentForm.nombre}
                  onChange={(e) => handleDocumentFormChange('nombre', e.target.value)}
                  fullWidth
                />

                <TextField
                  select
                  label="Tipo"
                  value={documentForm.tipo}
                  onChange={(e) => handleDocumentFormChange('tipo', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="xray">Radiografía</MenuItem>
                  <MenuItem value="document">Documento</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                </TextField>

                <Button variant="outlined" component="label">
                  {documentForm.archivo ? 'Cambiar archivo' : 'Seleccionar archivo'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      handleDocumentFormChange('archivo', f);
                    }}
                  />
                </Button>
                {documentForm.archivo && (
                  <Typography variant="body2">Seleccionado: {documentForm.archivo.name}</Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDocumentDialogClose}>Cancelar</Button>
              <Button variant="contained" onClick={handleUploadDocument}>Subir</Button>
            </DialogActions>
          </Dialog>
          {/* Dialog para editar documento */}
          <Dialog open={!!editingDocument} onClose={handleCloseEditDocument} fullWidth maxWidth="sm">
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Nombre"
                  value={editDocumentForm.nombre}
                  onChange={(e) => handleEditDocumentChange('nombre', e.target.value)}
                  fullWidth
                />

                <Button variant="outlined" component="label">
                  {editDocumentForm.archivo ? 'Cambiar archivo' : 'Seleccionar nuevo archivo'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      handleEditDocumentChange('archivo', f);
                    }}
                  />
                </Button>
                {editDocumentForm.archivo && (
                  <Typography variant="body2">Seleccionado: {editDocumentForm.archivo.name}</Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDocument}>Cancelar</Button>
              <Button variant="contained" onClick={handleSaveEditDocument}>Guardar</Button>
            </DialogActions>
          </Dialog>
          {/* Dialog para previsualizar documentos */}
          <Dialog open={previewOpen} onClose={handleClosePreview} fullWidth maxWidth="lg">
            <DialogTitle>Previsualización</DialogTitle>
            <DialogContent>
              {previewUrl ? (
                previewUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewUrl} title="preview" style={{ width: '100%', height: '70vh', border: 'none' }} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                  </Box>
                )
              ) : (
                <Typography variant="body2" color="text.secondary">No hay vista previa disponible para este documento.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePreview}>Cerrar</Button>
              {previewUrl && (
                <Button component="a" href={previewUrl} target="_blank" rel="noopener" variant="contained">Descargar</Button>
              )}
            </DialogActions>
          </Dialog>
    </Box>
  );
};

export default PatientProfile;
