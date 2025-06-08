import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Login.css'; // Reuse Login.css for consistent popup styling


function UserProfile({ onClose, userData = {} }) {
    // Example user fields; add more fields as needed
    const [fields, setFields] = useState({
        username: userData.username || 'User123',
        email: userData.email || 'user@example.com',
        // Add more fields here as needed, e.g.:
        // favoriteShow: userData.favoriteShow || '',
        // bio: userData.bio || '',
    });

    // // Handler for editing fields (optional, for future editing functionality)
    // const handleFieldChange = (field, value) => {
    //     setFields(prev => ({
    //         ...prev,
    //         [field]: value,
    //     }));
    // };

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="popup-close-button" onClick={onClose}>
                    <CloseIcon />
                </button>
                <div className="popup-body">
                    <h2>User Profile</h2>
                    <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: 300 }}>
                        {Object.entries(fields).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 500, color: '#444' }}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </div>
                                <div style={{ color: '#222', wordBreak: 'break-all' }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                        {/* 
                            To add new fields, just add them to the `fields` state above.
                            For editable fields, replace the value div with an input and use handleFieldChange.
                        */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;