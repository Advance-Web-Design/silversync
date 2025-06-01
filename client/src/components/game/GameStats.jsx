import React from 'react';
import './GameBoard.css';

/**
 * GameStats component - Displays game statistics and guest appearances message
 * Receives pre-calculated values to avoid hook-related errors
 */
const GameStats = ({ 
  formattedBestScore, 
  formattedTime,
  pathLength,
  hasGuestAppearances, 
  hasSearchResults
}) => {
  return (
    <>
      {/* Stats display */}
      <div 
        className={`stats-display ${hasGuestAppearances ? 'with-guest-appearances' : ''} ${hasSearchResults ? 'with-search-results' : ''}`}
        data-has-results={hasSearchResults ? 'true' : 'false'}
      >
        <div className="stat-item best-score">BEST SCORE: {formattedBestScore}</div>
        <div className="stat-item timer text-[#4a6fa5]">TIMER: {formattedTime}</div>
        <div className="stat-item best-path">SHORTEST PATH: {pathLength}</div>
      </div>
      
      {/* Guest Appearances Message */}
      {hasGuestAppearances && (
        <div className={`guest-appearances-message ${hasSearchResults ? 'with-search-results' : ''}`}>
          <span>Dashed lines = Guest Star Appearances</span>
        </div>
      )}
    </>
  );
};

export default GameStats;