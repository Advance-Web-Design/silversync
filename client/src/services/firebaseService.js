import config from '../config/api.config';
import { logger } from '../utils/loggerUtils';



// this service handles all Firebase-related API calls
// to add new functions use one of the existing functions as a template
// and then add a corresponding route in the server/app/api/firebase/[...path]/route.js file
// for example regiser is in server/app/api/firebase/register/[...path]/route.js
// and for it to be called the API_BASE neededs to be appended with /register/*
// the * is a wildcard that allows any additional path to be passed, you can use it to pass additional parameters if needed
// the * can be replaced with anything you want, but make sure there is something after the last slash










const API_BASE = `${config.backend.baseUrl}/api/firebase` ; 



export async function updateUserProfile(username, userDetails, verifyPassword) {
  logger.info("Updating user profile for user:", username, userDetails);
  
  const hashedPassword = await hashPassword(verifyPassword);
  //hashing the password before sending it to the server
  if (userDetails.hashedPassword) 
    userDetails.hashedPassword = await hashPassword(userDetails.hashedPassword);
  const res = await fetch(`${API_BASE}/update-profile/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, userDetails, hashedPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    // Throw the backend error message if available
    throw new Error(data.message || 'Profile update failed');
  }

  return data; // Return the full response which includes both success and userProfile
}

export async function forgotPassword(username, email) {
  logger.info("Forgot password for user:", username, email);
  
  const res = await fetch(`${API_BASE}/forgot-password/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the backend error message if available
    throw new Error(data.message || 'Forgot password failed');
  }

  return data.success;

}

/**
 * creates a new user in Firebase, with data organized into UserDetails and gamehistory sections
 * @param {*} username 
 * @param {*} password 
 * @param {*} email 
 * @returns {Promise<string>} The username (which serves as the user ID)
 */
export async function addUser(username, password, email) {

  logger.info("Adding user:", username, email, password);
  // hash the password before sending it to the server
  const hashedPassword = await hashPassword(password);
  const res = await fetch(`${API_BASE}/register/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, hashedPassword, email }),
  });

  const data = await res.json();


  if (!res.ok) {
    // Throw the backend error message if available
    throw new Error(data.message || 'Registration failed');
  }

  return data.userId;
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
export async function record_game_session(
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
) {
  const sessionData = {
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

  const res = await fetch(`${API_BASE}/game-session/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });

  const data = await res.json();
  return data.gameId;
}


export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
}






/**
 * verifies a user by checking their username and password against the Firebase database.
 * @param {*} username 
 * @param {*} password 
 * @returns {Promise<object>} The user profile object with UserDetails and gamehistory if login is successful
 */
export async function verifyUser(username, password) {

  // Hash the password before sending it to the server
  const hashedPassword = await hashPassword(password);
  const res = await fetch(`${API_BASE}/login/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, hashedPassword }),
  });
  const data = await res.json();
  
  if (!res.ok) {
    // Throw the backend error message if available
    throw new Error(data.message || 'login failed');
  }
  return data.userProfile;
}

/**
 * Saves a completed game to the user's game history in Firebase
 * @param {string} userId - The user ID 
 * @param {string} gameMode - The game mode name (e.g., "Classic", "Medium", "Hard")
 * @param {Object} gameData - Game data containing:
 *   - startingActor1: name of first starting actor
 *   - startingActor2: name of second starting actor  
 *   - pathLength: length of the solution path
 *   - fullPath: array containing the complete path from actor1 to actor2
 *   - timeTaken: time in seconds to complete the game
 *   - score: final game score
 *   - completedAt: timestamp when game was completed
 * @returns {Promise<string>} The ID of the saved game
 */
export async function saveGameToHistory(userId, gameMode, gameData) {
  const res = await fetch(`${API_BASE}/save-game-history/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gameMode, gameData }),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Failed to save game to history');
  }

  return data.gameId;
}

/**
 * Fetches leaderboard data for a specific challenge or all challenges
 * @param {string} challengeId - The challenge ID to fetch leaderboard for (optional, defaults to 'all')
 * @returns {Promise<Object|Array>} Leaderboard data - array for specific challenge, object for all challenges
 */
export async function fetchLeaderboard(challengeId = 'all') {
  const params = challengeId !== 'all' ? `?challenge=${challengeId}` : '';
  const res = await fetch(`${API_BASE}/leaderboard${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch leaderboard');
  }

  return data;
}

/**
 * Fetches user game history from Firebase
 * @param {string} userId - The user ID to fetch game history for
 * @returns {Promise<Object>} Game history object organized by game modes
 */
export async function fetchUserGameHistory(userId) {
  const res = await fetch(`${API_BASE}/user-game-history/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch game history');
  }

  return data.gameHistory || {};
}



