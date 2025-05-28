import { useState } from 'react';
import { Avatar, type AvatarProps } from '@mui/material';
import { useAvatar } from '../../hooks/useAvatar';

interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  userName?: string;
  avatarPath?: string | null;
}

export const UserAvatar = ({ userName, avatarPath, sx, ...props }: UserAvatarProps) => {
  const [error, setError] = useState(false);
  const { getAvatarUrl } = useAvatar();

  const handleError = () => {
    console.warn('Error al cargar el avatar:', avatarPath);
    setError(true);
  };

  // Si hay un error o no hay avatarPath, mostrar las iniciales
  if (error || !avatarPath) {
    return (
      <Avatar 
        {...props}
        sx={{ 
          bgcolor: 'primary.main',
          ...sx
        }}
      >
        {userName?.charAt(0)?.toUpperCase() || '?'}
      </Avatar>
    );
  }

  // Obtener la URL del avatar
  const avatarUrl = getAvatarUrl(avatarPath);

  return (
    <Avatar
      {...props}
      src={avatarUrl}
      onError={handleError}
      sx={sx}
      imgProps={{
        crossOrigin: 'anonymous',
        loading: 'lazy',
        ...props.imgProps
      }}
    >
      {userName?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}; 