/**
 * Configuración de API para servicios
 */

// Usar VITE_API_URL de las variables de entorno, con valores por defecto según el modo
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
                            (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://api.crm-clinico.com/api');

// Exportar también como default para compatibilidad
export default {
  API_BASE_URL
};
