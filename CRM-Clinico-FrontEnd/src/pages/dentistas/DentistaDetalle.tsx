import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MedicalInformation as MedicalIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import dentistaService from '../../services/dentistaService';
import type { Dentista } from '../../services/dentistaService';
import { UserAvatar } from '../../components/common/UserAvatar';

const DentistaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [dentista, setDentista] = useState<Dentista | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const obtenerDentista = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await dentistaService.obtenerDentista(id);
        setDentista(data);
      } catch (err) {
        console.error('Error al obtener dentista:', err);
        setError('No se pudo cargar la información del dentista');
      } finally {
        setLoading(false);
      }
    };
    
    obtenerDentista();
  }, [id]);
  
  const handleEditar = () => {
    if (id) {
      navigate(`/dentistas/${id}/editar`);
    }
  };
  
  const handleVolver = () => {
    navigate('/dentistas');
  };

  const getChipColorByStatus = (status: string) => {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dentista) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'No se pudo encontrar el dentista solicitado'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleVolver}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  // Renderizar el horario de trabajo
  const renderHorarioTrabajo = () => {
    if (!dentista.horarioTrabajo || Object.keys(dentista.horarioTrabajo).length === 0) {
      return <Typography color="text.secondary">No hay horarios configurados</Typography>;
    }

    const diasSemana = {
      domingo: 'Domingo',
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado'
    };
    
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Día</strong></TableCell>
              <TableCell><strong>Horarios</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(dentista.horarioTrabajo).map(([dia, horarios]) => (
              <TableRow key={dia}>
                <TableCell>{diasSemana[dia as keyof typeof diasSemana]}</TableCell>
                <TableCell>
                  {horarios.map((horario, index) => (
                    <Typography key={index} component="div">
                      {horario.inicio} - {horario.fin}
                    </Typography>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleVolver}
        >
          Volver a la lista
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEditar}
        >
          Editar
        </Button>
      </Box>

      {/* Perfil del dentista */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
          {/* Avatar y datos principales */}
          <UserAvatar
            avatarPath={dentista.usuario?.settings?.avatar}
            userName={dentista.usuario?.nombre}
            sx={{ width: 120, height: 120, mr: 3 }}
          />

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h4">
                {dentista.usuario?.nombre} {dentista.usuario?.apellidos || ''}
              </Typography>
              <Chip
                label={dentista.status === 'activo' ? 'Activo' : dentista.status === 'inactivo' ? 'Inactivo' : 'Vacaciones'}
                color={getChipColorByStatus(dentista.status) as any}
              />
            </Box>

            <Typography variant="h6" color="primary" gutterBottom>
              {dentista.especialidad}
            </Typography>

            <List dense>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={dentista.usuario?.email} />
              </ListItem>
              
              {dentista.usuario?.telefono && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PhoneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dentista.usuario?.telefono} />
                </ListItem>
              )}
              
              {dentista.numeroColegiado && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MedicalIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={`Nº Colegiado: ${dentista.numeroColegiado}`} />
                </ListItem>
              )}
              
              {dentista.titulo && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SchoolIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dentista.titulo} />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Información profesional */}
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Profesional
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dentista.añosExperiencia && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Experiencia
                  </Typography>
                  <Typography>
                    {dentista.añosExperiencia} {dentista.añosExperiencia === 1 ? 'año' : 'años'}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Especialidad
                </Typography>
                <Typography>
                  {dentista.especialidad || 'No especificada'}
                </Typography>
              </Box>
              
              {dentista.biografia && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Biografía
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {dentista.biografia}
                  </Typography>
                </Box>
              )}
              
              {!dentista.biografia && !dentista.añosExperiencia && dentista.especialidad === '' && (
                <Typography color="text.secondary">
                  No hay información profesional disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        
        {/* Horario de trabajo */}
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">
                  Horario de Trabajo
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {renderHorarioTrabajo()}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DentistaDetalle;
