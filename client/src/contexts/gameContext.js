import { createContext, useContext } from 'react';

// Create context for game state management
export const GameContext = createContext(undefined);

// Custom hook for components to access game context
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};