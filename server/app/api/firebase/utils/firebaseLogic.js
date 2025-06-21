import { getDatabase, ref, push, set, get } from 'firebase-admin/database';
import { initializeFirebase, getDatabaseReference } from './firebaseAdmin.js';
import { sendPasswordResetEmail } from '../../utils/emailService.js';

/**
 * Generates a random password with at least one uppercase letter and one number.
 * @returns {string} A random password of length 8 containing at least one uppercase letter and one number.
 * @description This function generates a random password that is 8 characters long, ensuring it contains at least one uppercase letter and one number. The rest of the characters can be any combination of uppercase letters, lowercase letters, and numbers.
 * */
function generateRandomPassword() {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const all = upper + lower + numbers;

    let password = '';
    // Ensure at least one uppercase and one number
    password += upper[Math.floor(Math.random() * upper.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    // Fill the rest
    for (let i = 2; i < 8; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Hashes a password using SHA-256. 
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password in hexadecimal format.
 * */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Function to handle forgot password functionality
 * @param {string} username - The username of the user
 * @param {string} email - The email address of the user  
 * @description Verifies if the username and email match in the database, generates a new password, updates it in the database, and sends an email notification
 * @returns {Promise<{ success: boolean, message: string }>} A promise that resolves to an object indicating success and a message.
 */
export async function forgotPassword(username, email) {
    const { db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Processing forgot password request for user:', username, 'with email:', email);

    // Validate input
    if (!username || !email) {
        throw new Error('Username and email are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }

    const userRef = db.ref(`users/${username}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        // For security reasons, don't reveal if the username exists or not
        throw new Error('If the username and email combination is valid, a new password will be sent to your email');
    }

    const user = userSnapshot.val();

    // Check if email matches (case-insensitive comparison)
    if (!user.UserDetails || !user.UserDetails.email || 
        user.UserDetails.email.toLowerCase() !== email.toLowerCase()) {
        // For security reasons, don't reveal if the email matches or not
        throw new Error('If the username and email combination is valid, a new password will be sent to your email');
    }    try {
        const newPassword = generateRandomPassword();
        
        // Hash the new password before storing it
        const hashedNewPassword = await hashPassword(newPassword);
        
        console.log(`Generated new password for ${username}: ${newPassword}`);
        console.log(`Hashed password: ${hashedNewPassword.substring(0, 20)}...`);
        
        // Update password in database
        await userRef.child('UserDetails/hashedPassword').set(hashedNewPassword);
        console.log(`Password updated in Firebase for user: ${username}`);
        
        // Send email with new password
        await sendPasswordResetEmail(email, username, newPassword);

        console.log(`Password reset successful for user: ${username}`);
        return { 
            success: true, 
            message: 'A new password has been sent to your email address. Please check your inbox and change your password after logging in.' 
        };

    } catch (error) {
        console.error('Error during password reset process:', error);
        throw new Error('Failed to reset password. Please try again later.');
    }
}
/**
 * function to update user info in the Firebase database
 * @param {*} username 
 * @param {*} hashedPassword 
 * @param {*} email 
 * @description updates user info, email or password.
 * @returns username or an error if the user already exists
 */
export async function updateUserProfile(username, userDetails, hashedOldPassword) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('updating user:', username, userDetails.email);


    // Check if username exists by trying to get the user directly
    const userRef = db.ref(`users/${username}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        return Promise.reject(new Error('Username does not  exist'));
    }

    // user wants to update their email, so we need to check if the new email is already in use
    if (userSnapshot.val().UserDetails.email !== userDetails.email && userDetails.email) {
        // Check if email already exists by querying all users
        const usersSnapshot = await db.ref('users').orderByChild('UserDetails/email').equalTo(userDetails.email).once('value');
        if (usersSnapshot.exists()) {
            return Promise.reject(new Error('Email already in use'));
        }
        else{
            // update email
            await userRef.child('UserDetails/email').set(userDetails.email);
        }
    }
    //if true, user wants to update their password
    if (userSnapshot.val().UserDetails.hashedPassword !== userDetails.hashedOldPassword && userDetails.hashedPassword) {
        // update password
        await userRef.child('UserDetails/hashedPassword').set(userDetails.hashedPassword);
    }



    return username; // Return the username as the user ID
}

/**
 * function to add a new user to the Firebase database
 * @param {*} username 
 * @param {*} hashedPassword 
 * @param {*} email 
 * @description This function checks if the username already exists in the database. If it does, it returns an error. It also checks if the email is already in use by querying all users. If both checks pass, it adds the user with the provided username, hashed password, and email.
 * @returns username or an error if the user already exists
 */
export async function addUser(username, hashedPassword, email) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Adding user:', username, email);


    // Check if username already exists by trying to get the user directly
    const userRef = db.ref(`users/${username}`);    
    const userSnapshot = await userRef.once('value');
    
    if (userSnapshot.exists()) {
        return Promise.reject(new Error('Username already exists'));
    }    
    
    // Check if email already exists by querying all users
    const usersSnapshot = await db.ref('users').orderByChild('UserDetails/email').equalTo(email).once('value');
    if (usersSnapshot.exists()) {
        return Promise.reject(new Error('Email already in use'));
    }

    const userData = {
        UserDetails: {
            username,
            hashedPassword,
            email
        },
        gamehistory: {} // Empty for now
    };

    // Use username as the key
    await userRef.set(userData);

    return username; // Return the username as the user ID
}

/**
 * verifyUser function to check if a user exists and if the password matches
 * @param {*} username 
 * @param {*} hashedPassword 
 * @description This function retrieves the user by username (which is the key in the database). It checks if the user exists and if the provided hashed password matches the stored hashed password. If both checks pass, it returns the user profile excluding the password. If the user does not exist or the password does not match, it returns an error.
 * @returns user profile object or an error if the user does not exist or password does not match
 */
export async function verifyUser(username, hashedPassword) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Verifying user:', username);
    console.log('verifying password:', hashedPassword);

    // Get user directly by username (which is now the key)
    const userRef = db.ref(`users/${username}`); const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        return Promise.reject(new Error('Invalid username or password'));
    } const user = userSnapshot.val();

    // Check if password matches (password is now in UserDetails section)
    if (!user.UserDetails || user.UserDetails.hashedPassword !== hashedPassword) {
        return Promise.reject(new Error('Invalid username or password'));
    }

    // Return user profile with UserDetails (excluding password) and gamehistory
    const userProfile = {
        userId: username,
        username: user.UserDetails.username,
        email: user.UserDetails.email,
        gamehistory: user.gamehistory || {}
    };

    return userProfile;
}


// Record a game session
export async function recordGameSession(sessionData) {
    const { db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    const sessionsRef = ref(db, 'gameSessions');
    const newSessionRef = push(sessionsRef);

    await set(newSessionRef, {
        ...sessionData,
        createdAt: new Date().toISOString(),
    }); return newSessionRef.key;
}

// Save game to user's game history
export async function saveGameToUserHistory(userId, gameMode, gameData) {
    const { db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Saving game to history for user:', userId, 'gameMode:', gameMode);
    console.log('Server - received gameData:', JSON.stringify(gameData, null, 2));
    console.log('Server - gameData keys:', Object.keys(gameData));

    // Get user reference
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        throw new Error('User not found');
    }

    // Get current game history
    const user = userSnapshot.val();
    const gameHistory = user.gamehistory || {};

    // Initialize game mode if it doesn't exist
    if (!gameHistory[gameMode]) {
        gameHistory[gameMode] = [];
    }

    // Add new game to the beginning of the array and keep only the last 10
    const newGameEntry = {
        startingActor1: gameData.startingActor1,
        startingActor2: gameData.startingActor2,
        pathLength: gameData.pathLength,
        fullPath: gameData.fullPath,
        timeTaken: gameData.timeTaken,
        score: gameData.score,
        completedAt: gameData.completedAt
    };

    console.log('Server - newGameEntry being saved:', JSON.stringify(newGameEntry, null, 2));
    console.log('Server - newGameEntry keys:', Object.keys(newGameEntry));

    gameHistory[gameMode].unshift(newGameEntry);

    // Keep only the last 10 games for this mode
    if (gameHistory[gameMode].length > 10) {
        gameHistory[gameMode] = gameHistory[gameMode].slice(0, 10);
    }

    console.log('Updated game history:', gameHistory);

    // Update the user's game history - use update instead of set for better error handling
    try {
        await userRef.child('gamehistory').update(gameHistory);
        console.log('Successfully updated game history in Firebase');
    } catch (error) {
        console.error('Error updating game history:', error);
        // Try alternative approach - set the entire gamehistory object
        await userRef.update({ gamehistory: gameHistory });
    }

    // Update challenge-specific leaderboard if this is a top 10 score
    await updateChallengeLeaderboard(db, gameMode, userId, newGameEntry);

    // Generate a unique game ID for this save
    const gameId = `${userId}_${gameMode}_${Date.now()}`;

    console.log('Game saved to history with ID:', gameId);
    return gameId;
}

/**
 * Update the leaderboard for a specific challenge
 * Maintains top 10 scores per challenge
 */
async function updateChallengeLeaderboard(db, gameMode, userId, gameEntry) {
    try {
        // Get current leaderboard for this challenge
        const leaderboardRef = db.ref(`leaderboards/${gameMode}`);
        const leaderboardSnapshot = await leaderboardRef.once('value');
        let leaderboard = leaderboardSnapshot.val() || [];

        // Convert to array if it's an object (legacy compatibility)
        if (!Array.isArray(leaderboard)) {
            leaderboard = Object.values(leaderboard);
        }        // Create new leaderboard entry
        const newEntry = {
            username: userId,
            score: gameEntry.score,
            time: gameEntry.timeTaken,
            startingActor1: gameEntry.startingActor1,
            startingActor2: gameEntry.startingActor2,
            pathLength: gameEntry.pathLength,
            fullPath: gameEntry.fullPath,
            completedAt: gameEntry.completedAt,
            gameId: `${userId}_${gameMode}_${Date.now()}`
        };

        // Add new entry to leaderboard
        leaderboard.push(newEntry);        // Sort by score (higher is better), then by time (faster is better)
        leaderboard.sort((a, b) => {
            if (a.score === b.score) {
                const timeA = typeof a.time === 'string' ? parseInt(a.time) : a.time;
                const timeB = typeof b.time === 'string' ? parseInt(b.time) : b.time;
                return timeA - timeB; // Lower time is better
            }
            return b.score - a.score; // Higher score is better
        });

        // Keep only top 10
        leaderboard = leaderboard.slice(0, 10);

        // Add ranks
        leaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        // Update the leaderboard in Firebase
        await leaderboardRef.set(leaderboard);
        console.log(`Updated leaderboard for ${gameMode}, new entry rank:`,
            leaderboard.findIndex(entry => entry.gameId === newEntry.gameId) + 1);

    } catch (error) {
        console.error('Error updating challenge leaderboard:', error);
        // Don't throw error as game saving should still work
    }
}

/**
 * Fetches user game history from Firebase
 * @param {string} userId - The user ID to fetch game history for
 * @returns {Promise<Object>} Game history object organized by game modes
 */
export async function getUserGameHistory(userId) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Fetching game history for user:', userId);

    // Get user game history
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        throw new Error('User not found');
    }

    const user = userSnapshot.val();
    return user.gamehistory || {};
}