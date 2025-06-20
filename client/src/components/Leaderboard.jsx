import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as AboutStyles from '../styles/AboutStyles.js'; // Reuse the About styles for consistency

const Leaderboard = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [leaderboardData_DB, setLeaderboardData] = useState([]); // state to hold leaderboard data

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  /* getting real data from DB */
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    }
    fetchLeaderboard();
  }, []);


  // Mock leaderboard data - replace with real data from your backend
  const leaderboardData = [
    { rank: 1, name: "StarConnector", score: 3, time: "2:45" },
    { rank: 2, name: "MovieBuff", score: 4, time: "3:12" },
    { rank: 3, name: "ActorLink", score: 4, time: "3:28" },
    { rank: 4, name: "FilmFan", score: 5, time: "4:15" },
    { rank: 5, name: "CinemaExpert", score: 5, time: "4:33" },
  ];

  return (
    <>
      {isOpen && (
        <div className={AboutStyles.popupOverlayStyle}>
          <div className={AboutStyles.popupContentStyle}>
            <button className={AboutStyles.popupCloseButtonStyle} onClick={handleClose}>
              <CloseIcon />
            </button>
            <div className={AboutStyles.popupBodyStyle}>
              <h2 className={AboutStyles.popupBodyH2Style}>🏆 Leaderboard</h2>
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-bold text-gray-300 border-b border-gray-600 pb-2">
                  <span>Rank</span>
                  <span>Player</span>
                  <span>Steps</span>
                  <span>Time</span>
                </div>
                {leaderboardData.map((player) => (
                  //change leaderboardData.map to leaderboardData_DB.map when using real data
                  <div key={player.rank} className="grid grid-cols-4 gap-4 text-sm text-white">
                    <span className="font-bold text-[#ffd700]">#{player.rank}</span>
                    <span>{player.name}</span>
                    <span>{player.score}</span>
                    <span>{player.time}</span>
                  </div>
                ))}
              </div>
              <p className={AboutStyles.popupBodyPStyle + " mt-4 text-center"}>
                Connect actors in the fewest steps to climb the leaderboard!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Leaderboard;