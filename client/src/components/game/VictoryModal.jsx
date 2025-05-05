// New component: VictoryModal.jsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

function VictoryModal({ resetGame, onKeepPlaying }) {
  return (
    <Box className="absolute inset-0 bg-black/70 flex items-center justify-center">
      <Paper elevation={6} className="p-6 rounded-xl max-w-md mx-auto">
        <Typography variant="h4" className="text-center mb-4 font-bold text-indigo-800">
          Congratulations! 🎉
        </Typography>
        <Typography className="text-center mb-8 text-gray-700">
          You've successfully connected the stars!
        </Typography>
        <Box className="flex gap-4 justify-center">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={resetGame}
            className="px-5"
          >
            New Game
          </Button>
          <Button
            variant="outlined"
            onClick={onKeepPlaying}
            className="px-5"
          >
            Keep Playing
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default VictoryModal;