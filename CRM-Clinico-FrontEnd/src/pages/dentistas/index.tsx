import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { dentistaService, type Dentista } from '../../services/dentistaService';
import { Link, useNavigate } from 'react-router-dom';

const DentistasPage = () => {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDentistas = async () => {
      try {
        const data = await dentistaService.obtenerDentistas();
        setDentistas(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar dentistas:', err);
        setError('No se pudieron cargar los dentistas. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDentistas();
  }, []);

  const handleAddDentista = () => {
    navigate('/dentistas/nuevo');
  };

  const handleEditDentista = (id: string) => {
    navigate(`/dentistas/${id}/editar`);
  };

  const handleViewDentista = (id: string) => {
    navigate(`/dentistas/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'success';
      case 'inactivo':
        return 'error';
      case 'vacaciones':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Dentistas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddDentista}
        >
          Nuevo Dentista
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', height: 'fit-content' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)', height: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Dentista</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>Nº Colegiado</TableCell>
                  <TableCell>Experiencia</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dentistas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" py={2}>
                        No hay dentistas registrados. Haga clic en "Nuevo Dentista" para agregar uno.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dentistas.map((dentista) => (
                    <TableRow key={dentista.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={dentista.fotoPerfil} 
                            alt={dentista.usuario?.nombre}
                            sx={{ mr: 2 }}
                          >
                            {dentista.usuario?.nombre?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {dentista.usuario?.nombre} {dentista.usuario?.apellidos || ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dentista.usuario?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{dentista.especialidad || 'No especificado'}</TableCell>
                      <TableCell>{dentista.numeroColegiado || 'No especificado'}</TableCell>
                      <TableCell>
                        {dentista.añosExperiencia 
                          ? `${dentista.añosExperiencia} ${dentista.añosExperiencia === 1 ? 'año' : 'años'}`
                          : 'No especificado'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={dentista.status === 'activo' ? 'Activo' : 
                                dentista.status === 'inactivo' ? 'Inactivo' : 'Vacaciones'}
                          color={getStatusColor(dentista.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleViewDentista(dentista.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEditDentista(dentista.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default DentistasPage;
