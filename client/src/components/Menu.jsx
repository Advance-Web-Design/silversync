import React, { useState, useRef, useEffect } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
// import './Menu.css'; // Remove this line
import * as MenuStyles from '../styles/menuStyle.js'; // Import the styles
import { useGameContext } from '../contexts/gameContext';
import HowToPlay from './HowToPlay';
import About from './About';
import LoginWindow from './Login';
import RegisterWindow from './Register';

function Menu(props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showLoginWindow, setShowLoginWindow] = useState(false);
    const [showRegisterWindow, setShowRegisterWindow] = useState(false);

    const menuRef = useRef(null);
    const { 
        toggleShowAllSearchable, 
        resetGame,
        isLoggedIn,
        logout,
    } = useGameContext(); 

    const handleMenuToggle = () => {
        setMenuOpen(prev => !prev);
        if (showHowToPlay) setShowHowToPlay(false);
        if (showAbout) setShowAbout(false);
        if (showLoginWindow) setShowLoginWindow(false);
        if (showRegisterWindow) setShowRegisterWindow(false);
    };

    const handleLogin = () => {
        setShowLoginWindow(prev => !prev);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        if (logout) logout();
        setMenuOpen(false);
    };

    const handleRegister = () => {
        setShowRegisterWindow(prev => !prev);
        setMenuOpen(false);
    };

    const handleHowToPlay = () => {
        setShowHowToPlay(prev => !prev);
        setMenuOpen(false);
    };

    const handleLeaderboard = () => {
        console.log('Leaderboard action triggered');
        setMenuOpen(false);
    };

    const handleChallengeMode = () => {
        console.log('Challenge Mode action triggered');
        setMenuOpen(false);
    };

    const handleAbout = () => {
        setShowAbout(prev => !prev);
        setMenuOpen(false);
    };

    const handleNewGame = () => {
        resetGame();
        setMenuOpen(false);
    };

    const handleCheatSheet = () => {
        toggleShowAllSearchable();
        setMenuOpen(false);
    };

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

    const closeHowToPlay = () => setShowHowToPlay(false);
    const closeLoginWindow = () => setShowLoginWindow(false);
    const closeRegisterWindow = () => setShowRegisterWindow(false);
    const closeAbout = () => setShowAbout(false);

    // Helper to apply border to all but the last visible menu item
    const getMenuItemClasses = (isLastItem) => {
        return isLastItem ? MenuStyles.menuItemStyle : MenuStyles.menuItemWithBorderStyle;
    };
    
    const menuItemsConfig = [];
    if (isLoggedIn === undefined || !isLoggedIn) {
        menuItemsConfig.push({ label: 'Login', handler: handleLogin });
        menuItemsConfig.push({ label: 'Register', handler: handleRegister });
    } else {
        menuItemsConfig.push({ label: 'Logout', handler: handleLogout });
    }

    if (props.parentName === 'StartScreen') {
        menuItemsConfig.push(
            { label: 'Challenge Mode', handler: handleChallengeMode },
            { label: 'Leaderboard', handler: handleLeaderboard },
            { label: 'About', handler: handleAbout }
        );
    } else if (props.parentName === 'BoardHeader') {
        menuItemsConfig.push(
            { label: 'New Game', handler: handleNewGame },
            { label: 'Leaderboard', handler: handleLeaderboard },
            { label: 'How to Play', handler: handleHowToPlay },
            { label: 'Cheat Sheet', handler: handleCheatSheet }
        );
    }


    return (
        <>
            <div className={MenuStyles.menuContainerStyle} ref={menuRef}>
                <button
                    className={MenuStyles.menuButtonStyle}
                    onClick={handleMenuToggle}
                >
                    <MenuIcon fontSize="medium" />
                    <span className={MenuStyles.menuButtonIconTextStyle}>Menu</span>
                </button>

                {menuOpen && (
                    <div className={MenuStyles.menuDropdownStyle}>
                        {menuItemsConfig.map((item, index) => (
                            <button 
                                key={item.label} 
                                onClick={item.handler} 
                                className={getMenuItemClasses(index === menuItemsConfig.length - 1)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {showHowToPlay && <HowToPlay onClose={closeHowToPlay} />}
            {showAbout && <About onClose={closeAbout}/>}
            {showLoginWindow && <LoginWindow onClose={closeLoginWindow} />}
            {showRegisterWindow && <RegisterWindow onClose={closeRegisterWindow} />}
        </>
    );
}
export default Menu;