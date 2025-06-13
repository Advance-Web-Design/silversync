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
    });

    return newSessionRef.key;
}