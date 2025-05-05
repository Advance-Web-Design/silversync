import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingOverlay = () => {
  return (
    <Box className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Box className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-3">
        <CircularProgress color="primary" size={40} />
        <Typography variant="h6" className="text-gray-800">
          Loading...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;