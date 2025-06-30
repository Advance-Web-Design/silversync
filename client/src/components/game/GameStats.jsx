import React from 'react';
import * as GameStatStyles from '../../styles/GameStatStyles.js';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context to access light/dark mode

/**
 * GameStats component - Displays game statistics and guest appearances message
 * Receives pre-calculated values to avoid hook-related errors
 */
const GameStats = React.memo(({ 
  formattedGameScore, 
  formattedTime,
  pathLength,
  hasGuestAppearances, 
  hasSearchResults,
  gameCompleted
}) => {

  const { isLightMode } = useTheme();

  const statsDisplayClasses = [
    GameStatStyles.statsDisplayStyle,
    hasSearchResults 
      ? GameStatStyles.statsDisplaySearchResultsModifier 
      : (hasGuestAppearances ? GameStatStyles.statsDisplayGuestModifier : '')
  ].filter(Boolean).join(' ');

  const guestMessageClasses = [
    GameStatStyles.guestAppearancesMessageStyle,
    hasSearchResults ? GameStatStyles.guestAppearancesMessageSearchResultsModifier : ''
  ].filter(Boolean).join(' ');

  // Compose the stat item style for light/dark mode
  const statItemModeStyle = isLightMode
    ? GameStatStyles.statItemLightStyle
    : GameStatStyles.statItemDarkStyle;

  return (
    <>
      {/* Stats display */}
      <div 
        className={statsDisplayClasses}
        data-has-results={hasSearchResults ? 'true' : 'false'}
      >
        {gameCompleted && (
          <div className={
            `${GameStatStyles.statItemBaseStyle} ${statItemModeStyle} ` +
            (isLightMode
              ? GameStatStyles.statItemBestScoreLightStyle
              : GameStatStyles.statItemBestScoreDarkStyle)
          }>
            GAME SCORE: {formattedGameScore}
          </div>
        )}
        <div className={
          `${GameStatStyles.statItemBaseStyle} ${statItemModeStyle} ` +
          (isLightMode
            ? GameStatStyles.statItemTimerLightStyle
            : GameStatStyles.statItemTimerDarkStyle)
        }>
          TIMER: {formattedTime}
        </div>
        {gameCompleted && (
          <div className={
            `${GameStatStyles.statItemBaseStyle} ${statItemModeStyle} ` +
            (isLightMode
              ? GameStatStyles.statItemBestPathLightStyle
              : GameStatStyles.statItemBestPathDarkStyle)
          }>
            SHORTEST PATH: {pathLength}
          </div>
        )}      
      </div>
      
      {/* Guest Appearances Message */}
      {hasGuestAppearances && (
        <div className={guestMessageClasses}>
          <span>Dashed lines = Guest Star Appearances</span>
        </div>
      )}
    </>
  );
});

export default GameStats;