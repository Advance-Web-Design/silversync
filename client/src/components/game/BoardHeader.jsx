import React, { useState } from 'react'; // Removed useEffect
import { useGameContext } from '../../contexts/gameContext';
// import MenuIcon from '@mui/icons-material/Menu'; // No longer directly used here
import '../Header.css'; // Assuming this is the correct path for styling the new Header
import Header from '../Header'; // Import the generic Header component

const BoardHeader = () => { // Renamed from Header to BoardHeader
  const { 
    resetGame, 
    gameStarted, // Uncommented
    startActors, // Uncommented
    showAllSearchable,
    toggleShowAllSearchable
  } = useGameContext();

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder for login state
  
  // Handle new game option
  const handleNewGame = () => {
    resetGame();
    // setMenuOpen(false); // Managed by Header component
  };
  
  // Handle login option
  const handleLogin = () => {
    // Implementation for login
    console.log('Login clicked');
    setIsLoggedIn(true);
    // setMenuOpen(false); // Managed by Header component
  };

  // Handle register option
  const handleRegister = () => {
    // Implementation for register
    console.log('Register clicked');
    // setMenuOpen(false); // Managed by Header component
  };

  // Handle settings option
  const handleSettings = () => {
    // Implementation for settings
    console.log('Settings clicked');
    // setMenuOpen(false); // Managed by Header component
  };

  // Handle challenge a player option
  const handleChallengePlayer = () => {
    // Implementation for challenging a player
    console.log('Challenge a player clicked');
    // setMenuOpen(false); // Managed by Header component
  };

  // Handle score board option
  const handleScoreBoard = () => {
    // Implementation for viewing score board
    console.log('Score board clicked');
    // setMenuOpen(false); // Managed by Header component
  };
  
  // Handle show all searchable entities option
  const handleShowAllSearchable = () => {
    toggleShowAllSearchable();
    // setMenuOpen(false); // Managed by Header component
  };
  
  // menuOpen, menuRef, handleMenuToggle, and useEffect for click outside are now managed by the Header component.

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

export default BoardHeader; // Ensure this is exported correctly