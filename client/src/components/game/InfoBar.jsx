import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import * as InfoBarStyles from '../../styles/InfoBarStyles.js'; // Import the styles
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

const InfoBar = () => {
  const { gameStarted, gameCompleted } = useGameContext();
  
  if (!gameStarted) return null;
  const { isLightMode } = useTheme();
  return (
    <div className={InfoBarStyles.infoBarBaseStyle + " " + (isLightMode ? InfoBarStyles.infoBarLightStyle : InfoBarStyles.infoBarDarkStyle)}>
      <div className={InfoBarStyles.gameStatusStyle}>
        {gameCompleted ? (
          <div className={InfoBarStyles.successMessageBaseStyle + " " + (isLightMode? InfoBarStyles.successMessageLightStyle : InfoBarStyles.successMessageDarkStyle)}>Connection Successful! 🎉</div>
        ) : (
          <div className={InfoBarStyles.successMessageBaseStyle + " " + (isLightMode? InfoBarStyles.successMessageLightStyle : InfoBarStyles.successMessageDarkStyle)}>Find a connection between the actors!</div>
        )}
      </div>
    </div>
  );
};

export default InfoBar;