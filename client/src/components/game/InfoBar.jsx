import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import * as InfoBarStyles from '../../styles/InfoBarStyles.js'; // Import the styles


const InfoBar = () => {
  const { gameStarted, gameCompleted } = useGameContext();
  
  if (!gameStarted) return null;

  return (
    <div className={InfoBarStyles.infoBar}>
      <div className={InfoBarStyles.gameStatusStyle}>
        {gameCompleted ? (
          <div className={InfoBarStyles.successMessageStyle}>Connection Successful! 🎉</div>
        ) : (
          <div className={InfoBarStyles.successMessageStyle}>Find a connection between the actors!</div>
        )}
      </div>
    </div>
  );
};

export default InfoBar;