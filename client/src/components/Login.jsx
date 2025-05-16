
import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Login.css';

function LoginWindow() {
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleClose = () => {
    setIsOpen(false);
  };

  const forgotPassword = () => {
    
    //TODO: implement forgot password functionality
    alert('Forgot password functionality not implemented yet.');
  }
  const handleLogin = (e) => {
    e.preventDefault(); // Prevents page reload
    // TODO: Add your login logic here
    alert(`Username: ${username}\nPassword: ${password}`);
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
              <h2>Welcome</h2>
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={{ display: 'block', margin: '10px 0', width: '100%' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ display: 'block', margin: '10px 0', width: '100%' }}
                />
                <button type="submit" style={{ width: '100%' }}>Login</button>
              </form>

              <button type="submit" style={{ width: '100%' }} onClick={forgotPassword}>Forgot password</button>
                
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginWindow;