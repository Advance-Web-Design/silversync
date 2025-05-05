import React from 'react';
import { GameProvider, useGameContext } from './contexts/GameContext';
import Header from './components/game/Header';
import StartScreen from './components/game/StartScreen';
import GameBoard from './components/game/GameBoard';
import SearchPanel from './components/game/SearchPanel';
import LoadingOverlay from './components/game/LoadingOverlay';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Button, Paper } from '@mui/material';
import './App.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // blue-500
    },
    secondary: {
      main: '#10b981', // emerald-500
    },
    error: {
      main: '#ef4444', // red-500
    },
    background: {
      default: '#f8fafc', // slate-50
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "Avenir", "Helvetica", "Arial", sans-serif',
  },
});

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

// Main App component that provides the context
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameProvider>
        <GameContent />
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
