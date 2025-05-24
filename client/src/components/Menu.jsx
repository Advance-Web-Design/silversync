import React, { useState, useRef, useEffect } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import './Menu.css';
import { useGameContext } from '../contexts/gameContext'; // Import useGameContext
import HowToPlay from './HowToPlay';
import About from './About';

function Menu(props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false); // State for HowToPlay visibility
    const [showAbout, setShowAbout] = useState(false); // State for About visibility
    const menuRef = useRef(null);
    // Destructure login-related states and functions from context
    const { 
        toggleShowAllSearchable, 
        resetGame,
        isLoggedIn, // Get isLoggedIn state from context
        login,      // Get login function from context
        logout,     // Get logout function from context
        register    // Get register function from context
    } = useGameContext(); 

    const handleMenuToggle = () => {
        setMenuOpen(prev => !prev);
        if (showHowToPlay) setShowHowToPlay(false); // Close HowToPlay if menu is toggled
        if (showAbout) setShowAbout(false); // Close About if menu is toggled
    };

    // Action handlers using context functions
    const handleLogin = () => {
        console.log('Login action triggered');
        if (login) login(); // Call login function from context
        setMenuOpen(false);
    };

    // Logout action handler
    const handleLogout = () => {
        console.log('Logout action triggered');
        if (logout) logout(); // Call logout function from context
        setMenuOpen(false);
    };

    // Register action handler
    const handleRegister = () => {
        console.log('Register action triggered');
        if (register) register(); // Call register function from context
        setMenuOpen(false);
    };

    // Other action handlers
    const handleHowToPlay = () => {
        setShowHowToPlay(prev => !prev); // Toggle HowToPlay visibility
        setMenuOpen(false); // Close the main menu
    };

    // Leaderboard action handler
    const handleLeaderboard = () => {
        console.log('Leaderboard action triggered');
        setMenuOpen(false);
    };

    // Challenge Mode action handler
    const handleChallengeMode = () => {
        console.log('Challenge Mode action triggered');
        setMenuOpen(false);
    };

    // About action handler
    const handleAbout = () => {
        setShowAbout(prev => !prev); // Toggle About visibility
        setMenuOpen(false); // Close the main menu
    };

    // New Game action handler
    const handleNewGame = () => {
        resetGame(); // Call the resetGame function from context
        setMenuOpen(false);
    };

    // Cheat Sheet action handler
    // this will need to be removed later
    // as it is not a part of the final game
    const handleCheatSheet = () => {
        toggleShowAllSearchable(); // Call the function from context
        setMenuOpen(false);
    };
    
    // Settings action handler
    const handleSettings = () => {
        console.log('Settings action triggered');
        setMenuOpen(false);
    };

    // Effect to close the menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
                // Optionally close HowToPlay as well if it's open and click is outside
                // if (showHowToPlay && !event.target.closest('.how-to-play-container')) { // Assuming HowToPlay has a container with this class
                //    setShowHowToPlay(false);
                // }
            }
        };
        // Add event listener only when menu is open
        if (menuOpen || showHowToPlay) { // Listen if either menu or HowToPlay is open
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen, showHowToPlay]); // Re-run effect if menuOpen or showHowToPlay changes

    // Function to be passed to HowToPlay component to close it
    const closeHowToPlay = () => {
        setShowHowToPlay(false);
    };

    // Function to be passed to About component to close it
    const closeAbout = () => {
        setShowAbout(false);
    };

    return (
        <> {/* Use React Fragment to allow HowToPlay to be a sibling */}
            <div className="menu-container" ref={menuRef}>
                <button
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-[#3b3b3b] text-white shadow-md hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-75"
                    onClick={handleMenuToggle}
                >
                    <MenuIcon fontSize="medium" /> {/* Adjusted icon size for better fit */}
                    <span className="mt-1 text-xs">Menu</span> {/* Text below icon, smaller */}
                </button>

                {menuOpen && (
                    <div className="menu-dropdown">
                        {/* Use isLoggedIn from context for conditional rendering */}
                        {isLoggedIn === undefined || !isLoggedIn ? ( // Handle undefined case during initial load
                            <>
                                <button onClick={handleLogin} className="menu-item">Login</button>
                                <button onClick={handleRegister} className="menu-item">Register</button>
                            </>
                        ) : (
                            <button onClick={handleLogout} className="menu-item">Logout</button>
                        )}

                        {/* Conditionally render items based on parentName prop */}
                        {props.parentName === 'StartScreen' && (
                            <>
                            <button onClick={handleChallengeMode} className="menu-item">Challenge Mode</button>
                            <button onClick={handleLeaderboard} className="menu-item">Leaderboard</button>
                            <button onClick={handleAbout} className="menu-item">About</button>
                            </>)}
                        {props.parentName === 'BoardHeader' && (
                            <>
                            <button onClick={handleNewGame} className="menu-item">New Game</button>
                            <button onClick={handleLeaderboard} className="menu-item">Leaderboard</button>
                            <button onClick={handleHowToPlay} className="menu-item">How to Play</button>
                            <button onClick={handleCheatSheet} className="menu-item">Cheat Sheet</button>
                            </>)}
                        <button onClick={handleSettings} className="menu-item">Settings</button>
                    </div>
                )}
            </div>
            {/* Conditionally render the HowToPlay component */}
            {showHowToPlay && <HowToPlay onClose={closeHowToPlay} />}

            {/* Conditionally render the About component */}
            {showAbout && <About onClose={closeAbout}/>}
        </>
    );
}
export default Menu;