import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as PopupStyles from '../styles/AboutStyles.js'; // Using a generic name like PopupStyles
import { useTheme } from '../contexts/ThemeContext';


function HowToPlay() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  const { isLightMode } = useTheme();  

  return (
    <>
      {/* The isOpen check here is redundant due to the early return, but kept for consistency if you prefer this pattern */}
      {isOpen && ( 
        <div className={PopupStyles.popupOverlayStyle} onClick={handleClose}>
          <div className={PopupStyles.popupContentBaseStyle + " " + (isLightMode? PopupStyles.popupContentLightStyle : PopupStyles.popupContentDarkStyle)} onClick={(e) => e.stopPropagation()}>
            <button className={PopupStyles.popupCloseButtonBaseStyle + " " + (isLightMode? PopupStyles.popupCloseButtonLightStyle : PopupStyles.popupCloseButtonDarkStyle)} onClick={handleClose}>
              <CloseIcon fontSize="small" /> {/* Consider adjusting icon size if needed */}
            </button>
            <div className={PopupStyles.popupBodyStyle}>
              <h2 className={PopupStyles.popupBodyH2BaseStyle + " " + (isLightMode? PopupStyles.popupBodyH2LightStyle: PopupStyles.popupBodyH2DarkStyle)}>How to Play</h2>
              <p className={PopupStyles.popupBodyPBaseStyle + " " + (isLightMode? PopupStyles.popupBodyPLightStyle: PopupStyles.popupBodyPDarkStyle)}>
                Welcome to Connect the Shows! This game challenges you to find connections between TV shows and movies through actors.
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2"> {/* Added ul for better list formatting */}
                <li className={PopupStyles.popupBodyPBaseStyle + " " + (isLightMode? PopupStyles.popupBodyPLightStyle: PopupStyles.popupBodyPDarkStyle)}>Select actors that connect different shows.</li>
                <li className={PopupStyles.popupBodyPBaseStyle + " " + (isLightMode? PopupStyles.popupBodyPLightStyle: PopupStyles.popupBodyPDarkStyle)}>Build a path between shows using common actors.</li>
                <li className={PopupStyles.popupBodyPBaseStyle + " " + (isLightMode? PopupStyles.popupBodyPLightStyle: PopupStyles.popupBodyPDarkStyle)}>Try to make connections with the fewest steps!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HowToPlay;