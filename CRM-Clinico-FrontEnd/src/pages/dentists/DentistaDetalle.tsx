import React from 'react';
import { Avatar, Box, Paper } from '@mui/material';

const DentistaDetalle = ({ dentista }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
        {/* Avatar y datos principales */}
        <Avatar
          src={dentista.usuario?.avatar}
          alt={dentista.usuario?.nombre}
          sx={{ width: 120, height: 120, fontSize: '3rem' }}
        >
          {dentista.usuario?.nombre?.charAt(0)}
        </Avatar>
      </Box>
    </Paper>
  );
};

export default DentistaDetalle; 