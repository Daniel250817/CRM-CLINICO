import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Checkbox, 
  FormControlLabel,
  InputAdornment,
  IconButton,
  Avatar,
  Alert,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon, 
  Lock as LockIcon,
  MedicalServices as MedicalServicesIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useThemeContext } from '../../contexts/ThemeContext';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Ingresa un email válido')
    .required('El email es requerido'),
  password: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es requerida'),
});

interface LoginProps {
  onLogin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const theme = useTheme();
  const { mode, toggleThemeMode } = useThemeContext();
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Cargar email recordado si existe
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      formik.setFieldValue('email', rememberedEmail);
      formik.setFieldValue('rememberMe', true);
    }
  }, []);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoginError(null);
      setIsLoading(true);
      
      try {
        // Llamar al servicio de autenticación a través del contexto
        await login(values.email, values.password, values.rememberMe);
        
        // Si todo va bien y hay un callback, ejecutarlo
        if (onLogin) {
          onLogin();
        }
      } catch (error: any) {
        console.error('Error al iniciar sesión:', error);
        
        // Mostrar un mensaje de error específico o genérico
        if (error.response?.data?.message) {
          setLoginError(error.response.data.message);
        } else {
          setLoginError('Error al iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.');
        }
        
        addNotification('Error al iniciar sesión', 'error');
      } finally {
        setIsLoading(false);
      }
    },
  });
  // Función eliminada de inicio de sesión con servicios externos

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default 
          : '#f8f9fe',
        p: 3,
      }}
    >
      {/* Botón para cambiar el tema */}
      <IconButton
        onClick={toggleThemeMode}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          bgcolor: theme.palette.background.paper,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>

      {/* Contenedor principal con forma de cuadrado */}
      <Paper
        elevation={theme.palette.mode === 'dark' ? 2 : 6}
        sx={{
          display: 'flex',
          maxWidth: 1000,
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper
            : '#fff',
        }}
      >
        {/* Banner lateral con imagen y color de fondo - Lado izquierdo */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            width: '50%',
            bgcolor: 'primary.main',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: '150%',
              height: '150%',
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)',
              top: '-25%',
              left: '-25%',
            }}
          />
          
          <Box 
            sx={{ 
              zIndex: 1, 
              maxWidth: 400,
              p: 5, 
              color: 'white',
              textAlign: 'center' 
            }}
          >
            <MedicalServicesIcon sx={{ fontSize: 60, mb: 3 }} />
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
              CRM Odontológico
            </Typography>
            <Typography variant="h6" gutterBottom>
              Gestión completa para clínicas dentales
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
              Administre pacientes, citas, tratamientos y más en una plataforma intuitiva y eficiente.
            </Typography>
          </Box>
        </Box>

        {/* Panel de login - Lado derecho */}
        <Box 
          sx={{ 
            width: { xs: '100%', md: '50%' }, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 3, md: 5 },
            bgcolor: theme.palette.mode === 'dark' 
              ? theme.palette.background.paper
              : '#fff',
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            {/* Solo mostrar avatar en vista móvil, ya que en desktop está en el lado izquierdo */}
            <Box
              sx={{
                display: { xs: 'block', md: 'none' },
                mb: 3,
              }}
            >
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 64, 
                height: 64, 
                margin: '0 auto',
                mb: 2
              }}>
                <MedicalServicesIcon fontSize="large" />
              </Avatar>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              ¡Bienvenido!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Ingresa a tu cuenta para administrar tu clínica dental
            </Typography>
          </Box>

          {loginError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {loginError}
            </Alert>
          )}
          
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              variant="outlined"
              margin="normal"
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
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.23)' 
                      : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.4)'
                      : 'rgba(0, 0, 0, 0.4)',
                  },
                },
                '& input:-webkit-autofill': {
                  '-webkit-background-clip': 'text',
                  '-webkit-text-fill-color': theme.palette.mode === 'dark' ? '#fff' : '#000',
                  'transition': 'background-color 5000s ease-in-out 0s',
                  'box-shadow': 'none',
                  'background-color': 'transparent !important',
                },
              }}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
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
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.23)' 
                      : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.4)'
                      : 'rgba(0, 0, 0, 0.4)',
                  },
                },
                '& input:-webkit-autofill': {
                  '-webkit-background-clip': 'text',
                  '-webkit-text-fill-color': theme.palette.mode === 'dark' ? '#fff' : '#000',
                  'transition': 'background-color 5000s ease-in-out 0s',
                  'box-shadow': 'none',
                  'background-color': 'transparent !important',
                },
              }}
            />

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              mb: 3,
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label="Recordar mi email"
              />
              <Typography 
                variant="body2" 
                color="primary"
                sx={{ cursor: 'pointer', fontWeight: 'medium' }}
              >
                ¿Olvidó su contraseña?
              </Typography>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>          {/* Sección de login externo eliminada */}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tiene una cuenta?{' '}
              <Typography 
                component="span" 
                variant="body2" 
                color="primary"
                sx={{ fontWeight: 'medium', cursor: 'pointer' }}
              >
                Contacte a soporte
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;