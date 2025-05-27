import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { notaService, type Nota, type CrearNotaDTO } from '../../services/notaService';

const CATEGORIAS_DEFAULT = [
  'General',
  'Clínica',
  'Administrativa',
  'Pacientes',
  'Tratamientos',
  'Recordatorios'
];

const NoteForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_DEFAULT);
  const [formData, setFormData] = useState<CrearNotaDTO>({
    titulo: '',
    contenido: '',
    categoria: 'General',
    etiquetas: []
  });

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const categoriasData = await notaService.obtenerCategorias();
        if (categoriasData.length > 0) {
          setCategorias(categoriasData);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };

    const cargarNota = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const nota = await notaService.getNotaPorId(parseInt(id));
        setFormData({
          titulo: nota.titulo,
          contenido: nota.contenido,
          categoria: nota.categoria,
          etiquetas: nota.etiquetas || []
        });
        setError(null);
      } catch (err) {
        setError('Error al cargar la nota');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
    if (id) {
      cargarNota();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (id) {
        await notaService.actualizarNota(parseInt(id), formData);
      } else {
        await notaService.crearNota(formData);
      }
      navigate('/notes/list');
    } catch (err) {
      setError('Error al guardar la nota');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {id ? 'Editar Nota' : 'Nueva Nota'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                name="titulo"
                label="Título"
                fullWidth
                required
                value={formData.titulo}
                onChange={handleChange}
              />

              <TextField
                name="contenido"
                label="Contenido"
                fullWidth
                required
                multiline
                rows={6}
                value={formData.contenido}
                onChange={handleChange}
              />

              <TextField
                name="categoria"
                select
                label="Categoría"
                fullWidth
                required
                value={formData.categoria}
                onChange={handleChange}
              >
                {categorias.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </TextField>

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/notes/list')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : id ? 'Guardar Cambios' : 'Crear Nota'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NoteForm; 