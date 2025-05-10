import React, { useState, useRef, useEffect } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import './Header.css';

function Header({ menuItems }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleMenuToggle = () => {
        setMenuOpen(prev => !prev);
    };

    // Effect to close the menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Menu button and dropdown */}
            <div className="menu-container" ref={menuRef}>
                <button className="nav-button menu-button" onClick={handleMenuToggle}>
                    <MenuIcon fontSize="small" /> MENU
                </button>

                {menuOpen && (
                    <div className="menu-dropdown">
                        {menuItems && menuItems.map((item, index) => (
                            <button key={index} onClick={item.onClick} className="menu-item">
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
export default Header;