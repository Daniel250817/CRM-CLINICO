import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  LocalHospital as DentistaIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import * as yup from 'yup';

import type { Factura, FacturaCreateData, Servicio } from '../../services/facturaService';
import facturaService from '../../services/facturaService';
import { clienteService } from '../../services/clienteService';
import dentistaService from '../../services/dentistaService';
import { citaService } from '../../services/citaService';
import { servicioService } from '../../services/servicioService';

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (factura: Factura) => void;
  citaId?: number;
  clienteId?: number;
  dentistaId?: number;
}

// Definir un tipo para la respuesta de la API
interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

const validationSchema = yup.object({
  citaId: yup.number().required('La cita es requerida'),
  clienteId: yup.number().required('El cliente es requerido'),
  dentistaId: yup.number().required('El dentista es requerido'),
  servicios: yup.array().min(1, 'Debe agregar al menos un servicio'),
  fechaVencimiento: yup.date().required('La fecha de vencimiento es requerida'),
});

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  open,
  onClose,
  onSubmit,
  citaId,
  clienteId,
  dentistaId
}) => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [dentistas, setDentistas] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formik = useFormik<FacturaCreateData>({
    initialValues: {
      citaId: citaId || 0,
      clienteId: clienteId || 0,
      dentistaId: dentistaId || 0,
      servicios: [],
      descuento: 0,
      porcentajeDescuento: 0, // Nuevo campo para porcentaje de descuento
      fechaVencimiento: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      notas: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        
        // Asegurar que el descuento está calculado correctamente antes de enviar
        const subtotal = calcularSubtotal();
        const descuentoCalculado = (subtotal * (values.porcentajeDescuento || 0)) / 100;
        
        // Crear un objeto con los valores a enviar, excluyendo porcentajeDescuento
        const { porcentajeDescuento, ...datosParaEnviar } = values;
        const datosFactura: FacturaCreateData = {
          ...datosParaEnviar,
          descuento: descuentoCalculado // Usar el valor calculado en dólares
        };
        
        console.log('Enviando datos de factura:', datosFactura);
        const response = await facturaService.crearFactura(datosFactura);
        
        // Asegurar que la respuesta tiene la estructura esperada
        if (response && typeof response === 'object' && 'data' in response) {
          // Tratamos la respuesta como el tipo correcto
          const apiResponse = response as ApiResponse<Factura>;
          onSubmit(apiResponse.data);
          onClose();
          formik.resetForm();
        } else {
          console.error('Formato de respuesta inválido:', response);
          setError('Respuesta del servidor en formato inesperado');
        }
      } catch (err: any) {
        console.error('Error completo:', err);
        setError(err.response?.data?.message || 'Error al crear la factura');
      } finally {
        setLoading(false);
      }
    }
  });
  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);

  // Efecto para actualizar automáticamente el valor del descuento cuando cambie el porcentaje
  useEffect(() => {
    if (formik.values.porcentajeDescuento !== undefined) {
      const subtotal = calcularSubtotal();
      const descuentoCalculado = (subtotal * formik.values.porcentajeDescuento) / 100;
      
      // Solo actualizar si hay cambios para evitar loops
      if (formik.values.descuento !== descuentoCalculado) {
        formik.setFieldValue('descuento', descuentoCalculado);
      }
    }
  }, [formik.values.porcentajeDescuento, formik.values.servicios]);

  // Efecto para manejar cuando se abre el formulario con valores preseleccionados
  useEffect(() => {
    if (open && citaId) {
      // Si hay un citaId preseleccionado, hay que cargar esa cita específica
      const cargarCitaPreseleccionada = async () => {
        try {
          // Esperamos a que se carguen las citas
          if (citas.length > 0) {
            // Buscar la cita en el array de citas
            const citaEncontrada = citas.find(c => String(c.id) === String(citaId));
            if (citaEncontrada) {
              console.log("Cita preseleccionada encontrada:", citaEncontrada);
              
              // Setear valores basados en la cita encontrada
              formik.setFieldValue('citaId', citaEncontrada.id);
              
              if (citaEncontrada.cliente?.id) {
                formik.setFieldValue('clienteId', citaEncontrada.cliente.id);
              }
              
              if (citaEncontrada.dentista?.id) {
                formik.setFieldValue('dentistaId', citaEncontrada.dentista.id);
              }
            }
          }
        } catch (error) {
          console.error("Error al cargar cita preseleccionada:", error);
        }
      };
      
      cargarCitaPreseleccionada();
    }
  }, [open, citaId, citas.length]);const cargarDatos = async () => {
    try {
      setLoading(true);
      const [clientesRes, dentistasRes, citasRes, serviciosRes] = await Promise.all([
        clienteService.obtenerTodosLosClientes(),
        dentistaService.obtenerDentistas(),
        citaService.obtenerCitas(),
        servicioService.obtenerServicios()
      ]);

      console.log('Datos cargados:', {
        clientes: clientesRes,
        dentistas: dentistasRes,
        citas: citasRes,
        servicios: serviciosRes
      });

      setClientes(clientesRes || []);
      setDentistas(dentistasRes || []);
      setCitas(citasRes || []);
      setServiciosDisponibles(serviciosRes || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const agregarServicio = () => {
    const nuevosServicios = [
      ...formik.values.servicios,
      {
        id: '',
        nombre: '',
        descripcion: '',
        precio: 0,
        cantidad: 1
      }
    ];
    formik.setFieldValue('servicios', nuevosServicios);
  };

  const eliminarServicio = (index: number) => {
    const nuevosServicios = formik.values.servicios.filter((_, i) => i !== index);
    formik.setFieldValue('servicios', nuevosServicios);
  };

  const actualizarServicio = (index: number, campo: keyof Servicio, valor: any) => {
    const nuevosServicios = [...formik.values.servicios];
    nuevosServicios[index] = { ...nuevosServicios[index], [campo]: valor };
    
    // Si se selecciona un servicio predefinido, actualizar precio y nombre
    if (campo === 'id' && valor) {
      const servicioSeleccionado = serviciosDisponibles.find(s => s.id === valor);
      if (servicioSeleccionado) {
        nuevosServicios[index].nombre = servicioSeleccionado.nombre;
        nuevosServicios[index].descripcion = servicioSeleccionado.descripcion;
        nuevosServicios[index].precio = servicioSeleccionado.precio;
      }
    }
    
    formik.setFieldValue('servicios', nuevosServicios);
  };

  const calcularSubtotal = () => {
    return formik.values.servicios.reduce((total, servicio) => {
      return total + (servicio.precio * servicio.cantidad);
    }, 0);
  };

  const calcularImpuestos = () => {
    const subtotal = calcularSubtotal();
    return subtotal * 0.15; // 15% de impuestos
  };  const calcularDescuento = () => {
    const subtotal = calcularSubtotal();
    const porcentaje = formik.values.porcentajeDescuento || 0;
    return (subtotal * porcentaje) / 100;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const impuestos = calcularImpuestos();
    const descuento = calcularDescuento();
    
    // Actualizar el valor del descuento en el formulario (para enviarlo a la BD)
    if (formik.values.descuento !== descuento) {
      formik.setFieldValue('descuento', descuento);
    }
    
    return subtotal + impuestos - descuento;
  };
  
  // Buscar cliente, dentista y cita seleccionados y convertir IDs a string para comparación
  const clienteSeleccionado = formik.values.clienteId ? clientes.find(c => String(c.id) === String(formik.values.clienteId)) : null;
  const dentistaSeleccionado = formik.values.dentistaId ? dentistas.find(d => String(d.id) === String(formik.values.dentistaId)) : null;
  const citaSeleccionada = formik.values.citaId ? citas.find(c => String(c.id) === String(formik.values.citaId)) : null;

  // Log de los valores seleccionados para debugging
  useEffect(() => {
    console.log("Valores seleccionados:", {
      citaId: formik.values.citaId,
      clienteId: formik.values.clienteId,
      dentistaId: formik.values.dentistaId,
      citaSeleccionada,
      clienteSeleccionado,
      dentistaSeleccionado
    });
  }, [formik.values.citaId, formik.values.clienteId, formik.values.dentistaId]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>        <form onSubmit={formik.handleSubmit}>          <DialogTitle>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Nueva Factura</span>
          </DialogTitle>

          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 3
              }}
            >              {/* Información de la cita */}              <Autocomplete
                options={citas}
                getOptionLabel={(option) => {
                  if (!option || !option.id) return '';
                  return `Cita #${option.id} - ${option.fechaHora ? dayjs(option.fechaHora).format('DD/MM/YYYY HH:mm') : ''}`;
                }}
                value={citaSeleccionada || null}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}                onChange={(_, value) => {
                  console.log("Cita seleccionada:", value);
                  if (value) {
                    // Convertir a string para manejar posibles diferencias de tipo
                    formik.setFieldValue('citaId', value.id || 0);
                    
                    // Obtener IDs de cliente y dentista desde la estructura anidada
                    if (value.cliente && value.cliente.id) {
                      formik.setFieldValue('clienteId', value.cliente.id);
                      console.log(`Cliente asociado a la cita: ${value.cliente.id}`);
                      
                      // Buscar el cliente completo para ponerlo en el selector
                      const clienteCompleto = clientes.find(c => String(c.id) === String(value.cliente.id));
                      if (clienteCompleto) {
                        console.log("Cliente completo encontrado:", clienteCompleto);
                      }
                    }
                    
                    if (value.dentista && value.dentista.id) {
                      formik.setFieldValue('dentistaId', value.dentista.id);
                      console.log(`Dentista asociado a la cita: ${value.dentista.id}`);
                      
                      // Buscar el dentista completo para ponerlo en el selector
                      const dentistaCompleto = dentistas.find(d => String(d.id) === String(value.dentista.id));
                      if (dentistaCompleto) {
                        console.log("Dentista completo encontrado:", dentistaCompleto);
                      }
                    }
                  } else {
                    formik.setFieldValue('citaId', 0);
                  }
                  
                  // Forzar actualización de los valores del formulario
                  setTimeout(() => {
                    formik.validateForm();
                  }, 100);
                }}renderOption={(props, option) => (
                  <li {...props} key={`cita-${option.id}`}>
                    {`Cita #${option.id} - ${option.fechaHora ? dayjs(option.fechaHora).format('DD/MM/YYYY HH:mm') : ''} - ${option.cliente?.usuario?.nombre || 'Sin cliente'} - ${option.dentista?.usuario?.nombre ? 'Dr. ' + option.dentista.usuario.nombre : 'Sin dentista'}`}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cita"
                    error={formik.touched.citaId && Boolean(formik.errors.citaId)}
                    helperText={formik.touched.citaId && formik.errors.citaId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                )}
              />{/* Cliente */}              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => {
                  if (!option || !option.id) return '';
                  const nombre = option.usuario?.nombre || option.name || '';
                  const apellidos = option.usuario?.apellidos || '';
                  return `${nombre} ${apellidos}`.trim();
                }}
                value={clienteSeleccionado || null}
                onChange={(_, value) => {
                  console.log("Cliente seleccionado:", value);
                  formik.setFieldValue('clienteId', value?.id || 0);
                }}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderOption={(props, option) => (
                  <li {...props} key={`cliente-${option.id}`}>
                    {`${option.usuario?.nombre || option.name || ''} ${option.usuario?.apellidos || ''}`.trim()}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    error={formik.touched.clienteId && Boolean(formik.errors.clienteId)}
                    helperText={formik.touched.clienteId && formik.errors.clienteId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                )}
              />{/* Dentista */}              <Autocomplete
                options={dentistas}
                getOptionLabel={(option) => {
                  if (!option || !option.id) return '';
                  const nombre = option.usuario?.nombre || '';
                  const apellidos = option.usuario?.apellidos || '';
                  return `Dr. ${nombre} ${apellidos}`.trim();
                }}
                value={dentistaSeleccionado || null}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(_, value) => {
                  console.log("Dentista seleccionado:", value);
                  formik.setFieldValue('dentistaId', value?.id || 0);
                }}
                renderOption={(props, option) => (
                  <li {...props} key={`dentista-${option.id}`}>
                    {`Dr. ${option.usuario?.nombre || ''} ${option.usuario?.apellidos || ''}`.trim()}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Dentista"
                    error={formik.touched.dentistaId && Boolean(formik.errors.dentistaId)}
                    helperText={formik.touched.dentistaId && formik.errors.dentistaId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <DentistaIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                )}
              />
            </Box>            {/* Servicios */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Servicios</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={agregarServicio}
                  variant="outlined"
                >
                  Agregar Servicio
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formik.values.servicios.map((servicio, index) => (
                      <TableRow key={index}>
                        <TableCell>                <Autocomplete
                options={serviciosDisponibles}
                getOptionLabel={(option) => option?.nombre || ''}
                value={serviciosDisponibles.find(s => s.id === servicio.id) || null}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(_, value) => actualizarServicio(index, 'id', value?.id || '')}
                renderOption={(props, option) => (
                  <li {...props} key={`service-${option.id}`}>
                    {option.nombre}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Seleccionar servicio"
                  />
                )}
              />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={servicio.cantidad}
                            onChange={(e) => actualizarServicio(index, 'cantidad', parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={servicio.precio}
                            onChange={(e) => actualizarServicio(index, 'precio', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{ startAdornment: '$' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ${(servicio.precio * servicio.cantidad).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => eliminarServicio(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>            {/* Totales */}
            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 3
              }}
            >              <TextField
                fullWidth
                name="porcentajeDescuento"
                label="Porcentaje de Descuento"
                type="number"
                value={formik.values.porcentajeDescuento}
                onChange={(e) => {
                  // Limitar el valor a un máximo de 100%
                  const valor = Math.min(parseFloat(e.target.value) || 0, 100);
                  formik.setFieldValue('porcentajeDescuento', valor);
                }}
                InputProps={{ 
                  endAdornment: <Typography variant="body1">%</Typography>
                }}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />

              <DatePicker
                label="Fecha de Vencimiento"
                value={dayjs(formik.values.fechaVencimiento)}
                onChange={(date) => formik.setFieldValue('fechaVencimiento', date?.format('YYYY-MM-DD'))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.fechaVencimiento && Boolean(formik.errors.fechaVencimiento),
                    helperText: formik.touched.fechaVencimiento && formik.errors.fechaVencimiento
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="notas"
                label="Notas adicionales"
                value={formik.values.notas}
                onChange={formik.handleChange}
              />
            </Box>

            {/* Resumen de totales */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Resumen</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Subtotal:</Typography>
                <Typography>${calcularSubtotal().toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Impuestos (15%):</Typography>
                <Typography>${calcularImpuestos().toFixed(2)}</Typography>
              </Box>              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Descuento ({formik.values.porcentajeDescuento || 0}%):</Typography>
                <Typography color="success.main">-${calcularDescuento().toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" pt={1} borderTop={1} borderColor="divider">
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  ${calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || formik.values.servicios.length === 0}
            >
              {loading ? 'Creando...' : 'Crear Factura'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default InvoiceForm;
