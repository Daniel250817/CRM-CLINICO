import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { servicioService, type Servicio, construirUrlImagen } from '../../services/servicioService';
import { useAuth } from '../../contexts/AuthContext';

const ServiciosList = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [servicioActual, setServicioActual] = useState<Partial<Servicio> | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<Servicio | null>(null);
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [serviciosData, categoriasData] = await Promise.all([
        servicioService.obtenerServicios(),
        servicioService.obtenerCategorias()
      ]);
      setServicios(serviciosData);
      setCategorias(categoriasData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los servicios');
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenDialog = (servicio?: Servicio) => {
    setServicioActual(servicio || {
      nombre: '',
      descripcion: '',
      precio: 0,
      duracion: 30,
      activo: true
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setServicioActual(null);
    setOpenDialog(false);
  };

  const handleDeleteClick = (servicio: Servicio) => {
    setServicioAEliminar(servicio);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!servicioAEliminar) return;
    
    try {
      await servicioService.eliminarServicio(servicioAEliminar.id);
      await cargarDatos();
      setOpenDeleteDialog(false);
      setServicioAEliminar(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el servicio');
      console.error('Error al eliminar:', err);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
      // Crear una URL temporal para previsualizar la imagen
      const imageUrl = URL.createObjectURL(event.target.files[0]);
      setServicioActual(prev => ({ ...prev, imagen: imageUrl }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!servicioActual) return;    try {
      // Asegurarse de que los valores numéricos sean números
      const datosServicio = {
        ...servicioActual,
        descripcion: servicioActual.descripcion || '',
        precio: typeof servicioActual.precio === 'string' ? 
          parseFloat(servicioActual.precio) : servicioActual.precio,
        duracion: typeof servicioActual.duracion === 'string' ? 
          parseInt(servicioActual.duracion) : servicioActual.duracion
      };

      // Eliminar la imagen del objeto de datos si es una URL blob
      if (datosServicio.imagen?.startsWith('blob:')) {
        delete datosServicio.imagen;
      }

      console.log('Datos a enviar:', datosServicio);

      // Validar que los campos requeridos estén presentes y sean válidos
      if (!datosServicio.nombre || datosServicio.nombre.trim() === '') {
        throw new Error('El nombre es requerido');
      }
      if (typeof datosServicio.precio !== 'number' || isNaN(datosServicio.precio)) {
        throw new Error('El precio debe ser un número válido');
      }
      if (typeof datosServicio.duracion !== 'number' || isNaN(datosServicio.duracion)) {
        throw new Error('La duración debe ser un número válido');
      }

      // Agregar el resto de los datos al FormData
      const datosActualizacion = {
        nombre: datosServicio.nombre,
        descripcion: datosServicio.descripcion,
        precio: datosServicio.precio,
        duracion: datosServicio.duracion,
        categoria: datosServicio.categoria || undefined,
        codigoServicio: datosServicio.codigoServicio || undefined,
        activo: datosServicio.activo
      };

      if (datosServicio.id) {
        await servicioService.actualizarServicio(datosServicio.id, datosActualizacion, selectedImage);
      } else {
        await servicioService.crearServicio(datosActualizacion, selectedImage);
      }

      handleCloseDialog();
      await cargarDatos();
      setSelectedImage(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar el servicio';
      setError(errorMessage);
      console.error('Error al guardar:', err);
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
        <Typography variant="h5">Servicios Dentales</Typography>
        {user?.rol === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Servicio
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          }, 
          gap: 3,
          gridAutoRows: '1fr' // Hace que todas las filas tengan la misma altura
        }}
      >
        {servicios.map((servicio) => (
          <Card 
            key={servicio.id} 
            sx={{ 
              height: '100%', // Ocupa toda la altura de la celda del grid
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}
          >
            {/* Imagen con altura fija */}
            <Box
              sx={{
                height: 180, // Altura fija para todas las imágenes
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {servicio.imagen ? (
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover' // Mantiene la proporción y llena el contenedor
                  }}
                  image={construirUrlImagen(servicio.imagen)}
                  alt={servicio.nombre}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary'
                  }}
                >
                  <CategoryIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">Sin imagen</Typography>
                </Box>
              )}
            </Box>

            {/* Contenido con flex-grow para ocupar el espacio restante */}
            <CardContent sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              p: 2
            }}>
              {/* Header con título y botones */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    minHeight: '2.6em', // Altura mínima para 2 líneas
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {servicio.nombre}
                </Typography>
                {user?.rol === 'admin' && (
                  <Box sx={{ ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(servicio)}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(servicio)}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Descripción con altura fija */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 2,
                  minHeight: '4.5em', // Altura fija para 3 líneas
                  lineHeight: 1.5
                }}
              >
                {servicio.descripcion}
              </Typography>

              {/* Chips en la parte inferior */}
              <Box sx={{ mt: 'auto' }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                  <Tooltip title="Precio">
                    <Chip
                      icon={<MoneyIcon />}
                      label={`$${typeof servicio.precio === 'number' ? servicio.precio.toFixed(2) : parseFloat(servicio.precio).toFixed(2)}`}
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  </Tooltip>
                  <Tooltip title="Duración">
                    <Chip
                      icon={<TimerIcon />}
                      label={`${servicio.duracion} min`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Tooltip>
                  {servicio.categoria && (
                    <Tooltip title="Categoría">
                      <Chip
                        icon={<CategoryIcon />}
                        label={servicio.categoria}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                  {!servicio.activo && (
                    <Chip
                      label="Inactivo"
                      size="small"
                      color="error"
                      variant="filled"
                    />
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {servicioActual?.id ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Nombre"
                fullWidth
                required
                value={servicioActual?.nombre || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, nombre: e.target.value }))}
              />
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={servicioActual?.descripcion || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, descripcion: e.target.value }))}
              />
              <TextField
                label="Precio"
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={servicioActual?.precio || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, precio: parseFloat(e.target.value) }))}
              />
              <TextField
                label="Duración (minutos)"
                fullWidth
                required
                type="number"
                inputProps={{ min: 1 }}
                value={servicioActual?.duracion || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, duracion: parseInt(e.target.value) }))}
              />
              <TextField
                select
                label="Categoría"
                fullWidth
                value={servicioActual?.categoria || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, categoria: e.target.value }))}
              >
                {categorias.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </TextField>              <TextField
                label="Código de Servicio"
                fullWidth
                value={servicioActual?.codigoServicio || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, codigoServicio: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={servicioActual?.activo ?? true}
                    onChange={e => setServicioActual(prev => ({ ...prev, activo: e.target.checked }))}
                  />
                }
                label="Servicio activo"
              />
              <TextField
                label="URL de Imagen"
                fullWidth
                value={servicioActual?.imagen || ''}
                onChange={e => setServicioActual(prev => ({ ...prev, imagen: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="imagen-servicio"
                      type="file"
                      onChange={handleImageChange}
                    />
                  )
                }}
              />
              <label htmlFor="imagen-servicio">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  {selectedImage ? 'Cambiar imagen' : 'Subir imagen'}
                </Button>
              </label>              {servicioActual?.imagen && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img 
                    src={servicioActual.imagen.startsWith('blob:') ? servicioActual.imagen : construirUrlImagen(servicioActual.imagen)} 
                    alt="Vista previa" 
                    style={{ maxWidth: '100%', maxHeight: '200px' }} 
                  />
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {servicioActual?.id ? 'Guardar' : 'Crear'}
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
            ¿Estás seguro que deseas eliminar el servicio "{servicioAEliminar?.nombre}"?
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

export default ServiciosList; 