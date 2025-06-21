// New component: VictoryModal.jsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useGameContext } from '../../contexts/gameContext';
import { useTheme } from '../../contexts/ThemeContext';

function VictoryModal() { 
  // Get necessary functions from context
  const { resetGame, setKeepPlayingAfterWin } = useGameContext();
  const { isLightMode } = useTheme();

  // styles for dark and light modes
  const overlayStyle = isLightMode
    ? "bg-[rgba(255,255,255,0.7)]"
    : "bg-black/70";
  const paperStyle = isLightMode
    ? "bg-white text-gray-800 border border-blue-200"
    : "!bg-slate-800 text-gray-100 border border-yellow-500/30";
  const titleStyle = isLightMode
    ? "text-blue-700 [text-shadow:0_0_8px_rgba(0,215,255,0.12)]"
    : "text-yellow-400 [text-shadow:0_0_8px_rgba(255,215,0,0.5)]";

  const dividerStyle = isLightMode
    ? "border-t border-blue-200 my-4"
    : "border-t border-yellow-700 my-4";

  return (
    <Box className={`absolute inset-0 flex items-center justify-center z-[200] transition-colors duration-300 ${overlayStyle}`}>
      <Paper
        elevation={8}
        className={`p-8 rounded-2xl max-w-md mx-auto shadow-2xl border-2 transition-colors duration-300 ${paperStyle}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2 animate-bounce">🎉</span>
          <Typography
            variant="h4"
            className={`text-center mb-2 font-extrabold tracking-wide ${titleStyle}`}
          >
            Congratulations!
          </Typography>
        </div>
        <div className={`w-full rounded-lg shadow-sm px-4 py-4 mb-8 text-center ` + (isLightMode ? "text-blue-900" : "text-yellow-300")}>
          <Typography
            className={`text-lg sm:text-xl font-semibold`}
          >
            You've successfully connected the stars!
          </Typography>
        </div>
        <div className={dividerStyle}></div>
        <Box className="flex gap-4 justify-center">
          <Button
            variant={isLightMode ? "contained" : "outlined"}
            color="primary"
            onClick={resetGame}
            className={"px-6 py-2 font-bold rounded-lg shadow"}
            style={isLightMode ? {} : { borderColor: "#ffd700" }}
          >
            New Game
          </Button>
          <Button
            variant={isLightMode ? "outlined" : "contained"}
            color="secondary"
            onClick={() => setKeepPlayingAfterWin(true)}
            className="px-6 py-2 font-bold rounded-lg shadow"
            style={isLightMode ? {} : { borderColor: "#ffd700" }}
          >
            Keep Playing
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default VictoryModal;