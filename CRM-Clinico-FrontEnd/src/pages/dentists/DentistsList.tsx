import { useState } from 'react';
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
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Rating
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
  MedicalServices as MedicalServicesIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon
} from '@mui/icons-material';

// Datos ficticios para los dentistas
const dentistsData = [
  {
    id: '1',
    name: 'Dr. Carlos García',
    email: 'carlos.garcia@dentalcrm.com',
    phone: '+34 612 345 678',
    specialty: 'Ortodoncia',
    rating: 4.8,
    appointmentsToday: 8,
    status: 'active',
    avatar: null
  },
  {
    id: '2',
    name: 'Dra. Laura Rodríguez',
    email: 'laura.rodriguez@dentalcrm.com',
    phone: '+34 623 456 789',
    specialty: 'Odontología General',
    rating: 4.5,
    appointmentsToday: 6,
    status: 'active',
    avatar: null
  },
  {
    id: '3',
    name: 'Dr. Miguel Fernández',
    email: 'miguel.fernandez@dentalcrm.com',
    phone: '+34 634 567 890',
    specialty: 'Cirugía Oral',
    rating: 4.9,
    appointmentsToday: 4,
    status: 'active',
    avatar: null
  },
  {
    id: '4',
    name: 'Dra. Ana Martínez',
    email: 'ana.martinez@dentalcrm.com',
    phone: '+34 645 678 901',
    specialty: 'Endodoncia',
    rating: 4.7,
    appointmentsToday: 7,
    status: 'active',
    avatar: null
  },
  {
    id: '5',
    name: 'Dr. Javier López',
    email: 'javier.lopez@dentalcrm.com',
    phone: '+34 656 789 012',
    specialty: 'Periodoncia',
    rating: 4.6,
    appointmentsToday: 0,
    status: 'inactive',
    avatar: null
  },
  {
    id: '6',
    name: 'Dra. Carmen Sánchez',
    email: 'carmen.sanchez@dentalcrm.com',
    phone: '+34 667 890 123',
    specialty: 'Odontopediatría',
    rating: 4.9,
    appointmentsToday: 9,
    status: 'active',
    avatar: null
  },
  {
    id: '7',
    name: 'Dr. Pablo Gómez',
    email: 'pablo.gomez@dentalcrm.com',
    phone: '+34 678 901 234',
    specialty: 'Prostodoncia',
    rating: 4.4,
    appointmentsToday: 5,
    status: 'active',
    avatar: null
  }
];

const DentistsList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);

  // Filtrar dentistas según la búsqueda y el filtro de estado
  const filteredDentists = dentistsData.filter(dentist => {
    const matchesSearch = 
      dentist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dentist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dentist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dentist.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === null || dentist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: dentistsData.length,
    active: dentistsData.filter(d => d.status === 'active').length,
    appointmentsToday: dentistsData.reduce((sum, d) => sum + d.appointmentsToday, 0),
    avgRating: (dentistsData.reduce((sum, d) => sum + d.rating, 0) / dentistsData.length).toFixed(1)
  };

  // Gestión de la paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestión del menú de acciones
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, dentistId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDentistId(dentistId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDentistId(null);
  };

  const handleEditDentist = () => {
    // Lógica para editar el dentista
    handleMenuClose();
  };

  const handleDeleteDentist = () => {
    // Lógica para eliminar el dentista
    handleMenuClose();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Dentistas
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Dentistas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dentistas Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {stats.appointmentsToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Citas Hoy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h3" fontWeight="bold" color="info.main">
                {stats.avgRating}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating 
                  value={parseFloat(stats.avgRating)} 
                  precision={0.1} 
                  size="small" 
                  readOnly 
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Valoración Media
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          placeholder="Buscar dentistas..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
            onClick={() => setStatusFilter(statusFilter === 'active' ? null : 'active')}
            color={statusFilter === 'active' ? 'primary' : 'inherit'}
          >
            {statusFilter === 'active' ? 'Todos' : 'Solo Activos'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dentists/new')}
          >
            Nuevo Dentista
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Tabla de Dentistas */}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Dentista</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Citas Hoy</TableCell>
                <TableCell>Valoración</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDentists
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dentist) => (
                  <TableRow
                    key={dentist.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          alt={dentist.name} 
                          src={dentist.avatar || undefined}
                          sx={{ mr: 2, bgcolor: dentist.status === 'active' ? 'primary.main' : 'grey.400' }}
                        >
                          {dentist.name.charAt(3)} {/* Usamos el 4to carácter para tomar la inicial después del "Dr./Dra." */}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {dentist.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip 
                              label={dentist.status === 'active' ? 'Activo' : 'Inactivo'} 
                              color={dentist.status === 'active' ? 'success' : 'default'}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={dentist.specialty}
                        variant="outlined"
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">{dentist.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">{dentist.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={dentist.appointmentsToday}
                          color={
                            dentist.appointmentsToday > 7 ? 'error' :
                            dentist.appointmentsToday > 5 ? 'warning' :
                            dentist.appointmentsToday > 0 ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating 
                          value={dentist.rating} 
                          precision={0.1} 
                          size="small" 
                          readOnly 
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({dentist.rating})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Acciones">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, dentist.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredDentists.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron dentistas
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDentists.length}
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
        <MenuItem onClick={() => handleMenuClose()}>
          <ListItemIcon>
            <MedicalServicesIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Pacientes</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEditDentist}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar Información</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteDentist} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DentistsList;
