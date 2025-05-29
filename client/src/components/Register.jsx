//TODO: THIS IMPORT IS TEMPORARY, REMOVE WHEN CLIENT AND SERVER ARE SEPARATED
import { addUser } from "../services/firebaseService";


import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Login.css';

function RegisterWindow() {
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');




  const handleClose = () => {
    setIsOpen(false);
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

    // TODO: Add your register logic here

    // TODO: FIX WHEN CLIENT AND SERVER ARE SEPARATED
    addUser(username, password, email)
      .then(userId => {
        console.log('User registered with ID:', userId);
        alert('Registration successful!');
        handleClose(); // Close the popup after successful registration
      })
      .catch(error => {
        console.error('Error registering user:', error);
        alert('Registration failed. Please try again. error message: ' + error.message);
      });
//    console.log("user side register log")
    //alert(`Email: ${email}\nUsername: ${username}\nPassword: ${password}`);
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
              <h2>Registration</h2>
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ display: 'block', margin: '10px 0', width: '100%' }}
                />
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
                <button type="submit" style={{ width: '100%' }}>Register</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RegisterWindow;