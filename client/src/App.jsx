import React, { useEffect } from 'react';
import {GameProvider} from './contexts/GameProvider';
import GameContent from './components/game/GameContent';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline} from '@mui/material';
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

// Main App component that provides the context
function App() {
  
  useEffect(() => {
    // Initialize studio cache system on app start
    const initializeStudioCache = async () => {
      try {
        // Load from session storage first for immediate data
        const { default: studioCache } = await import('./utils/studioCache');
        studioCache.loadFromSession();
        
        // Initialize Firebase studio cache for fresh data
        const { default: firebaseStudioCache } = await import('./services/firebaseStudioCache');
        await firebaseStudioCache.initializeFromFirebase();
        
        // Register cleanup handlers for app lifecycle
        const handleGameReady = (data) => {
          console.log('🎮 Game ready event:', data);
        };
        
        firebaseStudioCache.addEventListener('gameReadyToPlay', handleGameReady);
        
        // Cleanup on component unmount
        return () => {
          firebaseStudioCache.removeEventListener('gameReadyToPlay', handleGameReady);
        };
        
      } catch (error) {
        console.warn('Studio cache initialization failed:', error);
      }
    };
    
    initializeStudioCache();
  }, []);

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