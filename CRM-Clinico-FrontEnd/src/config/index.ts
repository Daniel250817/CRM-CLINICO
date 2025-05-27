/**
 * Configuración global de la aplicación
 */

interface EnvConfig {
  API_BASE_URL: string;
  DEBUG: boolean;
}

// Configuración unificada usando variables de entorno de Vite
const config: EnvConfig = {
  // Usar VITE_API_URL de las variables de entorno, con valores por defecto según el modo
  API_BASE_URL: import.meta.env.VITE_API_URL || 
                (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://api.crm-clinico.com/api'),
  // Debug automáticamente activado en desarrollo
  DEBUG: import.meta.env.DEV
};

export default config;
