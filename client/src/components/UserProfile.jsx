import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './Login.css'; // Reuse Login.css for consistent popup styling
import { hashPassword, updateUserProfile } from '../services/firebaseService';



/**
 * UserProfile component displays a user's profile information in a popup window.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the profile popup
 * @param {Object} [props.userData={}] - User data object containing profile fields
 * @returns {JSX.Element} The rendered user profile window
 */
function UserProfile({ onClose, userData = {} }) {
    // Example user fields; add more fields as needed
    const [fields, setFields] = useState({
        username: userData.username || 'User123',
        email: userData.email || 'user@example.com',
        // Add more fields here as needed, e.g.:
        // favoriteShow: userData.favoriteShow || '',
        // bio: userData.bio || '',
        });

        const [showEmailModal, setShowEmailModal] = useState(false);
        const [showPasswordModal, setShowPasswordModal] = useState(false);

        // Email form state
        const [newEmail, setNewEmail] = useState('');
        const [emailVerifyPassword, setemailVerifyPassword] = useState('');

        // Password form state
        const [newPassword, setNewPassword] = useState('');
        const [oldPassword, setoldPassword] = useState('');

        // Dummy submit handlers (replace with real logic)
        const handleEmailSubmit = (e) => {
            e.preventDefault();
            updateUserProfile(fields.username, { email: newEmail }, emailVerifyPassword)
            setShowEmailModal(false);
            setNewEmail('');
            setemailVerifyPassword('');
        };

        const handlePasswordSubmit = (e) => {
            e.preventDefault();

            updateUserProfile(fields.username, { hashedPassword: newPassword }, oldPassword);
            setShowPasswordModal(false);
            setNewPassword('');
            setoldPassword('');
        };

        return(
        <div className = "popup-overlay" >
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
                        </div>
                        {/* Buttons for changing email and password */}
                        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setShowEmailModal(true)} className="popup-action-button">
                                Change Email
                            </button>
                            <button onClick={() => setShowPasswordModal(true)} className="popup-action-button">
                                Change Password
                            </button>
                        </div>
                    </div>
                    {/* Email Modal */}
                    {showEmailModal && (
                        <div className="popup-overlay" style={{ zIndex: 1001 }}>
                            <div className="popup-content" style={{ maxWidth: 350 }}>
                                <button className="popup-close-button" onClick={() => setShowEmailModal(false)}>
                                    <CloseIcon />
                                </button>
                                <h3>Change Email</h3>
                                <form onSubmit={handleEmailSubmit}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label>New Email</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label>Verify Password</label>
                                        <input
                                            type="password"
                                            value={emailVerifyPassword}
                                            onChange={e => setemailVerifyPassword(e.target.value)}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <button type="submit" className="popup-action-button" style={{ width: '100%' }}>
                                        Submit
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                    {/* Password Modal */}
                    {showPasswordModal && (
                        <div className="popup-overlay" style={{ zIndex: 1001 }}>
                            <div className="popup-content" style={{ maxWidth: 350 }}>
                                <button className="popup-close-button" onClick={() => setShowPasswordModal(false)}>
                                    <CloseIcon />
                                </button>
                                <h3>Change Password</h3>
                                <form onSubmit={handlePasswordSubmit}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label>Verify Password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={e => setoldPassword(e.target.value)}
                                            required
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <button type="submit" className="popup-action-button" style={{ width: '100%' }}>
                                        Submit
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
        </div >
    );
}

export default UserProfile;