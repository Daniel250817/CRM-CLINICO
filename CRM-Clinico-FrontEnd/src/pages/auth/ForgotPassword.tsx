import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Email as EmailIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import authService from '../../services/authService';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Ingresa un email válido')
    .required('El email es requerido')
});

const ForgotPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleThemeMode } = useThemeContext();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setSuccessMessage(null);

      try {
        const response = await authService.requestPasswordReset(values.email);
        setSuccessMessage(response.message);
        addNotification('Se envió el código de recuperación', 'success');
        navigate('/reset-password', { replace: true });
      } catch (error: any) {
        const message = error?.message || 'No se pudo solicitar la recuperación de contraseña';
        addNotification(message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 4,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #07111f 0%, #0f172a 50%, #111827 100%)'
          : 'linear-gradient(135deg, #eef4ff 0%, #f8fafc 45%, #e6fff6 100%)'
      }}
    >
      <IconButton
        onClick={toggleThemeMode}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          bgcolor: theme.palette.background.paper,
          boxShadow: 2,
          '&:hover': { bgcolor: theme.palette.action.hover }
        }}
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>

      <Paper
        elevation={theme.palette.mode === 'dark' ? 2 : 10}
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1024,
          overflow: 'hidden',
          borderRadius: 4,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(17,24,39,0.92)' : '#ffffff'
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: '42%',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            p: 5,
            background: 'linear-gradient(160deg, #1E60FA 0%, #0b6b87 48%, #0f766e 100%)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 35%)'
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
            <MedicalServicesIcon sx={{ fontSize: 60, mb: 3 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Recupera tu acceso
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92 }}>
              Te enviaremos un enlace seguro para restablecer tu contraseña.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
              <MedicalServicesIcon />
            </Avatar>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              ¿Olvidaste tu contraseña?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ingresa tu correo y te enviaremos un código OTP para validar tu acceso.
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage} Ya puedes ingresar el código que recibiste en la siguiente pantalla.
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Correo electrónico"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {isLoading ? 'Enviando código...' : 'Enviar código de recuperación'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<ArrowBackIcon />}
              variant="text"
            >
              Volver al login
            </Button>
            <Typography variant="body2" color="text.secondary" align="right">
              Revisa también tu carpeta de spam si no ves el correo.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;