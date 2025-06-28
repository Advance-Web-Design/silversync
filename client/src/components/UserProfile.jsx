import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { hashPassword, updateUserProfile, fetchUserGameHistory } from '../services/firebaseService';
import { useGameContext } from '../contexts/gameContext';
import { useTheme } from '../contexts/ThemeContext';
import * as AboutStyles from '../styles/AboutStyles.js';
import * as FormStyles from '../styles/FormStyle.js';



/**
 * GameHistoryCard component for displaying individual game entries
 */
const GameHistoryCard = ({ game, isLightMode, formatDate, formatDuration }) => (
    <div className={
        "rounded-lg border p-4 mb-3 text-sm transition-colors duration-150 " +
        (isLightMode 
            ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
            : "bg-slate-700/50 border-slate-600 hover:bg-slate-700")
    }>
        <div className={
            "font-bold mb-3 text-base " +
            (isLightMode ? "text-blue-800" : "text-yellow-300")
        }>
            {game.startingActor1} → {game.startingActor2}
        </div>        <div className="grid grid-cols-2 gap-4 mb-3">
            <div className={isLightMode ? "text-gray-700" : "text-gray-200"}>
                <span className="font-semibold">Path Length:</span> {game.pathLength || 'N/A'}
            </div>
            <div className={isLightMode ? "text-gray-700" : "text-gray-200"}>
                <span className="font-semibold">Score:</span> {game.score || 0}
            </div>
            <div className={isLightMode ? "text-gray-700" : "text-gray-200"}>
                <span className="font-semibold">Time:</span> {formatDuration(game.timeTaken)}
            </div>
            <div className={isLightMode ? "text-gray-700" : "text-gray-200"}>
                <span className="font-semibold">Completed:</span> {formatDate(game.completedAt)}
            </div>
        </div>
    </div>
);

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
    const { setCurrentUser } = useGameContext(); // Get setCurrentUser from context
    const { isLightMode } = useTheme(); // Get theme context
    
    // Example user fields; add more fields as needed
    const [fields, setFields] = useState({
        username: userData.username || 'User123',
        email: userData.email || 'user@example.com',
        // Add more fields here as needed, e.g.:
        // favoriteShow: userData.favoriteShow || '',
        // bio: userData.bio || '',
        });        const [showEmailModal, setShowEmailModal] = useState(false);
        const [showPasswordModal, setShowPasswordModal] = useState(false);
        const [showGameHistory, setShowGameHistory] = useState(false);        // Game history state
        const [gameHistory, setGameHistory] = useState({});
        const [loadingGameHistory, setLoadingGameHistory] = useState(false);
        const [activeTab, setActiveTab] = useState('All'); // New state for active tab

        // Email form state
        const [newEmail, setNewEmail] = useState('');
        const [emailVerifyPassword, setemailVerifyPassword] = useState('');

        // Password form state
        const [newPassword, setNewPassword] = useState('');
        const [oldPassword, setoldPassword] = useState('');

        // Sync fields with userData prop changes
        useEffect(() => {
            setFields({
                username: userData.username || 'User123',
                email: userData.email || 'user@example.com',
                // Add more fields here as needed
            });
        }, [userData]);        // Load game history from userData or fetch if not available
        useEffect(() => {
            if (userData.gamehistory) {
                // Limit each game mode to last 10 games (in case userData has more)
                const limitedHistory = {};
                Object.entries(userData.gamehistory).forEach(([gameMode, games]) => {
                    limitedHistory[gameMode] = games.slice(0, 10);
                });
                
                setGameHistory(limitedHistory);
                // Reset to 'All' tab when new data is loaded
                setActiveTab('All');
            } else if (userData.userId && !loadingGameHistory) {
                loadGameHistory();
            }
        }, [userData]);// Function to load game history
        const loadGameHistory = async () => {
            if (!userData.userId) return;
            
            setLoadingGameHistory(true);
            try {
                const history = await fetchUserGameHistory(userData.userId);
                
                // Limit each game mode to last 10 games (in case database has more)
                const limitedHistory = {};
                Object.entries(history).forEach(([gameMode, games]) => {
                    limitedHistory[gameMode] = games.slice(0, 10);
                });
                
                setGameHistory(limitedHistory);
                setActiveTab('All'); // Reset to 'All' tab when loading new data
            } catch (error) {
                console.error('Error loading game history:', error);
                setGameHistory({});
            } finally {
                setLoadingGameHistory(false);
            }
        };

        // Function to format date for display
        const formatDate = (timestamp) => {
            if (!timestamp) return 'Unknown';
            const date = new Date(timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        };

        // Function to format duration
        const formatDuration = (seconds) => {
            if (!seconds) return '0s';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
        };

        // Dummy submit handlers (replace with real logic)
        const handleEmailSubmit = async (e) => {
            e.preventDefault();
            try {
                const response = await updateUserProfile(fields.username, { email: newEmail }, emailVerifyPassword);
                
                if (response.success && response.userProfile) {
                    // Update local state to reflect the new email
                    setFields(prev => ({
                        ...prev,
                        email: newEmail
                    }));
                    
                    // Update the context with the updated user profile from the server
                    setCurrentUser(response.userProfile);
                    
                    setShowEmailModal(false);
                    setNewEmail('');
                    setemailVerifyPassword('');
                    alert('Email updated successfully!');
                } else {
                    throw new Error('Failed to update email - no user profile returned');
                }
            } catch (error) {
                console.error('Error updating email:', error);
                alert('Failed to update email: ' + error.message);
            }
        };        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            try {
                const response = await updateUserProfile(fields.username, { hashedPassword: newPassword }, oldPassword);
                
                if (response.success) {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setoldPassword('');
                    alert('Password updated successfully!');
                } else {
                    throw new Error('Failed to update password');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                alert('Failed to update password: ' + error.message);
            }
        };        return(
        <div className={
            AboutStyles.popupOverlayBaseStyle + " " +
            (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)
        }>
            <div className={
                AboutStyles.popupContentBaseStyle + " " +
                (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)
            }>
                <button 
                    className={
                        AboutStyles.popupCloseButtonBaseStyle + " " +
                        (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)
                    }
                    onClick={onClose}
                >
                    <CloseIcon />
                </button>
                <div className={AboutStyles.popupBodyStyle}>
                    <h2 className={
                        AboutStyles.popupBodyH2BaseStyle + " " +
                        (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)
                    }>
                        User Profile
                    </h2>                    <div className="max-w-sm mx-auto text-left">
                        {Object.entries(fields).map(([key, value]) => (
                            <div key={key} className="mb-4">
                                <div className={
                                    "font-medium text-sm " +
                                    (isLightMode ? "text-gray-600" : "text-gray-300")
                                }>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </div>
                                <div className={
                                    "mt-1 text-base break-all " +
                                    (isLightMode ? "text-gray-800" : "text-gray-100")
                                }>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>                    {/* Buttons for changing email and password */}
                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        <button 
                            onClick={() => setShowEmailModal(true)} 
                            className={
                                "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 " +
                                (isLightMode 
                                    ? "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400" 
                                    : "bg-yellow-500 text-slate-900 hover:bg-yellow-400 focus:ring-yellow-600")
                            }
                        >
                            Change Email
                        </button>
                        <button 
                            onClick={() => setShowPasswordModal(true)} 
                            className={
                                "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 " +
                                (isLightMode 
                                    ? "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400" 
                                    : "bg-yellow-500 text-slate-900 hover:bg-yellow-400 focus:ring-yellow-600")
                            }
                        >
                            Change Password
                        </button>                        <button 
                            onClick={() => {
                                setShowGameHistory(true);
                                loadGameHistory(); // Refresh game history data from database
                            }} 
                            className={
                                "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 " +
                                (isLightMode 
                                    ? "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400" 
                                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 focus:ring-emerald-600")
                            }
                        >
                            Game History
                        </button>
                    </div>                </div>
            </div>
            {/* Email Modal */}
            {showEmailModal && (
                <div className={
                    AboutStyles.popupOverlayBaseStyle + " " +
                    (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)
                } style={{ zIndex: 1001 }}>
                    <div className={
                        AboutStyles.popupContentBaseStyle + " max-w-sm " +
                        (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)
                    }>
                        <button 
                            className={
                                AboutStyles.popupCloseButtonBaseStyle + " " +
                                (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)
                            }
                            onClick={() => setShowEmailModal(false)}
                        >
                            <CloseIcon />
                        </button>
                        <div className={AboutStyles.popupBodyStyle}>
                            <h3 className={
                                "text-xl font-bold mb-6 text-center " +
                                (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)
                            }>
                                Change Email
                            </h3>
                            <form onSubmit={handleEmailSubmit} className={FormStyles.formStyle}>
                                <div>
                                    <label className={
                                        "block text-sm font-medium mb-2 " +
                                        (isLightMode ? "text-gray-700" : "text-gray-200")
                                    }>
                                        New Email
                                    </label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        required
                                        className={
                                            FormStyles.formInputBaseStyle + " " +
                                            (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className={
                                        "block text-sm font-medium mb-2 " +
                                        (isLightMode ? "text-gray-700" : "text-gray-200")
                                    }>
                                        Verify Password
                                    </label>
                                    <input
                                        type="password"
                                        value={emailVerifyPassword}
                                        onChange={e => setemailVerifyPassword(e.target.value)}
                                        required
                                        className={
                                            FormStyles.formInputBaseStyle + " " +
                                            (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)
                                        }
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className={
                                        FormStyles.formSubmitButtonBaseStyle + " " +
                                        (isLightMode ? FormStyles.formSubmitButtonLightStyle : FormStyles.formSubmitButtonDarkStyle)
                                    }
                                >
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}            {/* Password Modal */}
            {showPasswordModal && (
                <div className={
                    AboutStyles.popupOverlayBaseStyle + " " +
                    (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)
                } style={{ zIndex: 1001 }}>
                    <div className={
                        AboutStyles.popupContentBaseStyle + " max-w-sm " +
                        (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)
                    }>
                        <button 
                            className={
                                AboutStyles.popupCloseButtonBaseStyle + " " +
                                (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)
                            }
                            onClick={() => setShowPasswordModal(false)}
                        >
                            <CloseIcon />
                        </button>
                        <div className={AboutStyles.popupBodyStyle}>
                            <h3 className={
                                "text-xl font-bold mb-6 text-center " +
                                (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)
                            }>
                                Change Password
                            </h3>
                            <form onSubmit={handlePasswordSubmit} className={FormStyles.formStyle}>
                                <div>
                                    <label className={
                                        "block text-sm font-medium mb-2 " +
                                        (isLightMode ? "text-gray-700" : "text-gray-200")
                                    }>
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        className={
                                            FormStyles.formInputBaseStyle + " " +
                                            (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className={
                                        "block text-sm font-medium mb-2 " +
                                        (isLightMode ? "text-gray-700" : "text-gray-200")
                                    }>
                                        Verify Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={e => setoldPassword(e.target.value)}
                                        required
                                        className={
                                            FormStyles.formInputBaseStyle + " " +
                                            (isLightMode ? FormStyles.formInputLightStyle : FormStyles.formInputDarkStyle)
                                        }
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className={
                                        FormStyles.formSubmitButtonBaseStyle + " " +
                                        (isLightMode ? FormStyles.formSubmitButtonLightStyle : FormStyles.formSubmitButtonDarkStyle)
                                    }
                                >
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>                </div>
            )}
            {/* Game History Modal */}
            {showGameHistory && (
                <div className={
                    AboutStyles.popupOverlayBaseStyle + " " +
                    (isLightMode ? AboutStyles.popupOverlayLightStyle : AboutStyles.popupOverlayDarkStyle)
                } style={{ zIndex: 1001 }}>
                    <div className={
                        AboutStyles.popupContentBaseStyle + " max-w-4xl max-h-[80vh] overflow-hidden " +
                        (isLightMode ? AboutStyles.popupContentLightStyle : AboutStyles.popupContentDarkStyle)
                    }>
                        <button 
                            className={
                                AboutStyles.popupCloseButtonBaseStyle + " " +
                                (isLightMode ? AboutStyles.popupCloseButtonLightStyle : AboutStyles.popupCloseButtonDarkStyle)
                            }
                            onClick={() => setShowGameHistory(false)}
                        >
                            <CloseIcon />
                        </button>
                        <div className={AboutStyles.popupBodyStyle}>
                            <h2 className={
                                AboutStyles.popupBodyH2BaseStyle + " " +
                                (isLightMode ? AboutStyles.popupBodyH2LightStyle : AboutStyles.popupBodyH2DarkStyle)
                            }>
                                Game History
                            </h2>
                            <div className="max-h-[60vh] overflow-hidden text-left">
                                {loadingGameHistory ? (
                                    <div className="text-center py-8">
                                        <div className={
                                            "text-lg " +
                                            (isLightMode ? "text-gray-600" : "text-gray-300")
                                        }>
                                            Loading game history...
                                        </div>
                                    </div>
                                ) : Object.keys(gameHistory).length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className={
                                            "text-lg " +
                                            (isLightMode ? "text-gray-500" : "text-gray-400")
                                        }>
                                            No games played yet. Start playing to see your history!
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Tab Navigation */}
                                        <div className="flex flex-wrap border-b mb-4 px-4">
                                            {['All', ...Object.keys(gameHistory)].map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveTab(tab)}
                                                    className={
                                                        "px-4 py-2 mr-2 mb-2 rounded-t-lg font-medium text-sm transition-colors duration-150 focus:outline-none " +
                                                        (activeTab === tab
                                                            ? (isLightMode 
                                                                ? "bg-blue-500 text-white border-b-2 border-blue-500" 
                                                                : "bg-yellow-500 text-slate-900 border-b-2 border-yellow-500")
                                                            : (isLightMode 
                                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-b-2 border-transparent" 
                                                                : "bg-slate-600 text-gray-200 hover:bg-slate-500 border-b-2 border-transparent"))
                                                    }                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Tab Content */}
                                        <div className="overflow-y-auto max-h-[45vh] px-4">
                                            {activeTab === 'All' ? (
                                                // Show all game modes with limited entries
                                                Object.entries(gameHistory).map(([gameMode, games]) => (
                                                    <div key={gameMode} className="mb-6">
                                                        <h4 className={
                                                            "text-lg font-bold pb-2 mb-4 border-b-2 " +
                                                            (isLightMode 
                                                                ? "text-blue-700 border-blue-200" 
                                                                : "text-yellow-400 border-yellow-600/30")
                                                        }>
                                                            {gameMode}
                                                        </h4>
                                                        {games.slice(0, 3).map((game, index) => (
                                                            <GameHistoryCard 
                                                                key={index} 
                                                                game={game} 
                                                                isLightMode={isLightMode}
                                                                formatDate={formatDate}
                                                                formatDuration={formatDuration}
                                                            />
                                                        ))}
                                                        {games.length > 3 && (
                                                            <div className={
                                                                "text-center text-sm mt-2 mb-4 " +
                                                                (isLightMode ? "text-gray-600" : "text-gray-400")
                                                            }>
                                                                +{games.length - 3} more games in {gameMode} tab
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                // Show specific game mode
                                                gameHistory[activeTab] && gameHistory[activeTab].map((game, index) => (
                                                    <GameHistoryCard 
                                                        key={index} 
                                                        game={game} 
                                                        isLightMode={isLightMode}
                                                        formatDate={formatDate}
                                                        formatDuration={formatDuration}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}        </div>    );
}

export default UserProfile;