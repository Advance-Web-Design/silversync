// New component: GameplayArea.jsx
import React from 'react';
import { Box } from '@mui/material';
import GameBoard from './GameBoard';
import SearchPanel from './SearchPanel';
import VictoryModal from './VictoryModal';
import { useGameContext } from '../../contexts/gameContext'; // Import useGameContext

// Remove resetGame, setKeepPlayingAfterWin from props if they are only for VictoryModal
// Keep gameCompleted, keepPlayingAfterWin for conditional rendering logic here
function GameplayArea() {
  const { gameCompleted, keepPlayingAfterWin } = useGameContext(); // Get these from context

  return (
    <Box className="relative flex-1 flex flex-col">
      {/* GameBoard takes full space */}
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