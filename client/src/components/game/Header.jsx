import React, { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import MenuIcon from '@mui/icons-material/Menu';
import './Header.css';

const Header = () => {
  const { 
    resetGame, 
    gameStarted, 
    startActors,
    showAllSearchable,
    toggleShowAllSearchable
  } = useGameContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder for login state
  const menuRef = useRef(null);
  
  // Handle menu toggle
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Handle new game option
  const handleNewGame = () => {
    resetGame();
    setMenuOpen(false);
  };
  
  // Handle login option
  const handleLogin = () => {
    // Implementation for login
    console.log('Login clicked');
    setIsLoggedIn(true);
    setMenuOpen(false);
  };

  // Handle register option
  const handleRegister = () => {
    // Implementation for register
    console.log('Register clicked');
    setMenuOpen(false);
  };

  // Handle settings option
  const handleSettings = () => {
    // Implementation for settings
    console.log('Settings clicked');
    setMenuOpen(false);
  };

  // Handle challenge a player option
  const handleChallengePlayer = () => {
    // Implementation for challenging a player
    console.log('Challenge a player clicked');
    setMenuOpen(false);
  };

  // Handle score board option
  const handleScoreBoard = () => {
    // Implementation for viewing score board
    console.log('Score board clicked');
    setMenuOpen(false);
  };
  
  // Handle show all searchable entities option
  const handleShowAllSearchable = () => {
    toggleShowAllSearchable();
    setMenuOpen(false);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="game-header">
      {/* Menu button and dropdown */}
      <div className="menu-container" ref={menuRef}>
        <button className="nav-button menu-button" onClick={handleMenuToggle}>
          <MenuIcon fontSize="small" /> MENU
        </button>
        
        {menuOpen && (
          <div className="menu-dropdown">
            <button onClick={handleNewGame} className="menu-item">New Game</button>
            
            {!isLoggedIn ? (
              <>
                <button onClick={handleLogin} className="menu-item">Login</button>
                <button onClick={handleRegister} className="menu-item">Register</button>
              </>
            ) : null}
            
            <button onClick={handleSettings} className="menu-item">Settings</button>
            <button onClick={handleChallengePlayer} className="menu-item">Challenge a Player</button>
            <button onClick={handleScoreBoard} className="menu-item">Score Board</button>
            <button onClick={handleShowAllSearchable} className="menu-item">
              {showAllSearchable ? 'Hide' : 'Show'} All Searchable Entities
            </button>
          </div>
        )}
      </div>
      
      {/* Logo and title */}
      <div className="logo-container">
        <span className="star-logo">★</span>
        <h1 className="game-title">Connect the Stars</h1>
      </div>
      
      {/* Actor names display (if game started) */}
      {gameStarted && startActors && startActors[0] && startActors[1] && (
        <div className="actors-display">
          <div className="connect-text">CONNECT</div>
          <div className="actor-name">{startActors[0].name.toUpperCase()}</div>
          <div className="and-text">AND</div>
          <div className="actor-name">{startActors[1].name.toUpperCase()}</div>
        </div>
      )}
    </header>
  );
};

export default Header;