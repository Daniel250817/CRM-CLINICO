import { api } from '../services/api';

export const useAvatar = () => {
  const getAvatarUrl = (avatarPath: string | undefined | null): string => {
    // Si no hay avatar, retornar la imagen por defecto
    if (!avatarPath) {
      return '/default-avatar.png';
    }

    try {
      // Si es una URL completa, validarla y devolverla
      if (avatarPath.startsWith('http')) {
        const url = new URL(avatarPath);
        return url.toString();
      }

      // Obtener la base URL del API
      const baseUrl = api.baseURL || 'http://localhost:3001';

      // Remover '/api' del final de la URL base si existe
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');

      // Si comienza con /uploads, construir la URL completa
      if (avatarPath.startsWith('/uploads')) {
        return `${cleanBaseUrl}${avatarPath}`;
      }

      // Para cualquier otra ruta, asegurarse de que tenga el prefijo /uploads
      const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
      return `${cleanBaseUrl}/uploads${normalizedPath}`;

    } catch (error) {
      console.error('Error al procesar la URL del avatar:', error);
      return '/default-avatar.png'; // En caso de error, usar la imagen por defecto
    }
  };

  return { getAvatarUrl };
}; 