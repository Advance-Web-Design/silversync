
import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { verifyUser } from "../services/firebaseService";
import * as FormStyles from '../styles/FormStyle.js'; // Import the styles

function LoginWindow({ onClose, setLoginID }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
  };

  const forgotPassword = () => {
    
    //TODO: implement forgot password functionality
    alert('Forgot password functionality not implemented yet.');
  }
  const handleLogin = (e) => {
    e.preventDefault(); // Prevents page reload
    // TODO: Add your login logic here

    // TODO: temporary client-side login logic
    


    verifyUser(username, password)
      .then(userProfile => {
        if (userProfile) {
          console.log('User logged in with ID:', userProfile.userId);
          alert('Login successful!');
          setLoginID(userProfile);
          handleClose(); // Close the popup after successful login
        } else {
          alert('Invalid username or password.');
        }
      })
      .catch(error => {
        //console.error('Error during login:', error);
        alert('Error during login:' + error.message);
      });



  };
  

  return (
    <>
      {( 
        <div className={FormStyles.formOverlayStyle} onClick={handleClose}>
          <div className={FormStyles.formContentStyle} onClick={(e) => e.stopPropagation()}>
            <button className={FormStyles.formCloseButtonStyle} onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </button>
            <div className={FormStyles.formBodyStyle}>
              <h2 className={FormStyles.formTitleStyle}>Welcome Back</h2>
              <form onSubmit={handleLogin} className={FormStyles.formStyle}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className={FormStyles.formInputStyle}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={FormStyles.formInputStyle}
                />
                <button type="submit" className={FormStyles.formSubmitButtonStyle}>
                  Login
                </button>
              </form>

              <button 
                type="button" 
                className={FormStyles.formSecondaryButtonStyle} 
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