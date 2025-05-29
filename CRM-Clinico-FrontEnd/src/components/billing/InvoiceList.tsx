import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,  TextField,
  Stack,
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import type { Factura } from '../../services/facturaService';
import facturaService from '../../services/facturaService';
import InvoiceForm from './InvoiceForm';
import PayPalPayment from './PayPalPayment';

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'warning';
    case 'pagada':
      return 'success';
    case 'cancelada':
      return 'error';
    case 'vencida':
      return 'error';
    default:
      return 'default';
  }
};

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'pagada':
      return 'Pagada';
    case 'cancelada':
      return 'Cancelada';
    case 'vencida':
      return 'Vencida';
    default:
      return estado;
  }
};

const InvoiceList: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalFacturas, setTotalFacturas] = useState(0);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    fechaInicio: null as dayjs.Dayjs | null,
    fechaFin: null as dayjs.Dayjs | null
  });

  // Estados para modales
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPayPalPayment, setShowPayPalPayment] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);

  // Estado para menú contextual
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [facturaMenuSeleccionada, setFacturaMenuSeleccionada] = useState<Factura | null>(null);

  useEffect(() => {
    cargarFacturas();
  }, [page, rowsPerPage, filtros]);
  const cargarFacturas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio.format('YYYY-MM-DD') }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin.format('YYYY-MM-DD') })
      };      const response = await facturaService.obtenerFacturas(params);
      // La respuesta ya está tipada correctamente
      setFacturas(response.data.facturas || []);
      setTotalFacturas(response.data.pagination?.total || 0);    } catch (err: any) {
      setFacturas([]); // Set to empty array on error
      setTotalFacturas(0);
      const errorMessage = err.response?.data?.message || 'Error al cargar las facturas';
      setError(errorMessage);
      console.error("Error cargando facturas:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, factura: Factura) => {
    setAnchorEl(event.currentTarget);
    setFacturaMenuSeleccionada(factura);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setFacturaMenuSeleccionada(null);
  };

  const handleCreateInvoice = (factura: Factura) => {
    setFacturas(prev => [factura, ...prev]);
    setShowInvoiceForm(false);
  };

  const handlePayWithPayPal = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setShowPayPalPayment(true);
    handleMenuClose();
  };
  const handlePaymentSuccess = async (_transactionId: string) => {
    try {
      await cargarFacturas();
      setShowPayPalPayment(false);
      setFacturaSeleccionada(null);
    } catch (error) {
      console.error('Error actualizando factura:', error);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(`Error en el pago: ${error}`);
  };

  const handleMarkAsPaid = async (factura: Factura, metodoPago: 'efectivo' | 'tarjeta' | 'transferencia') => {
    try {
      await facturaService.marcarComoPagada(factura.id!, metodoPago);
      await cargarFacturas();
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al marcar como pagada');
    }
  };

  const handleCancelInvoice = async (factura: Factura) => {
    try {
      await facturaService.cancelarFactura(factura.id!);
      await cargarFacturas();
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar factura');
    }
  };

  const handleGeneratePDF = async (factura: Factura) => {
    try {
      await facturaService.generarPDF(factura.id!);
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar PDF');
    }
  };

  const handleSendEmail = async (factura: Factura) => {
    try {
      const email = factura.cliente?.email || prompt('Ingrese el email del cliente:');
      if (email) {
        await facturaService.enviarPorEmail(factura.id!, email);
        handleMenuClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar email');
    }
  };
  const filteredFacturas = Array.isArray(facturas) 
    ? facturas.filter(factura => {
        if (!filtros.busqueda) return true;
        
        const busqueda = filtros.busqueda.toLowerCase();
        return (
          factura.numeroFactura?.toLowerCase().includes(busqueda) ||
          factura.cliente?.nombre?.toLowerCase().includes(busqueda) ||
          factura.cliente?.apellidos?.toLowerCase().includes(busqueda) ||
          factura.dentista?.nombre?.toLowerCase().includes(busqueda) ||
          factura.dentista?.apellidos?.toLowerCase().includes(busqueda)
        );
      })
    : [];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Facturación
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowInvoiceForm(true)}
          >
            Nueva Factura
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="center">
            <TextField
              size="small"
              sx={{ minWidth: 200 }}
              placeholder="Buscar por factura, cliente o dentista"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                label="Estado"
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
                <MenuItem value="cancelada">Cancelada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="Desde"
              value={filtros.fechaInicio}
              onChange={(date) => setFiltros(prev => ({ ...prev, fechaInicio: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={filtros.fechaFin}
              onChange={(date) => setFiltros(prev => ({ ...prev, fechaFin: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFiltros({ busqueda: '', estado: '', fechaInicio: null, fechaFin: null })}
            >
              Limpiar Filtros
            </Button>
          </Stack>
        </Paper>

        {/* Tabla de facturas */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>N° Factura</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Dentista</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Método Pago</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron facturas
                  </TableCell>
                </TableRow>
              ) : (
                filteredFacturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {factura.numeroFactura}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {factura.cliente?.nombre} {factura.cliente?.apellidos}
                    </TableCell>
                    <TableCell>
                      Dr. {factura.dentista?.nombre} {factura.dentista?.apellidos}
                    </TableCell>
                    <TableCell>
                      {dayjs(factura.createdAt).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ${factura.total?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEstadoLabel(factura.estado)}
                        color={getEstadoColor(factura.estado) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {factura.metodoPago || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, factura)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalFacturas}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>

        {/* Menú contextual */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleGeneratePDF(facturaMenuSeleccionada!)}>
            <PdfIcon sx={{ mr: 1 }} />
            Generar PDF
          </MenuItem>
          
          <MenuItem onClick={() => handleSendEmail(facturaMenuSeleccionada!)}>
            <EmailIcon sx={{ mr: 1 }} />
            Enviar por Email
          </MenuItem>

          {facturaMenuSeleccionada?.estado === 'pendiente' && (
            <>
              <MenuItem onClick={() => handlePayWithPayPal(facturaMenuSeleccionada)}>
                <PaymentIcon sx={{ mr: 1 }} />
                Pagar con PayPal
              </MenuItem>
              
              <MenuItem onClick={() => handleMarkAsPaid(facturaMenuSeleccionada, 'efectivo')}>
                <PaymentIcon sx={{ mr: 1 }} />
                Marcar como pagada (Efectivo)
              </MenuItem>
              
              <MenuItem onClick={() => handleMarkAsPaid(facturaMenuSeleccionada, 'tarjeta')}>
                <PaymentIcon sx={{ mr: 1 }} />
                Marcar como pagada (Tarjeta)
              </MenuItem>
              
              <MenuItem onClick={() => handleMarkAsPaid(facturaMenuSeleccionada, 'transferencia')}>
                <PaymentIcon sx={{ mr: 1 }} />
                Marcar como pagada (Transferencia)
              </MenuItem>
              
              <MenuItem onClick={() => handleCancelInvoice(facturaMenuSeleccionada)}>
                <CancelIcon sx={{ mr: 1 }} />
                Cancelar Factura
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Modales */}
        <InvoiceForm
          open={showInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSubmit={handleCreateInvoice}
        />

        {facturaSeleccionada && (
          <PayPalPayment
            open={showPayPalPayment}
            onClose={() => {
              setShowPayPalPayment(false);
              setFacturaSeleccionada(null);
            }}
            factura={facturaSeleccionada}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default InvoiceList;
