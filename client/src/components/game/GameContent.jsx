import React from 'react';
import { useGameContext } from '../../contexts/GameContext';
import Header from './Header';
import StartScreen from './StartScreen';
import GameplayArea from './GameplayArea';
import LoadingOverlay from './LoadingOverlay';
import { Box } from '@mui/material';

function GameContent() {
  const { 
    gameStarted, 
    isLoading, 
    gameCompleted,
    keepPlayingAfterWin, 
    resetGame, 
    setKeepPlayingAfterWin 
  } = useGameContext();
  
  return (
    <Box className={`flex flex-col h-screen ${!gameStarted ? 'bg-black' : ''}`}>
      {gameStarted && <Header />}
      
      {isLoading && <LoadingOverlay />}
      
      {!gameStarted ? ( <StartScreen /> ) : ( <GameplayArea 
          gameCompleted={gameCompleted}
          keepPlayingAfterWin={keepPlayingAfterWin}
          resetGame={resetGame}
          setKeepPlayingAfterWin={setKeepPlayingAfterWin}
        />
      )}
    </Box>
  );
}

export default GameContent;