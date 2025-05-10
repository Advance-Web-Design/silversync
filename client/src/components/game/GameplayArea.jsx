// New component: GameplayArea.jsx
import React from 'react';
import { Box } from '@mui/material';
import GameBoard from './GameBoard';
import SearchPanel from './SearchPanel';
import VictoryModal from './VictoryModal';
import BoardHeader from './BoardHeader';
import { useGameContext } from '../../contexts/gameContext';

function GameplayArea() {
  const { gameCompleted, keepPlayingAfterWin } = useGameContext();

  return (
    <Box className="relative flex-1 flex flex-col">
      <BoardHeader /> 
      
      <GameBoard />

      {/* SearchPanel is rendered outside the flex layout as a fixed element */}
      <SearchPanel />
      
      {/* VictoryModal no longer needs props passed from here */}
      {gameCompleted && !keepPlayingAfterWin && (
        <VictoryModal />
      )}
    </Box>
  );
}

export default GameplayArea;