import React from 'react';
import {useGameContext} from '../../contexts/GameContext';
import Header from './Header';
import StartScreen from './StartScreen';
import GameBoard from './GameBoard';
import SearchPanel from './SearchPanel';
import LoadingOverlay from './LoadingOverlay';
import {Box, Typography, Button, Paper} from '@mui/material';

// Content component that accesses the context
function GameContent() {
    const { 
      gameStarted, 
      isLoading, 
      gameCompleted,
      keepPlayingAfterWin, 
      resetGame, 
      setKeepPlayingAfterWin 
    } = useGameContext();
    
    // Add debugging log
    console.log('Game component rendering: ', { gameStarted, isLoading });
  
    return (
      <Box className={`flex flex-col h-screen ${!gameStarted ? 'bg-black' : ''}`}>
        {gameStarted && <Header />}
        
        {isLoading && <LoadingOverlay />}
        
        {!gameStarted ? (
          <StartScreen />
        ) : (
          <Box className="relative flex-1 flex flex-col">
            {/* GameBoard takes full space */}
            <GameBoard />
            
            {/* SearchPanel is rendered outside the flex layout as a fixed element */}
            {gameStarted && <SearchPanel />}
            
            {gameCompleted && !keepPlayingAfterWin && (
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
                      onClick={() => resetGame()}
                      className="px-5"
                    >
                      New Game
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setKeepPlayingAfterWin(true)}
                      className="px-5"
                    >
                      Keep Playing
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

export default GameContent;