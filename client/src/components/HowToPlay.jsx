import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './HowToPlay.css';

function HowToPlay() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="popup-close-button" onClick={handleClose}>
              <CloseIcon />
            </button>
            <div className="popup-body">
              <h2>How to Play</h2>
              <p>Welcome to Connect the Shows! This game challenges you to find connections between TV shows and movies through actors.</p>
              <p>1. Select actors that connect different shows</p>
              <p>2. Build a path between shows using common actors</p>
              <p>3. Try to make connections with the fewest steps!</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HowToPlay;