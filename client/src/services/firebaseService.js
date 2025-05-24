/**
 * firebase Service
 * 
 * this handles all incoming firebase requests
 * and returns the data to the client
 */

// rules_version = '2';


// service cloud.firestore {

//   match /databases/{database}/documents {

//     match /{document=**} {

//       allow read, write: if false;

//     }

//   }

// }

// Import the functions you need from the SDKs you need



import { get } from "firebase/database";

import { getDatabase, ref, push, set } from "firebase/database";

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyBDxmC4dD1h5rSX4B0fYXdXyrfVkfRQfVA",

  authDomain: "connect-the-shows.firebaseapp.com",

  databaseURL: "https://connect-the-shows-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "connect-the-shows",

  storageBucket: "connect-the-shows.firebasestorage.app",

  messagingSenderId: "664860565094",

  appId: "1:664860565094:web:ec91285b3200b125a017a7",

  measurementId: "G-XHY935VDBE"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

const db = getDatabase(app);



/**
 * Adds a new user to the database.
 * @param {string} username
 * @param {string} password
 * @param {string} email
 * @returns {Promise<string>} The new user's ID
 */
export async function addUser(username, password, email) {
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
}
/** 
  * Records a game session in the database.
  * @param {string} user - The user ID of the player.
  * @param {number} time_started - The timestamp when the game started.
  * @param {number} session_duration - The duration of the game session in seconds.
  * @param {string} winlose - The result of the game ('win' or 'lose'). 
  * @param {number} num_connections - The number of connections made during the game.
  * @param {number} num_optimal_connections - The number of optimal connections number in the game.
  * @param {string} actor1 - The first actor in the game.
  * @param {string} actor2 - The second actor in the game.
  * @param {string} challenge_type - The type of challenge played.
  * @param {number} points - The points scored in the game.
  * @return {Promise<string>} The ID of the recorded game session.
  */
export async function record_game_session(user, time_started, session_duration, winlose, num_connections,num_optimal_connections, actor1,actor2,challenge_type, points ) {
  const game_sessions_ref = ref(db, 'game_sessions');
  const newGameRef = push(game_sessions_ref);
  const gameData = {
    user,
    time_started,
    session_duration,
    winlose,
    num_connections,
    num_optimal_connections,
    actor1,
    actor2,
    challenge_type,
    points
  };

  await set(game_sessions_ref, gameData);

  add_Game_To_User(user, newGameRef.key); // Add the game to the user's game history

  return newGameRef.key; // Return the generated game ID
}

async function add_Game_To_User(userId, gameId) {
  // Reference to the user's game history
  const userGameHistoryRef = ref(db, `users/${userId}/user_game_history`);
  // Add the gameId as a key with a value of true (because json stores key-value pairs)
  await update(userGameHistoryRef, { [gameId]: true });
}

export async function verifyUser(username, password) {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const userId in users) {
      const user = users[userId];
      if (user.username === username && user.password === password) {
        return userId; // Return the user ID if credentials match
      }
    }
  }
  return null; // Return null if no match found
}

export default {
  addUser,
  record_game_session,
  verifyUser
};