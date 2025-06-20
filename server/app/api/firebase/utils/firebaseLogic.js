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
    const userRef = db.ref(`users/${username}`);    const userSnapshot = await userRef.once('value');
    
    if (userSnapshot.exists()) {
        return Promise.reject(new Error('Username already exists'));
    }    // Check if email already exists by querying all users
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
    }    // Add new game to the beginning of the array and keep only the last 10
    const newGameEntry = {
        startingActor1: gameData.startingActor1,
        startingActor2: gameData.startingActor2,
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

    // Generate a unique game ID for this save
    const gameId = `${userId}_${gameMode}_${Date.now()}`;
    
    console.log('Game saved to history with ID:', gameId);
    return gameId;
}