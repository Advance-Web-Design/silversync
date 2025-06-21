
import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { verifyUser } from "../services/firebaseService";
import * as FormStyles from '../styles/FormStyle.js'; // Import the styles
import { logger } from '../utils/loggerUtils';
import { useTheme } from '../contexts/ThemeContext'; // Import the ThemeContext
import * as LoginStyles from '../styles/AboutStyles.js'; // Import the stylesimport { ForgotPasswordWindow } from './ForgotPassword'; // Import ForgotPasswordWindow component
import ForgotPasswordWindow from './ForgotPassword'; // Import ForgotPasswordWindow component


/**
 * LoginWindow component renders a login form popup.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the login popup
 * @param {Function} props.setLoginID - Function to set the logged-in user's profile
 * @returns 
 */
function LoginWindow({ onClose, setLoginID }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Handles closing the login popup.
   */
  const handleClose = () => {
    if (onClose) onClose();
  };


  const forgotPassword = () => {
    
    //TODO: implement forgot password functionality
    alert('Forgot password functionality not implemented yet.');
  }

  /**
   * Handles the login form submission.
   * Verifies the user credentials and logs in the user if valid.
   * @param {React.FormEvent} e - The form submit event
   */
  const handleLogin = (e) => {
    e.preventDefault(); // Prevents page reload
  
    verifyUser(username, password)
      .then(userProfile => {
        if (userProfile) {
          logger.info('User logged in with ID:', userProfile.userId);
          alert('Login successful!');
          setLoginID(userProfile);
          handleClose(); // Close the popup after successful login
        } else {
          alert('Invalid username or password.');
        }
      })
      .catch(error => {
        alert('Error during login:' + error.message);
      });

  };
  
  const { isLightMode } = useTheme();
  return (
    <>
      {( 
        <div className={LoginStyles.popupOverlayBaseStyle + " " +(isLightMode ? LoginStyles.popupOverlayLightStyle : LoginStyles.popupOverlayDarkStyle)} onClick={handleClose}>
          <div className={LoginStyles.popupContentBaseStyle + " " + (isLightMode ? LoginStyles.popupContentLightStyle : LoginStyles.popupContentDarkStyle)} onClick={(e) => e.stopPropagation()}>
            <button className={LoginStyles.popupCloseButtonBaseStyle + " "+ (isLightMode? LoginStyles.popupCloseButtonLightStyle : LoginStyles.popupCloseButtonDarkStyle)} onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </button>
            <div className={FormStyles.formBodyStyle}>
              <h2 className={FormStyles.formTitleBaseStyle + " " + (isLightMode? FormStyles.formTitleLightStyle : FormStyles.formTitleDarkStyle)}>Welcome Back</h2>
              <form onSubmit={handleLogin} className={FormStyles.formStyle}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className={FormStyles.formInputBaseStyle + " " + (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={FormStyles.formInputBaseStyle + " " + (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)}
                />
                <button type="submit" className={FormStyles.formSubmitButtonBaseStyle + " " + (isLightMode ? FormStyles.formSubmitButtonLightStyle : FormStyles.formSubmitButtonDarkStyle)}>
                  Login
                </button>
              </form>

              <button 
                type="button" 
                className={FormStyles.formSecondaryButtonBaseStyle + " " +
                  (isLightMode ? FormStyles.formSecondaryButtonLightStyle : FormStyles.formSecondaryButtonDarkStyle)} 
                onClick={forgotPassword}
              >
                Forgot password?
              </button>
                
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginWindow;