import React from 'react';
import {GameProvider} from './contexts/GameContext';
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
