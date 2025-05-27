import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { tareaService, type Tarea, type CrearTareaDTO } from '../../services/tareaService';
import { useAuth } from '../../contexts/AuthContext';

const ESTADOS = ['pendiente', 'en progreso', 'completada', 'cancelada'] as const;

const getPrioridadColor = (prioridad: Tarea['prioridad']) => {
  const colores = {
    baja: 'success',
    media: 'info',
    alta: 'warning',
    urgente: 'error'
  } as const;
  return colores[prioridad];
};

const TaskBoard = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState<Tarea | null>(null);
  const [tareaActual, setTareaActual] = useState<Partial<Tarea> | null>(null);
  const { user } = useAuth();

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const response = await tareaService.obtenerTareas();
      
      // Manejar el nuevo formato de respuesta
      const tareas = response?.data || [];
      setTareas(tareas);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.customMessage || err.message || 'Error desconocido al cargar las tareas';
      setError(`Error al cargar las tareas: ${errorMessage}`);
      console.error('Error detallado:', err);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTareas().catch(err => {
      console.error('Error en useEffect de TaskBoard:', err);
      setError('Error al inicializar el tablero de tareas');
    });
  }, []);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      console.log('Actualizando estado:', {
        id: parseInt(draggableId),
        estado: destination.droppableId
      });
      
      const response = await tareaService.cambiarEstado(
        parseInt(draggableId), 
        destination.droppableId as Tarea['estado']
      );
      
      if (response.status === 'success') {
        await cargarTareas();
      } else {
        setError('Error al actualizar el estado de la tarea');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar el estado';
      setError(`Error al actualizar el estado de la tarea: ${errorMessage}`);
      console.error('Error completo:', err);
    }
  };

  const handleOpenDialog = (tarea?: Tarea) => {
    setTareaActual(tarea || {
      titulo: '',
      descripcion: '',
      fechaLimite: '',
      prioridad: 'media',
      asignadoA: user?.id || 0
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setTareaActual(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tareaActual) return;

    try {
      if (tareaActual.id) {
        await tareaService.actualizarTarea(tareaActual.id, tareaActual);
      } else {
        // Asegurarse de que los campos requeridos estén presentes
        if (!tareaActual.titulo || !tareaActual.fechaLimite || !tareaActual.asignadoA) {
          setError('Por favor complete todos los campos requeridos');
          return;
        }

        const nuevaTarea: CrearTareaDTO = {
          titulo: tareaActual.titulo,
          descripcion: tareaActual.descripcion || '',
          fechaLimite: new Date(tareaActual.fechaLimite).toISOString(),
          prioridad: tareaActual.prioridad || 'media',
          asignadoA: tareaActual.asignadoA
        };

        await tareaService.crearTarea(nuevaTarea);
      }
      handleCloseDialog();
      await cargarTareas();
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar la tarea';
      setError(errorMessage);
      console.error('Error al guardar tarea:', err);
    }
  };

  const handleDeleteClick = (tarea: Tarea) => {
    setTareaAEliminar(tarea);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!tareaAEliminar) return;
    
    try {
      await tareaService.eliminarTarea(tareaAEliminar.id);
      await cargarTareas();
      setOpenDeleteDialog(false);
      setTareaAEliminar(null);
    } catch (err) {
      setError('Error al eliminar la tarea');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Tablero de Tareas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Tarea
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
          gap={2}
        >
          {ESTADOS.map(estado => (
            <Paper key={estado} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
                <Chip
                  label={tareas.filter(t => t.estado === estado).length}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>

              <Droppable droppableId={estado}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ minHeight: 100 }}
                  >
                    {tareas
                      .filter(tarea => tarea.estado === estado)
                      .map((tarea, index) => (
                        <Draggable
                          key={tarea.id}
                          draggableId={tarea.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ mb: 1 }}
                            >
                              <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Typography variant="subtitle1" gutterBottom>
                                    {tarea.titulo}
                                  </Typography>
                                  <Stack direction="row" spacing={1}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(tarea)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(tarea)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                </Box>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    mb: 2
                                  }}
                                >
                                  {tarea.descripcion}
                                </Typography>

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Tooltip title="Prioridad">
                                      <Chip
                                        icon={<FlagIcon />}
                                        label={tarea.prioridad}
                                        size="small"
                                        color={getPrioridadColor(tarea.prioridad)}
                                      />
                                    </Tooltip>
                                    <Tooltip title="Fecha límite">
                                      <Chip
                                        icon={<TimeIcon />}
                                        label={new Date(tarea.fechaLimite).toLocaleDateString()}
                                        size="small"
                                      />
                                    </Tooltip>
                                  </Stack>
                                  {tarea.responsable && (
                                    <Tooltip title={tarea.responsable.nombre}>
                                      <Avatar
                                        sx={{ width: 24, height: 24, fontSize: '0.875rem' }}
                                      >
                                        {tarea.responsable.nombre.charAt(0)}
                                      </Avatar>
                                    </Tooltip>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {tareaActual?.id ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Título"
                fullWidth
                required
                value={tareaActual?.titulo || ''}
                onChange={e => setTareaActual(prev => ({ ...prev, titulo: e.target.value }))}
              />
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={tareaActual?.descripcion || ''}
                onChange={e => setTareaActual(prev => ({ ...prev, descripcion: e.target.value }))}
              />
              <TextField
                select
                label="Prioridad"
                fullWidth
                required
                value={tareaActual?.prioridad || 'media'}
                onChange={e => setTareaActual(prev => ({ 
                  ...prev, 
                  prioridad: e.target.value as Tarea['prioridad'] 
                }))}
              >
                <MenuItem value="baja">Baja</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </TextField>
              <TextField
                label="Fecha límite"
                type="datetime-local"
                fullWidth
                required
                value={tareaActual?.fechaLimite?.slice(0, 16) || ''}
                onChange={e => setTareaActual(prev => ({ ...prev, fechaLimite: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Asignado a"
                fullWidth
                value={user?.nombre || ''}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
              {tareaActual?.id && (
                <TextField
                  select
                  label="Estado"
                  fullWidth
                  value={tareaActual?.estado || 'pendiente'}
                  onChange={e => setTareaActual(prev => ({ 
                    ...prev, 
                    estado: e.target.value as Tarea['estado']
                  }))}
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="en progreso">En Progreso</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {tareaActual?.id ? 'Guardar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que deseas eliminar la tarea "{tareaAEliminar?.titulo}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskBoard; 