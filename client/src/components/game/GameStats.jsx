import React from 'react';
// import './GameBoard.css'; // You can remove this if GameStats no longer uses direct classes from it
import * as GameStatStyles from '../../styles/GameStatStyles.js';

/**
 * GameStats component - Displays game statistics and guest appearances message
 * Receives pre-calculated values to avoid hook-related errors
 */
const GameStats = React.memo(({ 
  formattedBestScore, 
  formattedTime,
  pathLength,
  hasGuestAppearances, 
  hasSearchResults
}) => {

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

  return (
    <>
      {/* Stats display */}
      <div 
        className={statsDisplayClasses}
        data-has-results={hasSearchResults ? 'true' : 'false'} // This attribute is not for CSS class styling
      >
        <div className={`${GameStatStyles.statItemBaseStyle} ${GameStatStyles.statItemBestScoreStyle}`}>
          BEST SCORE: {formattedBestScore}
        </div>
        <div className={`${GameStatStyles.statItemBaseStyle} ${GameStatStyles.statItemTimerStyle}`}>
          TIMER: {formattedTime}
        </div>
        <div className={`${GameStatStyles.statItemBaseStyle} ${GameStatStyles.statItemBestPathStyle}`}>
          SHORTEST PATH: {pathLength}
        </div>      
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