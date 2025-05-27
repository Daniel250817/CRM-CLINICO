import { useState } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Divider, 
  Select, 
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Fab
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Build as BuildIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../services/authService';

/**
 * Componente de herramientas de desarrollo para facilitar tareas como simular autenticación
 * Este componente solo se muestra en entorno de desarrollo
 */
const DevTools = () => {
  const { login, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  
  // Esta función solo debería estar disponible en desarrollo
  const handleMockLogin = async () => {
    // Usuario simulado según el rol seleccionado
    const mockUser = {
      id: 1,
      nombre: `Usuario ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
      email: `${selectedRole}@example.com`,
      rol: selectedRole as User['rol'],
      estado: 'activo' as const,
      ultimo_acceso: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulamos el token (en un caso real, esto vendría del backend)
    localStorage.setItem('token', 'mock-jwt-token');
    
    // Simulamos la llamada a la API de login
    try {
      // Usamos login con credenciales falsas, pero en realidad estamos simulando el login
      await login(mockUser.email, 'password123', true);
    } catch (error) {
      console.error('Error al simular login:', error);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setSelectedRole(event.target.value);
  };

  const toggleDevTools = () => {
    setIsOpen(!isOpen);
  };

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Botón flotante para abrir las DevTools */}
      <Fab 
        color="primary" 
        size="small" 
        onClick={toggleDevTools}
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          zIndex: 1000
        }}
      >
        {isOpen ? <CloseIcon /> : <BuildIcon />}
      </Fab>

      {/* Panel de DevTools */}
      {isOpen && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 72,
            right: 16,
            width: 320,
            p: 2,
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Herramientas de Desarrollo
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Estado de autenticación
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={isAuthenticated} 
                  onChange={isAuthenticated ? logout : handleMockLogin} 
                />
              }
              label={isAuthenticated ? "Autenticado" : "No autenticado"}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="mock-role-label">Rol para login simulado</InputLabel>
              <Select
                labelId="mock-role-label"
                id="mock-role-select"
                value={selectedRole}
                label="Rol para login simulado"
                onChange={handleRoleChange}
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="dentista">Dentista</MenuItem>
                <MenuItem value="asistente">Asistente</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button 
            variant="contained" 
            onClick={handleMockLogin} 
            fullWidth
            disabled={isAuthenticated}
          >
            Simular Login
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={logout} 
            fullWidth 
            sx={{ mt: 1 }}
            disabled={!isAuthenticated}
          >
            Simular Logout
          </Button>
        </Paper>
      )}
    </>
  );
};

export default DevTools;
