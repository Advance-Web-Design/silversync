import { get } from "firebase/database";
import { getDatabase, ref, push, set } from "firebase/database";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

let app = null;
let db = null;

// Lazy initialization function
const initializeFirebase = () => {
  if (app) return { app, db };
  
  // Only initialize if environment variables are available
  if (!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_PROJECT_ID) {
    console.warn('Firebase client environment variables not available');
    return { app: null, db: null };
  }
  
  try {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    
    return { app, db };
  } catch (error) {
    console.warn('Firebase client initialization failed:', error.message);
    return { app: null, db: null };
  }
};

// Register a new user
export async function addUser(username, password, email) {
  const { db } = initializeFirebase();
  if (!db) {
    throw new Error('Firebase database not available');
  }

console.log('Adding user:', username, email);

//     // Check if user already exists             
// const existingUsers = await db.collection('users').where('username', '==', username).get();
// if (!existingUsers.empty) {     
//     return Promise.reject(new Error('Username already exists'));
//     }      

  const usersRef = ref(db, 'users');
  const newUserRef = push(usersRef);
  const userData = {
    username,
    password, // In production, hash the password!
    email,
    user_game_history: {} // Empty for now
  };

  await set(newUserRef, userData);
  return newUserRef.key; // Return the generated user ID
    
//   const userRecord = await auth.createUser({
//     email,
//     password,
//     displayName: username,
//   });
//   // Optionally store extra info in Firestore
//   await db.collection('users').doc(userRecord.uid).set({
//     username,
//     email,
//     createdAt: new Date(),
//   });
//   return userRecord.uid;


}

// Verify user credentials (basic example)
export async function verifyUser(username, password) {
  const { db } = initializeFirebase();
  if (!db) {
    throw new Error('Firebase database not available');
  }
  
  // Note: This is a basic example. In production, use proper authentication
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  
  if (!snapshot.exists()) {
    throw new Error('User not found');
  }
  
  const users = snapshot.val();
  const userEntry = Object.entries(users).find(([key, user]) => 
    user.username === username && user.password === password
  );
  
  if (!userEntry) {
    throw new Error('Invalid credentials');
  }
  
  return userEntry[0]; // Return user ID
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