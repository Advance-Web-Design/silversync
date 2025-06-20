import React from 'react';
import {GameProvider} from './contexts/GameProvider';
import GameContent from './components/game/GameContent';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext.jsx';
import { CssBaseline} from '@mui/material';
// import './App.css';
import { appContainerClasses } from './styles/appStyle'; // Import the classes

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
      <CustomThemeProvider>
      <div className={appContainerClasses}> {/* Use the imported class string */}
        <GameProvider>
          <GameContent />
        </GameProvider>
      </div>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

export default App;