import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CloudDownload as CloudDownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  MedicalInformation as MedicalIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';
import { clienteService, type Cliente } from '../../services/clienteService';

const PatientsList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<Cliente | null>(null);
  
  // Estados para la obtención de datos de la API
  const [patients, setPatients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredPatients, setFilteredPatients] = useState<Cliente[]>([]);

  // Cargar los pacientes desde la API al montar el componente
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await clienteService.obtenerTodosLosClientes();
        setPatients(data);
        setFilteredPatients(data);
        setError(null);
      } catch (err) {
        console.error('Error al obtener los pacientes:', err);
        setError('No se pudieron cargar los pacientes. Por favor, intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filtrar pacientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = patients.filter(
      patient => 
        patient.name.toLowerCase().includes(searchTermLower) ||
        patient.email.toLowerCase().includes(searchTermLower) ||
        patient.phone.includes(searchTerm)
    );
    
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Función para buscar pacientes con la API
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los pacientes
      setFilteredPatients(patients);
      return;
    }
    
    try {
      setLoading(true);
      const data = await clienteService.buscarClientes(searchTerm);
      setFilteredPatients(data);
      setError(null);
    } catch (err) {
      console.error('Error al buscar pacientes:', err);
      setError('Error al realizar la búsqueda. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Stats
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    inTreatment: patients.filter(p => p.treatmentStatus === 'En tratamiento').length,
    pending: patients.filter(p => p.nextVisit !== undefined).length
  };

  // Gestión de la paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestión del menú de acciones
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, patient: Cliente) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient.id);
    setSelectedPatientData(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
    setSelectedPatientData(null);
  };

  const handleViewProfile = () => {
    if (selectedPatient) {
      navigate(`/patients/${selectedPatient}`);
    }
    handleMenuClose();
  };

  const handleNewAppointment = () => {
    if (selectedPatient) {
      // Navegar a la página de calendario con el paciente preseleccionado
      navigate(`/appointments/calendar?patientId=${selectedPatient}`);
    }
    handleMenuClose();
  };

  const handleViewHistory = async () => {
    if (selectedPatient) {
      try {
        setLoading(true);
        const perfilCompleto = await clienteService.obtenerPerfilCompleto(selectedPatient);
        // Navegar al perfil del paciente con la pestaña de historial médico seleccionada
        navigate(`/patients/${selectedPatient}?tab=medical`);
      } catch (error) {
        console.error('Error al obtener historial:', error);
        setError('No se pudo cargar el historial del paciente');
      } finally {
        setLoading(false);
      }
    }
    handleMenuClose();
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      navigate(`/patients/${selectedPatient}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedPatient) {
      try {
        setLoading(true);
        await clienteService.eliminarCliente(selectedPatient);
        
        // Actualizar la lista de pacientes después de eliminar
        const updatedPatients = patients.filter(p => p.id !== selectedPatient);
        setPatients(updatedPatients);
        setFilteredPatients(updatedPatients);
        setError(null);
        
        // Cerrar diálogos
        setDeleteDialogOpen(false);
        handleMenuClose();
      } catch (error) {
        console.error('Error al eliminar paciente:', error);
        setError('No se pudo eliminar el paciente');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Pacientes
      </Typography>

      {/* Barra superior con búsqueda y botón de registro */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flex: 1,
          maxWidth: { xs: '100%', sm: '60%' }
        }}>
          <TextField
            fullWidth
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            startIcon={<FilterListIcon />}
            sx={{ minWidth: 'auto' }}
          >
            Filtros
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
          gap: 3, 
          mb: 3 
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Pacientes
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="success.main">
              {stats.active}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pacientes Activos
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="warning.main">
              {stats.inTreatment}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En Tratamiento
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="info.main">
              {stats.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Con Cita Pendiente
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Control Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        <TextField
          placeholder="Buscar pacientes..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ 
            width: { xs: '100%', sm: 'auto', flexGrow: 1, maxWidth: 500 } 
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterAnchorEl(filterAnchorEl ? null : document.body)}
            color={filterAnchorEl ? 'primary' : 'inherit'}
          >
            {filterAnchorEl ? 'Cerrar Filtros' : 'Filtrar'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/patients/new')}
          >
            Nuevo Paciente
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Filtros (Drawer) */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        sx={{ '& .MuiMenuItem-root': { justifyContent: 'center' } }}
      >
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          <ListItemText primary="Todos" />
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          <ListItemText primary="Activos" />
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          <ListItemText primary="Inactivos" />
        </MenuItem>
      </Menu>

      {/* Tabla de Pacientes */}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Última Visita</TableCell>
                <TableCell>Próxima Cita</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron pacientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((patient) => (
                    <TableRow
                      key={patient.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            alt={patient.name} 
                            src={patient.avatar || undefined}
                            sx={{ mr: 2, bgcolor: 'primary.main' }}
                          >
                            {patient.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {patient.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {patient.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2">{patient.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2">{patient.phone}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip 
                            label={patient.status === 'active' ? 'Activo' : 'Inactivo'} 
                            color={patient.status === 'active' ? 'success' : 'default'}
                            size="small"
                            sx={{ width: 'fit-content' }}
                          />
                          {patient.treatmentStatus && (
                            <Chip 
                              label={patient.treatmentStatus} 
                              color={
                                patient.treatmentStatus === 'En tratamiento' ? 'primary' :
                                patient.treatmentStatus === 'Pendiente' ? 'warning' :
                                patient.treatmentStatus === 'Completado' ? 'success' : 'default'
                              }
                              size="small"
                              variant="outlined"
                              sx={{ width: 'fit-content' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : (
                          <Chip 
                            label="Sin visitas" 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.nextVisit ? (
                          <Chip 
                            icon={<EventAvailableIcon />}
                            label={new Date(patient.nextVisit).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            label="Sin cita programada" 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Acciones">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, patient)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleViewProfile}>
          <ListItemIcon>
            <MedicalIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver perfil</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNewAppointment}>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Nueva cita</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleViewHistory}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver historial</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEditPatient}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          ¿Eliminar paciente?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedPatientData ? (
              <>
                ¿Está seguro que desea eliminar al paciente <strong>{selectedPatientData.name}</strong>?
                <br />
                Esta acción no se puede deshacer y se perderán todos los datos asociados al paciente.
              </>
            ) : (
              'Esta acción no se puede deshacer.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientsList;
