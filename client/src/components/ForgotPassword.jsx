import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import * as FormStyles from '../styles/FormStyle.js';
import * as LoginStyles from '../styles/AboutStyles.js';
import { useTheme } from '../contexts/ThemeContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const { isLightMode } = useTheme();
  // Handle password reset
  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim()) {
      setMessage('Please enter both username and email.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      await forgotPassword(username.trim(), email.trim());
      setMessage('A new password has been sent to your email address. Please check your inbox and change your password after logging in.');
      setMessageType('success');
      
      // Auto-close after 5 seconds on success
      setTimeout(() => {
        if (onClose) onClose();
      }, 5000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage(error.message || 'Failed to reset password. Please check your username and email.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };
  return (
    <div className={LoginStyles.popupOverlayBaseStyle + " " + (isLightMode ? LoginStyles.popupOverlayLightStyle : LoginStyles.popupOverlayDarkStyle)} onClick={handleClose}>
      <div className={LoginStyles.popupContentBaseStyle + " " + (isLightMode ? LoginStyles.popupContentLightStyle : LoginStyles.popupContentDarkStyle)} onClick={e => e.stopPropagation()}>
        <button className={LoginStyles.popupCloseButtonBaseStyle + " " + (isLightMode ? LoginStyles.popupCloseButtonLightStyle : LoginStyles.popupCloseButtonDarkStyle)} onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </button>
        <div className={FormStyles.formBodyStyle}>
          <h2 className={FormStyles.formTitleBaseStyle + " " + (isLightMode ? FormStyles.formTitleLightStyle : FormStyles.formTitleDarkStyle)}>Reset Password</h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleReset} className={FormStyles.formStyle}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className={FormStyles.formInputBaseStyle + " " + (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className={FormStyles.formInputBaseStyle + " " + (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className={FormStyles.formSubmitButtonBaseStyle + " " + (isLightMode ? FormStyles.formSubmitButtonLightStyle : FormStyles.formSubmitButtonDarkStyle) + (isLoading ? ' opacity-50 cursor-not-allowed' : '')}
            >
              {isLoading ? 'Sending...' : 'Send New Password'}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <button 
              type="button"
              onClick={handleClose}
              className={FormStyles.formSecondaryButtonBaseStyle + " " + (isLightMode ? FormStyles.formSecondaryButtonLightStyle : FormStyles.formSecondaryButtonDarkStyle)}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordWindow;