import React, { useState, useRef, useEffect } from 'react'; // Removed 'use' import
import MenuIcon from '@mui/icons-material/Menu';
import { useGameContext } from '../contexts/gameContext'; // Import useGameContext
import HowToPlay from './HowToPlay';
import About from './About';
import Leaderboard from './Leaderboard';
import LoginWindow from './Login'; // Import Login component
import RegisterWindow from './Register'; // Import Register component
import { logger } from '../utils/loggerUtils';
import * as MenuStyles from '../styles/menuStyle.js'; // Import the styles
import ToggleButton from './ToggleBtn'; // Import ToggleButton component
import ToggleButtonCheck from './ToggleButtonCheck'; // Import ToggleButtonCheck component
import { useTheme } from '../contexts/ThemeContext';


import UserProfile from './UserProfile';


function Menu(props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showLoginWindow, setShowLoginWindow] = useState(false);
    const [showRegisterWindow, setShowRegisterWindow] = useState(false);
    const [loginID, setLoginID] = useState(null);
    const [showUserProfile, setShowUserProfile] = useState(false); // Corrected initial state
    const [userProfileData, setUserProfileData] = useState(null);
    const [isToggleEnabled, setIsToggleEnabled] = useState(false); // New state for the toggle button
    const { isLightMode, toggleTheme } = useTheme();
    
    const menuRef = useRef(null);
    const { 
        toggleShowAllSearchable, 
        resetGame,
        currentUser,
        setCurrentUser,
        showLeaderboard,
        setShowLeaderboard
    } = useGameContext();

    const handleMenuToggle = () => {
        setMenuOpen(prev => !prev);
        if (showHowToPlay) setShowHowToPlay(false); // Close HowToPlay if menu is toggled        if (showAbout) setShowAbout(false); // Close About if menu is toggled
        if (showLoginWindow) setShowLoginWindow(false); // Close Login if menu is toggled
        if (showRegisterWindow) setShowRegisterWindow(false); // Close Register if menu is toggled
        if (showUserProfile) setShowUserProfile(false); // Close UserProfile if menu is toggled
        if (showLeaderboard) setShowLeaderboard(false); // Close Leaderboard if menu is toggled
    };

    // Action handlers using context functions
    const handleLogin = () => {
        setShowLoginWindow(prev => !prev); // Toggle login visibility
        setMenuOpen(false);
    };    const handleSetLoginID = (UserProfile) => {
        setUserProfileData(UserProfile); // Set user profile data state
        setLoginID(UserProfile.userId); // Set loginID state with the user profile
        setCurrentUser(UserProfile); // Set user in context
    };
        // Logout action handler
    const handleLogout = () => {
        setLoginID(null); // Reset loginID state
        setCurrentUser(null); // Clear user from context
        alert('You have logged out.');
        setMenuOpen(false);
    };

    const handleUserProfile = () => {
        setShowUserProfile(prev => !prev); // Toggle UserProfile visibility
        setMenuOpen(false); // Close the main menu
    }

    const handleRegister = () => {
        logger.debug('Register action triggered');
        //if (register) register(); // Call register function from context
        setShowRegisterWindow(prev => !prev); // Toggle login visibility
        setMenuOpen(false);
    };

    const handleHowToPlay = () => {
        setShowHowToPlay(prev => !prev); // Toggle HowToPlay visibility
        setMenuOpen(false); // Close the main menu
    };    // Leaderboard action handler
    const handleLeaderboard = () => {
        logger.debug('Leaderboard action triggered');
        setShowLeaderboard(true);
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

    // Handler for the toggle button
    const handleToggleClick = () => {
        setIsToggleEnabled(prev => !prev);
    };

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
    }, [menuOpen, showHowToPlay]); 

    const closeHowToPlay = () => {
        setShowHowToPlay(false);
    };

    const closeLoginWindow = () => {
        setShowLoginWindow(false);
    };

    const closeRegisterWindow = () => {
        setShowRegisterWindow(false);
    };
    const closeUserProfileWindow = () => {
        setShowUserProfile(false);
    };    const closeUserProfile = () => {
        setShowUserProfile(false);
    };

    const closeLeaderboard = () => {
        setShowLeaderboard(false);
    };

    const closeAbout = () => {
        setShowAbout(false);
    };

    const getMenuItemClass = () =>
        MenuStyles.menuItemBaseStyle + " " +
            (isLightMode ? MenuStyles.menuItemLightStyle : MenuStyles.menuItemDarkStyle);
    
    return (
        <> 
            <div className={MenuStyles.menuContainerStyle} ref={menuRef}>
                <button
                    className={MenuStyles.menuButtonBaseStyle + " " + (isLightMode ? MenuStyles.menuButtonLightStyle : MenuStyles.menuButtonDarkStyle)} 
                    onClick={handleMenuToggle}
                >
                    <MenuIcon fontSize="medium" /> 
                    <span className={MenuStyles.menuButtonIconTextStyle}>Menu</span> 
                </button>

                {menuOpen && (
                    <div className={MenuStyles.menuDropdownStyle +" " + (isLightMode ? MenuStyles.lightModeDropDownStyle: MenuStyles.darkModeDropDownStyle)}>
                        {loginID === null ? ( 
                            <>
                                <button onClick={handleLogin} className={getMenuItemClass()}>Login</button>
                                <button onClick={handleRegister} className={getMenuItemClass()}>Register</button>
                            </>
                        ) : (
                            <>
                            <button onClick={handleLogout} className={getMenuItemClass()}>Logout</button>
                            <button onClick={handleUserProfile} className={getMenuItemClass()}>User Profile</button>
                            </>
                        )}

                        {props.parentName === 'StartScreen' && (
                            <>
                            <button onClick={handleNewGame} className={getMenuItemClass()}>Main Menu</button>
                            <button onClick={handleLeaderboard} className={getMenuItemClass()}>Leaderboard</button>
                            <button onClick={handleAbout} className={getMenuItemClass()}>About</button>
                            <div className={getMenuItemClass()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <ToggleButtonCheck />
                            </div>
                            </>)}
                        {props.parentName === 'BoardHeader' && (
                            <>
                            <button onClick={handleNewGame} className={getMenuItemClass()}>New Game</button>
                            <button onClick={handleLeaderboard} className={getMenuItemClass()}>Leaderboard</button>
                            <button onClick={handleHowToPlay} className={getMenuItemClass()}>How to Play</button>
                            <button onClick={handleCheatSheet} className={getMenuItemClass()}>Cheat Sheet</button>                           
                            
                            <div className={getMenuItemClass()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <ToggleButtonCheck />
                            </div>
                            </>)}
                        {props.parentName === 'ChallengeScreen' && (
                            <>
                            <div className={getMenuItemClass()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <ToggleButtonCheck />
                            </div>
                            </>)}
                        
                    </div>
                )}
            </div>
            {showHowToPlay && <HowToPlay onClose={closeHowToPlay} />}            
            {showAbout && <About onClose={closeAbout}/>}
            {showLeaderboard && <Leaderboard onClose={closeLeaderboard}/>}
            {showLoginWindow && <LoginWindow onClose={closeLoginWindow} setLoginID={handleSetLoginID} />}
            {showRegisterWindow && <RegisterWindow onClose={closeRegisterWindow} />}
            {showUserProfile && <UserProfile onClose={closeUserProfileWindow} userData={userProfileData} />}
        </>
    );

}

export default Menu;