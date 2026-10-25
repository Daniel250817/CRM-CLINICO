import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import {
  ArrowBack as ArrowBackIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Lock as LockIcon,
  MedicalServices as MedicalServicesIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import authService from '../../services/authService';

type ResetValues = {
  otp: string;
  password: string;
  passwordConfirm: string;
};

const ResetPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleThemeMode } = useThemeContext();
  const { addNotification } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const validate = (values: ResetValues) => {
    const errors: Partial<Record<keyof ResetValues, string>> = {};

    if (!values.otp) {
      errors.otp = 'El código es requerido';
    } else if (!/^\d{6}$/.test(values.otp)) {
      errors.otp = 'El código debe tener 6 dígitos';
    }

    if (isTokenVerified) {
      if (!values.password) {
        errors.password = 'La contraseña es requerida';
      } else if (values.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!values.passwordConfirm) {
        errors.passwordConfirm = 'Confirma tu contraseña';
      } else if (values.password !== values.passwordConfirm) {
        errors.passwordConfirm = 'Las contraseñas no coinciden';
      }
    }

    return errors;
  };

  const formik = useFormik<ResetValues>({
    initialValues: {
      otp: '',
      password: '',
      passwordConfirm: ''
    },
    validate,
    onSubmit: async (values) => {
      if (!isTokenVerified) {
        setIsLoading(true);
        setSuccessMessage(null);

        try {
          const response = await authService.verifyPasswordResetToken(values.otp);
          setVerifiedToken(values.otp);
          setIsTokenVerified(true);
          setSuccessMessage(response.message);
          addNotification('Código verificado correctamente', 'success');
        } catch (error: any) {
          const message = error?.message || 'No se pudo verificar el código de recuperación';
          addNotification(message, 'error');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const tokenToUse = verifiedToken || values.otp;
        const response = await authService.resetPassword(tokenToUse, {
          password: values.password,
          passwordConfirm: values.passwordConfirm
        });
        setSuccessMessage(response.message);
        addNotification('Contraseña actualizada correctamente', 'success');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1800);
      } catch (error: any) {
        const message = error?.message || 'No se pudo restablecer la contraseña';
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
            background: 'linear-gradient(160deg, #0f766e 0%, #1E60FA 55%, #0b6b87 100%)'
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
              Define una nueva clave
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92 }}>
              Valida el código OTP y después define una nueva contraseña segura.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
              <LockIcon />
            </Avatar>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Restablecer contraseña
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Escribe primero el código que recibiste por correo. Cuando sea válido, podrás crear tu nueva contraseña.
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity={isTokenVerified ? 'success' : 'info'} sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="otp"
              name="otp"
              label="Código OTP"
              value={formik.values.otp}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isTokenVerified}
              error={formik.touched.otp && Boolean(formik.errors.otp)}
              helperText={formik.touched.otp && formik.errors.otp}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            {isTokenVerified && (
              <>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((value) => !value)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  id="passwordConfirm"
                  name="passwordConfirm"
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formik.values.passwordConfirm}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.passwordConfirm && Boolean(formik.errors.passwordConfirm)}
                  helperText={formik.touched.passwordConfirm && formik.errors.passwordConfirm}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 3 }}
                />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {isLoading
                ? (isTokenVerified ? 'Actualizando contraseña...' : 'Verificando código...')
                : (isTokenVerified ? 'Restablecer contraseña' : 'Verificar código')}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/forgot-password"
              startIcon={<ArrowBackIcon />}
              variant="text"
            >
              Solicitar nuevo código
            </Button>
            <Typography variant="body2" color="text.secondary" align="right">
              Usa una contraseña que no hayas utilizado antes.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;