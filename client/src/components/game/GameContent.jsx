import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import StartScreen from '../StartScreen';
import GameplayArea from './GameplayArea';
import { Box } from '@mui/material';

import Profile from '../Profile';
import ProfileHeader from '../ProfileHeader';
import Leaderboard from '../Leaderboard';
import ChallengeMode from '../ChallengeMode';
import Register from '../Register';
import Login from '../Login';


function GameContent() {
  const { 
    gameStarted, 
    gameCompleted,
    keepPlayingAfterWin, 
    resetGame, 
    setKeepPlayingAfterWin 
  } = useGameContext();
  
  return (
    <Box 
      className="flex flex-col h-screen" // Keep other Tailwind classes
      sx={{
        backgroundColor: !gameStarted ? 'black' : 'transparent', // Or your desired default
        // Potentially set to theme.palette.background.default if you want to use MUI theme's default
      }}
    >
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