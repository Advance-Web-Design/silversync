import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import StartScreen from '../StartScreen';
import ChallengeScreen from '../ChallengeScreen';
import GameplayArea from './GameplayArea';
import { Box } from '@mui/material';

function GameContent() {
  const { 
    gameStarted, 
    gameCompleted,
    keepPlayingAfterWin, 
    resetGame, 
    setKeepPlayingAfterWin,
    currentScreen
  } = useGameContext();
  
  const renderScreen = () => {
    // If game is started, show gameplay area
    if (gameStarted) {
      return (
        <GameplayArea 
          gameCompleted={gameCompleted}
          keepPlayingAfterWin={keepPlayingAfterWin}
          resetGame={resetGame}
          setKeepPlayingAfterWin={setKeepPlayingAfterWin}
        />
      );
    }

    // Otherwise, show the appropriate screen based on currentScreen state
    switch (currentScreen) {
      case 'challenges':
        return <ChallengeScreen />;
      case 'actor-selection':
        return <StartScreen />;
      case 'start':
      default:
        return <ChallengeScreen />;
    }
  };
  
  return (
    <Box 
      className="flex flex-col min-h-screen"
      sx={{
        backgroundColor: !gameStarted ? 'black' : 'transparent',
      }}
    >
      {renderScreen()}
    </Box>
  );
}

export default GameContent;