import { getDatabase, ref, push, set, get } from 'firebase-admin/database';
import { initializeFirebase, getDatabaseReference } from './firebaseAdmin.js';


// Register a new user
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

// Verify user
export async function verifyUser(username, hashedPassword) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }

    console.log('Verifying user:', username);
    console.log('verifying password:', hashedPassword);

    // Get user directly by username (which is now the key)
    const userRef = db.ref(`users/${username}`);    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
        return Promise.reject(new Error('Invalid username or password'));
    }    const user = userSnapshot.val();
    
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
    });    return newSessionRef.key;
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