import React, { useState } from 'react';
import { useGameContext } from '../../contexts/gameContext';
import '../Header.css';
import Header from '../Header';

const BoardHeader = () => {
  const { 
    resetGame, 
    gameStarted, 
    startActors, 
    showAllSearchable,
    toggleShowAllSearchable
  } = useGameContext();

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder for login state
  
  // Handle new game option
  const handleNewGame = () => {
    resetGame();
  };
  
  // Handle login option
  const handleLogin = () => {
    // Implementation for login
    console.log('Login clicked');
    setIsLoggedIn(true);
  };

  // Handle register option
  const handleRegister = () => {
    // Implementation for register
    console.log('Register clicked');
  };

  // Handle settings option
  const handleSettings = () => {
    // Implementation for settings
    console.log('Settings clicked');
  };

  // Handle challenge a player option
  const handleChallengePlayer = () => {
    // Implementation for challenging a player
    console.log('Challenge a player clicked');
  };

  // Handle score board option
  const handleScoreBoard = () => {
    // Implementation for viewing score board
    console.log('Score board clicked');
  };
  
  // Handle show all searchable entities option
  const handleShowAllSearchable = () => {
    toggleShowAllSearchable();
  };

  const menuItems = [
    { label: 'New Game', onClick: handleNewGame },
    // Conditional items for Login/Register
    ...(!isLoggedIn ? [
      { label: 'Login', onClick: handleLogin },
      { label: 'Register', onClick: handleRegister }
    ] : []),
    { label: 'Settings', onClick: handleSettings },
    { label: 'Challenge a Player', onClick: handleChallengePlayer },
    { label: 'Score Board', onClick: handleScoreBoard },
    { label: `${showAllSearchable ? 'Hide' : 'Show'} All Searchable Entities`, onClick: handleShowAllSearchable }
  ];

  return (
    <header className="game-header">
      <Header menuItems={menuItems} />
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

export default BoardHeader;