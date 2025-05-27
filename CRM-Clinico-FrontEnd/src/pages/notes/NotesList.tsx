import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { notaService, type Nota } from '../../services/notaService';
import { useNavigate } from 'react-router-dom';

const NotesList = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<Nota | null>(null);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      const params: { busqueda?: string; categoria?: string } = {};
      if (searchTerm) params.busqueda = searchTerm;
      if (selectedCategoria) params.categoria = selectedCategoria;
      
      const response = await notaService.obtenerNotas(params);
      setNotas(response.notas);
      setError(null);
    } catch (err) {
      setError('Error al cargar las notas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const categoriasData = await notaService.obtenerCategorias();
      setCategorias(categoriasData);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  useEffect(() => {
    cargarNotas();
    cargarCategorias();
  }, [searchTerm, selectedCategoria]);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleCategoriaSelect = (categoria: string | null) => {
    setSelectedCategoria(categoria);
    handleFilterClose();
  };

  const handleDeleteClick = (nota: Nota) => {
    setSelectedNota(nota);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNota) return;
    
    try {
      await notaService.eliminarNota(selectedNota.id);
      await cargarNotas();
      setDeleteDialogOpen(false);
      setSelectedNota(null);
    } catch (err) {
      setError('Error al eliminar la nota');
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
        <Typography variant="h5">Notas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/notes/new')}
        >
          Nueva Nota
        </Button>
      </Box>

      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center">
              <Button
                startIcon={<FilterIcon />}
                onClick={handleFilterClick}
                color={selectedCategoria ? 'primary' : 'inherit'}
              >
                {selectedCategoria || 'Filtrar por categoría'}
              </Button>
              {selectedCategoria && (
                <Chip
                  label={selectedCategoria}
                  onDelete={() => handleCategoriaSelect(null)}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Grid container spacing={2}>
        {notas.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No hay notas disponibles
            </Typography>
          </Grid>
        ) : (
          notas.map((nota) => (
            <Grid item xs={12} md={6} lg={4} key={nota.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {nota.titulo}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/notes/edit/${nota.id}`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(nota)}
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
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2
                    }}
                  >
                    {nota.contenido}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      icon={<LabelIcon />}
                      label={nota.categoria}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(nota.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleCategoriaSelect(null)}>
          Todas las categorías
        </MenuItem>
        {categorias.map((categoria) => (
          <MenuItem
            key={categoria}
            onClick={() => handleCategoriaSelect(categoria)}
          >
            {categoria}
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la nota "{selectedNota?.titulo}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotesList; 