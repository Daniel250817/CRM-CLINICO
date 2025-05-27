import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  MenuItem
} from '@mui/material';
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
  Delete as DeleteIcon
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
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  
  // Estados para la obtención de datos de la API
  const [patientData, setPatientData] = useState<{
    cliente: Cliente;
    tratamientos: TratamientoAPI[];
    documentos: DocumentoAPI[];
    historialMedico?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar los datos del paciente desde la API
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await obtenerPerfilCompletoCliente(id);
        setPatientData(data);
        setMedicalNotes(data.historialMedico?.history || "");
        setError(null);
      } catch (err) {
        console.error('Error al obtener el perfil del paciente:', err);
        setError('No se pudo cargar el perfil del paciente. Por favor, intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientProfile();
  }, [id]);

  // Cargar las citas del paciente
  useEffect(() => {
    const fetchCitas = async () => {
      if (!id) return;
      
      try {
        setLoadingCitas(true);
        const citasData = await citaService.obtenerCitasCliente(id);
        setCitas(citasData);
        setErrorCitas(null);
      } catch (err) {
        console.error('Error al obtener las citas:', err);
        setErrorCitas('No se pudieron cargar las citas. Por favor, intente de nuevo más tarde.');
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
        medical: {
          ...patientData.historialMedico,
          history: medicalNotes
        }
      });

      // Actualizar estado local
      setPatientData({
        ...patientData,
        historialMedico: {
          ...patientData.historialMedico,
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

  const { cliente, tratamientos, documentos } = patientData;

  // Formatear fecha y hora para mostrar
  const formatearFechaHora = (fechaHora: string) => {
    const fecha = new Date(fechaHora);
    return {
      fecha: fecha.toLocaleDateString('es-ES'),
      hora: fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Traducir estado de la cita
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

  // Mockups para datos que aún no vienen de la API
  const payments = [
    {
      id: '1',
      date: '15/04/2025',
      amount: 600,
      concept: 'Primera sesión ortodoncia',
      status: 'paid',
      method: 'Tarjeta de crédito'
    },
    {
      id: '2',
      date: '10/05/2025',
      amount: 80,
      concept: 'Limpieza dental',
      status: 'paid',
      method: 'Efectivo'
    },
    {
      id: '3',
      date: '22/06/2025',
      amount: 60,
      concept: 'Ajuste ortodoncia',
      status: 'pending',
      method: 'Pendiente'
    }
  ];

  // Total pagado y pendiente
  const totalPaid = payments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalPending = payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

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

  return (
    <Box>
      {/* Cabecera del perfil */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '120px 1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Avatar */}
          <Box>
            <Avatar
              alt={cliente.name}
              src={cliente.avatar || undefined}
              sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem' }}
            >
              {cliente.name.charAt(0)}
            </Avatar>
          </Box>

          {/* Información básica */}
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {cliente.name}
            </Typography>
            <Chip 
              label={cliente.status === 'active' ? 'Activo' : 'Inactivo'} 
              color={cliente.status === 'active' ? 'success' : 'default'}
              size="small"
              sx={{ mb: 2 }}
            />
            <List dense disablePadding>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PhoneIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText primary={cliente.phone} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <EmailIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText primary={cliente.email} />
              </ListItem>
              {cliente.address && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText primary={cliente.address} />
                </ListItem>
              )}
              {cliente.birthDate && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText primary={`Fecha de nacimiento: ${cliente.birthDate}`} />
                </ListItem>
              )}
            </List>            {/* Contacto de Emergencia */}
            {cliente.contactoEmergencia && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Contacto de Emergencia
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemText 
                      secondary="Paciente"
                      primary={cliente.name}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText 
                      primary="Nombre contacto"
                      secondary={cliente.contactoEmergencia.nombre}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText 
                      primary="Teléfono"
                      secondary={cliente.contactoEmergencia.telefono}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText 
                      primary="Relación"
                      secondary={cliente.contactoEmergencia.relacion}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>

          {/* Tarjetas de resumen */}
          <Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                height: '100%',
              }}
            >
              <Card sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Última Visita
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {cliente.lastVisit || 'Sin visitas'}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: cliente.nextVisit ? 'primary.light' : 'inherit',
                  color: cliente.nextVisit ? 'primary.contrastText' : 'inherit'
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography 
                    variant="body2" 
                    color={cliente.nextVisit ? 'primary.contrastText' : 'text.secondary'}
                  >
                    Próxima Cita
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {cliente.nextVisit || 'Sin programar'}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ gridColumn: '1 / -1' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  {cliente.treatmentStatus ? (
                    <Chip 
                      label={cliente.treatmentStatus} 
                      color={
                        cliente.treatmentStatus === 'En tratamiento' ? 'primary' :
                        cliente.treatmentStatus === 'Pendiente' ? 'warning' :
                        cliente.treatmentStatus === 'Completado' ? 'success' : 'default'
                      }
                      sx={{ width: 'fit-content', mx: 'auto' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin tratamientos
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs de información */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              py: 2,
            },
          }}
        >
          <Tab label="Tratamientos" icon={<MedicalIcon />} iconPosition="start" />
          <Tab label="Citas" icon={<CalendarIcon />} iconPosition="start" />
          <Tab label="Historial Médico" icon={<FolderIcon />} iconPosition="start" />
          <Tab label="Documentos" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Pagos" icon={<PaymentIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab de Tratamientos */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tratamientos Actuales</Typography>
              <Button 
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
              >
                Nuevo Tratamiento
              </Button>
            </Box>
            
            {tratamientos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                No hay tratamientos registrados
              </Typography>
            ) : (
              <Box 
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2
                }}
              >
                {tratamientos.map(tratamiento => (
                  <Card key={tratamiento.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{tratamiento.nombre}</Typography>
                        <Chip 
                          label={tratamiento.estado === 'activo' ? 'En progreso' : 'Completado'} 
                          color={tratamiento.estado === 'activo' ? 'primary' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Inicio: {tratamiento.fechaInicio}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dentista: {tratamiento.dentistaNombre || "N/A"}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            Progreso: {tratamiento.progreso}%
                          </Typography>
                          <Typography variant="body2">
                            {tratamiento.sesionesCompletadas}/{tratamiento.sesionesTotales} sesiones
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={tratamiento.progreso} 
                          sx={{ mt: 1, mb: 2 }}
                        />
                      </Box>
                      
                      {tratamiento.notas && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Notas: {tratamiento.notas}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="small"
                          startIcon={<TimelineIcon />}
                        >
                          Evolución
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab de Citas */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Historial de Citas</Typography>
              <Button 
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
              >
                Nueva Cita
              </Button>
            </Box>
            
            {loadingCitas ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : errorCitas ? (
              <Alert severity="error" sx={{ mb: 2 }}>{errorCitas}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Dentista</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {citas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No hay citas registradas
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      citas.map(cita => {
                        const { fecha, hora } = formatearFechaHora(cita.fechaHora);
                        return (
                          <TableRow key={cita.id}>
                            <TableCell>{fecha}</TableCell>
                            <TableCell>{hora}</TableCell>
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
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Tab de Historial Médico */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h6">Historial Médico</Typography>
              <Button 
                variant="contained"
                startIcon={<EditIcon />}
                size="small"
                onClick={handleMedicalDialogOpen}
              >
                Editar Historial
              </Button>
            </Box>
            
            <Card>
              <CardContent>
                <Typography variant="body1" whiteSpace="pre-wrap">
                  {patientData.historialMedico?.history || "No hay historial médico registrado."}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Tab de Documentos */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Documentos del Paciente</Typography>
              <Button 
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setOpenDocumentDialog(true)}
              >
                Subir Documento
              </Button>
            </Box>
            
            {documentos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                No hay documentos disponibles
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documentos.map((documento) => (
                      <TableRow key={documento.id}>
                        <TableCell>{documento.nombre}</TableCell>
                        <TableCell>{documento.tipo}</TableCell>
                        <TableCell>{new Date(documento.fechaCreacion).toLocaleDateString()}</TableCell>
                        <TableCell>{Math.round(documento.tamano / 1024)} KB</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>

        {/* Tab de Pagos */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Historial de Pagos</Typography>
              <Button 
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
              >
                Registrar Pago
              </Button>
            </Box>
            
            {/* Tarjetas resumen */}
            <Box
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
                mb: 3
              }}
            >
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Pagado
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    €{totalPaid.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pendiente de Pago
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={totalPending > 0 ? 'warning.main' : 'success.main'} 
                    fontWeight="bold"
                  >
                    €{totalPending.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell align="right">Importe</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No hay pagos registrados
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.concept}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell align="right">€{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              payment.status === 'paid' ? 'Pagado' :
                              payment.status === 'pending' ? 'Pendiente' :
                              'Reembolsado'
                            } 
                            color={
                              payment.status === 'paid' ? 'success' :
                              payment.status === 'pending' ? 'warning' :
                              'error'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Diálogo para editar historial médico */}
      <Dialog
        open={openMedicalDialog}
        onClose={handleMedicalDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Editar Historial Médico</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              multiline
              rows={10}
              fullWidth
              placeholder="Escriba aquí el historial médico del paciente..."
              value={medicalNotes}
              onChange={handleMedicalNotesChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMedicalDialogClose}>Cancelar</Button>
          <Button onClick={handleSaveMedicalNotes} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para subir documentos */}
      <Dialog
        open={openDocumentDialog}
        onClose={() => setOpenDocumentDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="Nombre del documento"
              fullWidth
              variant="outlined"
              value={documentForm.nombre}
              onChange={(e) => handleDocumentFormChange('nombre', e.target.value)}
            />
            <TextField
              select
              margin="dense"
              label="Tipo de documento"
              fullWidth
              variant="outlined"
              value={documentForm.tipo}
              onChange={(e) => handleDocumentFormChange('tipo', e.target.value)}
            >
              <MenuItem value="xray">Radiografía</MenuItem>
              <MenuItem value="consent">Consentimiento</MenuItem>
              <MenuItem value="report">Informe</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              Seleccionar Archivo
              <input
                type="file"
                hidden
                onChange={(e) => handleDocumentFormChange('archivo', e.target.files?.[0] || null)}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocumentDialog(false)}>Cancelar</Button>
          <Button variant="contained">
            Subir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientProfile;
