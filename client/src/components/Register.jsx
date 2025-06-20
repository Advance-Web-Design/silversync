import { addUser } from "../services/firebaseService";
import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as FormStyles from '../styles/FormStyle.js'; // Import the styles
import { logger } from '../utils/loggerUtils';
import {  useTheme} from '../contexts/ThemeContext'; // Import the ThemeContext
import * as RegStyle from '../styles/AboutStyles.js'
function RegisterWindow({onClose}) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');




  const handleClose = () => {
    if (onClose) onClose();
  };
  
  // Function to validate password
  // Password must contain at least one lowercase letter, one uppercase letter, and one digit
  const validatePassword = (pass) => {

    const hasLowercase = /[a-z]/.test(pass);
    const hasUppercase = /[A-Z]/.test(pass);
    const hasDigit = /\d/.test(pass);
    return hasLowercase && hasUppercase && hasDigit;
  };
  // Function to validate email
  // Email must be in a valid format
  const validateEmail = (email) => {

    // This regex checks for a basic email format
    const emailValid =/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
    return emailValid;
  };


  const handleRegister = (e) => {
    e.preventDefault(); // Prevents page reload
    
    if (!validatePassword(password)) {
      alert('Password must contain at least one lowercase letter, one uppercase letter, and one digit.');
      return;
    }
    if (!validateEmail(email)) {
      alert('Email is not valid.');
      return;
    }


    addUser(username, password, email)
      .then(userId => {
        logger.info('User registered with ID:', userId);
        if (userId==undefined || userId==null) {
          alert('User registration failed: userId is undefined or null');

        }
        else{
          
          alert('Registration successful!');
          handleClose(); // Close the popup after successful registration

        }
      })
      .catch(error => {
        logger.error('Error registering user:', error);
        alert('Registration failed. Please try again. error message: ' + error.message);
      });


//    console.log("user side register log")
    //alert(`Email: ${email}\nUsername: ${username}\nPassword: ${password}`);
  };
  const { isLightMode } = useTheme(); // Get the current theme mode
  return (
    <>
      { (
        <div className={RegStyle.popupOverlayBaseStyle + " " + (isLightMode ? RegStyle.popupOverlayLightStyle : RegStyle.popupOverlayDarkStyle)}>
          <div className={RegStyle.popupContentStyle + " " + (isLightMode ? RegStyle.popupContentLightStyle : RegStyle.popupContentDarkStyle)}>
            <button className={RegStyle.popupCloseButtonBaseStyle + " " + (isLightMode ? RegStyle.popupCloseButtonLightStyle : RegStyle.popupCloseButtonDarkStyle)} onClick={handleClose}>
              <CloseIcon />
            </button>
            <div className={FormStyles.formBodyStyle}>
              <h2 className={FormStyles.formTitleBaseStyle + " " + (isLightMode? FormStyles.formTitleLightStyle : FormStyles.formTitleDarkStyle)}>Create Account</h2>
              <form onSubmit={handleRegister} className={FormStyles.formStyle}>
                <input
                  type="text" // Changed to text for email, can also be type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={FormStyles.formInputBaseStyle + " " + (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)}
                />
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
                  Register
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RegisterWindow;