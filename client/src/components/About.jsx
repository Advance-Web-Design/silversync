import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as AboutStyles from '../styles/AboutStyles.js'; // Import the styles

function About({ onClose }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div className={AboutStyles.popupOverlayStyle}>
          <div className={AboutStyles.popupContentStyle}>
            <button className={AboutStyles.popupCloseButtonStyle} onClick={handleClose}>
              <CloseIcon />
            </button>
            <div className={AboutStyles.popupBodyStyle}>
              <h2 className={AboutStyles.popupBodyH2Style}>About</h2>
              <p className={AboutStyles.popupBodyPStyle}>Welcome! This project was made during our advanced web design course by a team of 6 people. Our goal was to make an homage to a favorite web game of ours called "Connect the Stars" with a bigger selection of actors by including TV shows as well.</p>
              <p className={AboutStyles.popupBodyPStyle}>We hope you enjoy playing it as much as we enjoyed making it!</p>  
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default About;