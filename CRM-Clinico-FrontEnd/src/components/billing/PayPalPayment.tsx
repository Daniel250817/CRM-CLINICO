import React, { useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import type { Factura } from '../../services/facturaService';
import facturaService from '../../services/facturaService';

interface PayPalPaymentProps {
  open: boolean;
  onClose: () => void;
  factura: Factura;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

const PayPalButtonWrapper: React.FC<{
  factura: Factura;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}> = ({ factura, onSuccess, onError }) => {
  const [{ isResolved }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isResolved) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
        <Typography ml={2}>Cargando PayPal...</Typography>
      </Box>
    );
  }

  return (
    <PayPalButtons
      disabled={isProcessing}
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      }}
      createOrder={async () => {
        try {
          setIsProcessing(true);
          const response = await facturaService.crearOrdenPayPal(factura.id!);
          return response.orderID;
        } catch (error) {
          console.error('Error creando orden PayPal:', error);
          onError('Error al crear la orden de pago');
          setIsProcessing(false);
          throw error;
        }
      }}
      onApprove={async (data) => {
        try {
          const response = await facturaService.capturarPagoPayPal(factura.id!, {
            paypalOrderId: data.orderID,
            transaccionId: data.paymentID || data.orderID
          });
          
          onSuccess(response.transaccionId);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error capturando pago:', error);
          onError('Error al procesar el pago');
          setIsProcessing(false);
        }
      }}
      onError={(err) => {
        console.error('Error PayPal:', err);
        onError('Error en el proceso de pago');
        setIsProcessing(false);
      }}
      onCancel={() => {
        setIsProcessing(false);
      }}
    />
  );
};

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  open,
  onClose,
  factura,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentStatus('success');
    onPaymentSuccess(transactionId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setErrorMessage(error);
    onPaymentError(error);
  };
  const paypalOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sandbox_client_id',
    currency: 'USD',
    intent: 'capture'
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Pago con PayPal
      </DialogTitle>
      
      <DialogContent>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Factura #{factura.numeroFactura}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Cliente: {factura.cliente?.nombre} {factura.cliente?.apellidos}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            Total: ${factura.total.toFixed(2)}
          </Typography>
        </Box>

        {paymentStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {paymentStatus === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Pago procesado exitosamente!
          </Alert>
        )}

        {paymentStatus !== 'success' && (
          <PayPalScriptProvider options={paypalOptions}>
            <PayPalButtonWrapper
              factura={factura}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </PayPalScriptProvider>
        )}

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            Servicios incluidos:
          </Typography>
          {factura.servicios.map((servicio, index) => (
            <Box key={index} display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="body2">
                {servicio.nombre} x{servicio.cantidad}
              </Typography>
              <Typography variant="body2">
                ${(servicio.precio * servicio.cantidad).toFixed(2)}
              </Typography>
            </Box>
          ))}
          
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">${factura.subtotal.toFixed(2)}</Typography>
            </Box>
            {factura.impuestos > 0 && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Impuestos:</Typography>
                <Typography variant="body2">${factura.impuestos.toFixed(2)}</Typography>
              </Box>
            )}
            {factura.descuento > 0 && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Descuento:</Typography>
                <Typography variant="body2" color="success.main">
                  -${factura.descuento.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                ${factura.total.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={paymentStatus === 'processing'}>
          {paymentStatus === 'success' ? 'Cerrar' : 'Cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayPalPayment;
