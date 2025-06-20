import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as AboutStyles from '../styles/AboutStyles.js';
import { useTheme } from '../contexts/ThemeContext';

function About({ onClose }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };
  const { isLightMode } = useTheme();

  const dividerStyle = isLightMode
    ? "border-t border-blue-200 my-4"
    : "border-t border-yellow-700 my-4";

  return (
    <>
      {isOpen && (
        <div className={
          AboutStyles.popupOverlayBaseStyle + " " +
          (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)
        }>
          <div className={
            AboutStyles.popupContentBaseStyle + " " +
            (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)
          }>
            <button
              className={
                AboutStyles.popupCloseButtonBaseStyle + " " +
                (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)
              }
              onClick={handleClose}
              aria-label="Close About"
            >
              <CloseIcon fontSize="inherit" />
            </button>
            <div className={AboutStyles.popupBodyStyle}>
              <h2 className={
                AboutStyles.popupBodyH2BaseStyle + " " +
                (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)
              }>
                About
              </h2>
              <div className={dividerStyle}></div>
              <p className={
                AboutStyles.popupBodyPBaseStyle + " font-semibold " +
                (isLightMode ? AboutStyles.popupBodyPLightStyle : AboutStyles.popupBodyPDarkStyle)
              }>
                Welcome! This project was made during our advanced web design course by a team of 6 people.
              </p>
              <p className={
                AboutStyles.popupBodyPBaseStyle + " " +
                (isLightMode ? AboutStyles.popupBodyPLightStyle : AboutStyles.popupBodyPDarkStyle)
              }>
                Our goal was to make an homage to a favorite web game of ours called <span className={"font-bold" + " " + (isLightMode ? "text-blue-500" : "text-yellow-500")}>"Connect the Stars"</span> with a bigger selection of actors by including TV shows as well.
              </p>
              <p className={
                AboutStyles.popupBodyPBaseStyle + " italic " +
                (isLightMode ? AboutStyles.popupBodyPLightStyle : AboutStyles.popupBodyPDarkStyle)
              }>
                We hope you enjoy playing it as much as we enjoyed making it!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default About;