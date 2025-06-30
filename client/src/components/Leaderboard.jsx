import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as AboutStyles from '../styles/AboutStyles.js'; // Reuse the About styles for consistency
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context to access light/dark mode
import { fetchLeaderboard } from '../services/firebaseService';

const Leaderboard = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]); // state to hold leaderboard data
  const [allLeaderboards, setAllLeaderboards] = useState({});
  const [selectedChallenge, setSelectedChallenge] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  /* getting real data from DB */
  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all leaderboards
        const allData = await fetchLeaderboard('all');
        setAllLeaderboards(allData);
        
        // Set initial display data (show first available challenge or empty array)
        const challengeKeys = Object.keys(allData);
        if (challengeKeys.length > 0) {
          const firstChallenge = challengeKeys[0];
          setSelectedChallenge(firstChallenge);
          setLeaderboardData(allData[firstChallenge] || []);
        } else {
          setLeaderboardData([]);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard data');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboardData();
  }, []);

  const handleChallengeChange = (challengeId) => {
    setSelectedChallenge(challengeId);
    setLeaderboardData(allLeaderboards[challengeId] || []);
  };

  const formatTime = (timeValue) => {
    if (typeof timeValue === 'number') {
      const minutes = Math.floor(timeValue / 60);
      const seconds = timeValue % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return timeValue || 'N/A';
  };

  const getChallengeDisplayName = (challengeId) => {
    const challengeNames = {
      'for-fun': 'For Fun',
      'classic': 'Classic',
      'no-marvel': 'No Marvel',
      'no-dc': 'No DC',
      'movies-only': 'Movies Only',
      'tv-only': 'TV Only',
      'no-disney': 'No Disney',
      'Nathan': 'Developer Challenge'
    };
    return challengeNames[challengeId] || challengeId;
  };

  const getTrophyIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇'; // Gold trophy
      case 2:
        return '🥈'; // Silver trophy
      case 3:
        return '🥉'; // Bronze trophy
      default:
        return null;
    }
  };

  const getRankDisplay = (rank) => {
    const trophy = getTrophyIcon(rank);
    return trophy ? `${trophy} #${rank}` : `#${rank}`;
  };

  const { isLightMode } = useTheme(); // Get the current theme mode
  
  return (
    <>
      {isOpen && (        <div className={AboutStyles.popupOverlayBaseStyle + " " +
                  (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)}>          <div className={`${AboutStyles.popupContentBaseStyle} max-w-6xl w-full ` +
                    (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)}>
            <button className={AboutStyles.popupCloseButtonBaseStyle + " " +
                        (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)} 
                    onClick={handleClose}>
              <CloseIcon />
            </button>            <div className={AboutStyles.popupBodyStyle}>
              <h2 className={AboutStyles.popupBodyH2BaseStyle + " " +
                        (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)}>
                🏆 Leaderboard
              </h2>
                {/* Challenge Selector */}
              {Object.keys(allLeaderboards).length > 0 && (
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isLightMode ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Challenge:
                  </label>
                  <select 
                    value={selectedChallenge} 
                    onChange={(e) => handleChallengeChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded border focus:outline-none transition-colors ${
                      isLightMode 
                        ? 'bg-white text-gray-800 border-gray-300 focus:border-blue-500' 
                        : 'bg-gray-700 text-white border-gray-600 focus:border-[#ffd700]'
                    }`}
                  >
                    {Object.keys(allLeaderboards).map(challengeId => (
                      <option key={challengeId} value={challengeId}>
                        {getChallengeDisplayName(challengeId)}
                      </option>
                    ))}
                  </select>
                </div>
              )}              <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <span className={isLightMode ? 'text-gray-600' : 'text-gray-300'}>
                      Loading leaderboard...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <span className="text-red-400">{error}</span>
                  </div>
                ) : leaderboardData.length > 0 ? (                 
                   <>                 <div className={`grid grid-cols-6 gap-1 sm:gap-2 md:gap-4 lg:gap-8 text-xs sm:text-sm font-bold border-b pb-2 ${
                      isLightMode 
                        ? 'text-gray-700 border-gray-300' 
                        : 'text-gray-300 border-gray-600'
                    }`}>
                      <span className="text-center">Rank</span>
                      <span className="truncate">Player</span>
                      <span className="text-center">Score</span>
                      <span className="text-center">Time</span>
                      <span className="text-center">Path</span>
                      <span className="text-center text-xs sm:text-sm">Actors</span>
                    </div>
                    {leaderboardData.map((player) => (                      
                      <div key={`${player.username}-${player.rank}`} 
                           className={`grid grid-cols-6 gap-1 sm:gap-2 md:gap-4 lg:gap-8 text-xs sm:text-sm py-2 border-b border-opacity-30 ${
                             isLightMode ? 'text-gray-800 border-gray-200' : 'text-white border-gray-700'
                           } ${player.rank <= 3 ? 'bg-gradient-to-r from-transparent via-yellow-50/10 to-transparent' : ''}`}>
    
                        <span className={`font-bold text-center text-xs sm:text-sm ${
                          player.rank === 1 ? (isLightMode ? 'text-yellow-600' : 'text-yellow-400') :
                          player.rank === 2 ? (isLightMode ? 'text-gray-600' : 'text-gray-300') :
                          player.rank === 3 ? (isLightMode ? 'text-amber-600' : 'text-amber-400') :
                          (isLightMode ? 'text-blue-600' : 'text-[#ffd700]')
                        }`}>
                          {getRankDisplay(player.rank)}
                        </span>
    
                        <span className="truncate font-medium text-xs sm:text-sm" title={player.username}>
                          {player.username}
                        </span>
    
                        <span className="text-center font-semibold text-xs sm:text-sm">
                          {player.score}
                        </span>
    
                        <span className="text-center text-xs sm:text-sm">
                          {formatTime(player.time)}
                        </span>
    
                        <span className="text-center text-xs sm:text-sm">
                          {player.pathLength || 'N/A'}
                        </span>
    
                        <span className="text-xs leading-tight overflow-hidden" title={`${player.startingActor1} → ${player.startingActor2}`}>
                          {player.startingActor1 && player.startingActor2 
                            ? (
                              <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 text-xs">
                                <span className={`font-medium truncate max-w-full ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>
                                  {player.startingActor1.split(' ')[0]} {/* Show only first name on mobile */}
                                </span>
                                <span className="text-gray-500 font-bold hidden sm:inline">→</span>
                                <span className={`font-medium truncate max-w-full ${isLightMode ? 'text-green-700' : 'text-green-300'}`}>
                                  {player.startingActor2.split(' ')[0]} {/* Show only first name on mobile */}
                                </span>
                              </div>
                            )
                            : <span className="text-xs">N/A</span>
                          }
                        </span>
                      </div>
                    ))}
                  </>                ) : (
                  <div className="text-center py-4">
                    <span className={isLightMode ? 'text-gray-600' : 'text-gray-300'}>
                      No games recorded yet for this challenge
                    </span>
                  </div>
                )}
              </div>              <p className={AboutStyles.popupBodyPBaseStyle + " " +
                      (isLightMode ? AboutStyles.popupBodyPLightStyle : AboutStyles.popupBodyPDarkStyle) + 
                      " mt-4 text-center"}>
                Complete games faster with higher scores to climb the leaderboard!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Leaderboard;