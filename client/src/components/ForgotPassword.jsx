import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as FormStyles from '../styles/FormStyle.js';
import { forgotPassword } from '../services/firebaseService.js';

/**
 * ForgotPasswordWindow component renders a popup for password reset.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the popup and return to login
 * @returns {JSX.Element}
 */
function ForgotPasswordWindow({ onClose }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Simulate password reset (replace with real logic if needed)
  const handleReset = (e) => {
    e.preventDefault();
    // TODO: Implement backend password reset logic here

    if (!username || !email) {
      alert('Please enter both username and email.');
      return;
    }
    else
    {
      forgotPassword(username, email)
        .then(() => {
          alert('your new password has been sent to your email.');
        })
        .catch(error => {
          alert('Error during password reset: ' + error.message);
        });
    }
    setSubmitted(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className={FormStyles.formOverlayStyle} onClick={handleClose}>
      <div className={FormStyles.formContentStyle} onClick={e => e.stopPropagation()}>
        <button className={FormStyles.formCloseButtonStyle} onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </button>
        <div className={FormStyles.formBodyStyle}>
          <h2 className={FormStyles.formTitleStyle}>Reset Password</h2>
          {!submitted ? (
            <form onSubmit={handleReset} className={FormStyles.formStyle}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className={FormStyles.formInputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={FormStyles.formInputStyle}
              />
              <button type="submit" className={FormStyles.formSubmitButtonStyle}>
                New Password
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              If the username and email match, you will receive instructions to reset your password.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordWindow;