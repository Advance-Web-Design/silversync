import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as PopupStyles from '../styles/AboutStyles.js'; // Using a generic name like PopupStyles

function HowToPlay() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  

  return (
    <>
      {/* The isOpen check here is redundant due to the early return, but kept for consistency if you prefer this pattern */}
      {isOpen && ( 
        <div className={PopupStyles.popupOverlayStyle} onClick={handleClose}>
          <div className={PopupStyles.popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button className={PopupStyles.popupCloseButtonStyle} onClick={handleClose}>
              <CloseIcon fontSize="small" /> {/* Consider adjusting icon size if needed */}
            </button>
            <div className={PopupStyles.popupBodyStyle}>
              <h2 className={PopupStyles.popupBodyH2Style}>How to Play</h2>
              <p className={PopupStyles.popupBodyPStyle}>
                Welcome to Silver Sync! This game challenges you to find connections between TV shows and movies through actors.
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2"> {/* Added ul for better list formatting */}
                <li className={PopupStyles.popupBodyPStyle}>Select actors that connect different shows.</li>
                <li className={PopupStyles.popupBodyPStyle}>Build a path between shows using common actors.</li>
                <li className={PopupStyles.popupBodyPStyle}>Try to make connections with the fewest steps!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HowToPlay;