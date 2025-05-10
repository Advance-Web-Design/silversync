import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import './InfoBar.css';

const InfoBar = () => {
  const { gameStarted, gameCompleted } = useGameContext();
  
  if (!gameStarted) return null;

  return (
    <div className="info-bar">
      <div className="game-status">
        {gameCompleted ? (
          <div className="success-message">Connection Successful! 🎉</div>
        ) : (
          <div className="goal-message">Find a connection between the actors!</div>
        )}
      </div>
    </div>
  );
};

export default InfoBar;