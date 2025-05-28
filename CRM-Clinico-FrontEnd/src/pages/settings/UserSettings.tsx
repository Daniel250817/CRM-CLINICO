import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { api } from '../../services/api';
import { UserAvatar } from '../../components/common/UserAvatar';

const UserSettings = () => {
  const { mode, toggleThemeMode } = useThemeContext();
  const { user, settings: userSettings, updateSettings, updateUser, updateAvatar } = useAuth();
  const { addNotification } = useNotification();
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  // Efecto para cargar datos del usuario cuando estén disponibles
  useEffect(() => {
    if (user) {
      setUserData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || ''
      });
    }
  }, [user]);

  const handleUserDataChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    
    // Limpiar espacios para el teléfono
    if (field === 'telefono') {
      value = value.replace(/\s/g, '');
    }
    
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error al editar
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const validateFields = () => {
    const newErrors = {
      nombre: '',
      email: '',
      telefono: ''
    };

    if (!userData.nombre) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (userData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!userData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(userData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (userData.telefono && !/^[0-9]{8}$/.test(userData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener 8 dígitos sin espacios ni caracteres especiales';
    }

    setErrors(newErrors);
    return !newErrors.nombre && !newErrors.email && !newErrors.telefono;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validar campos
      if (!validateFields()) {
        addNotification('Por favor, corrija los errores antes de guardar', 'error');
        return;
      }

      // Verificar que tengamos un usuario válido
      if (!user) {
        addNotification('Error: No se pudo identificar al usuario', 'error');
        return;
      }

      // Actualizar información del usuario si cambió
      if (userData.nombre !== user.nombre || 
          userData.email !== user.email || 
          userData.telefono !== user.telefono) {
        await updateUser(user.id, {
          nombre: userData.nombre,
          email: userData.email,
          telefono: userData.telefono
        });
      }

      // Actualizar configuración si existe
      if (userSettings) {
        const updatedSettings = await updateSettings(userSettings);
        
        // Actualizar tema si cambió
        if (updatedSettings.theme !== mode) {
          toggleThemeMode();
        }
      }
      
      setSavedMessage('Configuración guardada correctamente');
      addNotification('Configuración actualizada con éxito', 'success');
      
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      addNotification(error.response?.data?.message || 'Error al guardar la configuración', 'error');
    } finally {
      setSaving(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSavedMessage(null);
      }, 3000);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar el tipo de archivo
    if (!file.type.startsWith('image/')) {
      addNotification('Por favor, selecciona un archivo de imagen válido', 'error');
      return;
    }

    // Validar el tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('La imagen no debe superar los 5MB', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const updatedUser = await updateAvatar(user.id, file);
      
      // Actualizar el estado del usuario con la nueva información
      if (updatedUser && updatedUser.settings) {
        // Actualizar el contexto de autenticación con el nuevo avatar
        await updateSettings({
          ...user.settings,
          avatar: updatedUser.settings.avatar
        });
      }
      
      addNotification('Avatar actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error al actualizar el avatar:', error);
      addNotification('Error al actualizar el avatar. Por favor, intenta nuevamente.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función para obtener la URL completa del avatar
  const getAvatarUrl = (avatarPath: string | undefined | null) => {
    console.log('Avatar Path recibido:', avatarPath);
    if (!avatarPath) {
      console.log('No hay avatar, usando default');
      return '/default-avatar.png';
    }
    if (avatarPath.startsWith('http')) {
      console.log('URL completa detectada:', avatarPath);
      return avatarPath;
    }
    // Asegurarse de que la ruta comience con /uploads
    const normalizedPath = avatarPath.startsWith('/uploads') ? avatarPath : `/uploads${avatarPath}`;
    const fullUrl = `${api.baseURL}${normalizedPath}`;
    console.log('URL construida:', fullUrl);
    return fullUrl;
  };

  // Efecto para mostrar la información del usuario cuando se carga
  useEffect(() => {
    if (user) {
      console.log('Usuario cargado:', user);
      console.log('Settings del usuario:', user.settings);
      console.log('Avatar URL:', user.settings?.avatar);
    }
  }, [user]);

  // Mostrar loading mientras no tengamos datos del usuario
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Configuración de Usuario
      </Typography>

      {savedMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {savedMessage}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Información Personal */}
        <Card>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
            }
            title="Información Personal"
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <UserAvatar
                userName={user?.nombre}
                avatarPath={user?.settings?.avatar}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mb: 2,
                  border: '3px solid',
                  borderColor: 'primary.main',
                  boxShadow: 3
                }}
              />
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
                ref={fileInputRef}
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                startIcon={uploadingAvatar ? <CircularProgress size={20} /> : null}
                sx={{ mt: 1 }}
              >
                {uploadingAvatar ? 'Subiendo...' : 'Cambiar Imagen'}
              </Button>
              {user?.settings?.avatar && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                  La imagen se actualizará automáticamente al seleccionar un nuevo archivo
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={userData.nombre}
                onChange={handleUserDataChange('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre}
              />
              <TextField
                fullWidth
                label="Correo Electrónico"
                value={userData.email}
                onChange={handleUserDataChange('email')}
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                fullWidth
                label="Teléfono"
                value={userData.telefono}
                onChange={handleUserDataChange('telefono')}
                error={!!errors.telefono}
                helperText={errors.telefono}
                placeholder="Ejemplo: 12345678"
              />
              <TextField
                fullWidth
                label="Rol"
                value={user.rol}
                disabled
              />
            </Box>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <NotificationsIcon />
              </Avatar>
            }
            title="Notificaciones"
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userSettings?.notificationEmail ?? false}
                    onChange={(e) => updateSettings({ ...(userSettings || {}), notificationEmail: e.target.checked })}
                    color="primary"
                  />
                }
                label="Recibir notificaciones por correo"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={userSettings?.notificationApp ?? false}
                    onChange={(e) => updateSettings({ ...(userSettings || {}), notificationApp: e.target.checked })}
                    color="primary"
                  />
                }
                label="Notificaciones en la aplicación"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={userSettings?.notificationSMS ?? false}
                    onChange={(e) => updateSettings({ ...(userSettings || {}), notificationSMS: e.target.checked })}
                    color="primary"
                  />
                }
                label="Recibir notificaciones por SMS"
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Apariencia y Preferencias */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PaletteIcon />
              </Avatar>
            }
            title="Apariencia y Preferencias"
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tema
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings?.theme === 'dark'}
                      onChange={(e) => updateSettings({ ...(userSettings || {}), theme: e.target.checked ? 'dark' : 'light' })}
                      color="primary"
                    />
                  }
                  label={userSettings?.theme === 'dark' ? "Modo Oscuro" : "Modo Claro"}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Idioma
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LanguageIcon color="action" />
                  <TextField
                    select
                    fullWidth
                    value={userSettings?.language ?? 'es'}
                    onChange={(e) => updateSettings({ ...(userSettings || {}), language: e.target.value })}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </TextField>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>
    </Box>
  );
};

export default UserSettings;
