import { getDatabase, ref, push, set, get } from 'firebase-admin/database';
import { initializeFirebase, getDatabaseReference } from './firebaseAdmin.js';


// Register a new user
export async function addUser(username, hashedPassword, email) {
    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }



    console.log('Adding user:', username, email);

    // Check if user already exists             
    const usersSnapshot = await db.ref('users').once('value');
    let usernameExists = false;
    let emailExists = false;

    usersSnapshot.forEach(childSnapshot => {
        const user = childSnapshot.val();
        if (user.username === username) {
            usernameExists = true;
        }
        if (user.email === email) {
            emailExists = true;
        }
    });
    if (usernameExists) {
        return Promise.reject(new Error('Username already exists'));
    }
    if (emailExists) {
        return Promise.reject(new Error('Email already in use'));  
    }

    const usersRef = db.ref('users');
    const newUserRef = usersRef.push();
    const userData = {
        username,
        hashedPassword,
        email,
        user_game_history: {} // Empty for now
    };

    
    await newUserRef.set(userData);
    //await set(newUserRef, userData);

    return newUserRef.key; // Return the generated user ID



}

// Verify user
export async function verifyUser(username, hashedPassword) {

    const { app, db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase database not available');
    }


    console.log('Verifying user:', username);
    console.log('verifying password:', hashedPassword);



    const usersSnapshot = await db.ref('users').once('value');
    let foundUser = null;
    let foundUserId = null;
    usersSnapshot.forEach(childSnapshot => {
        const user = childSnapshot.val();
        if (user.username === username && user.hashedPassword === hashedPassword) {
            foundUser = user;
			foundUserId = childSnapshot.key;

        }
    });
    if (!foundUser) {
        return Promise.reject(new Error('Invalid username or password'));
    }

    if (!usersSnapshot.exists()) {
        console.error('Database Users not found');
        return Promise.reject(new Error('Database issue, users not found'));
    }

  

    // Remove hashedPassword before returning
    const { hashedPassword: _, ...userProfile } = foundUser;
    userProfile.userId = foundUserId;

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