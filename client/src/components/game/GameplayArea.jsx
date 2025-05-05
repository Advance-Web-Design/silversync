// New component: GameplayArea.jsx
import React from 'react';
import { Box } from '@mui/material';
import GameBoard from './GameBoard';
import SearchPanel from './SearchPanel';
import VictoryModal from './VictoryModal';

function GameplayArea({ gameCompleted, keepPlayingAfterWin, resetGame, setKeepPlayingAfterWin }) {
  return (
    <Box className="relative flex-1 flex flex-col">
      {/* GameBoard takes full space */}
      <GameBoard />
      
      {/* SearchPanel is rendered outside the flex layout as a fixed element */}
      <SearchPanel />
      
      {gameCompleted && !keepPlayingAfterWin && (
        <VictoryModal 
          resetGame={resetGame}
          onKeepPlaying={() => setKeepPlayingAfterWin(true)}
        />
      )}
    </Box>
  );
}

export default GameplayArea;