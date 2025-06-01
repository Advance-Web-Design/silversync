import config from '../config/api.config';



// this service handles all Firebase-related API calls
// to add new functions use one of the existing functions as a template
// and then add a corresponding route in the server/app/api/firebase/[...path]/route.js file
// for example regiser is in server/app/api/firebase/register/[...path]/route.js
// and for it to be called the API_BASE neededs to be appended with /register/*
// the * is a wildcard that allows any additional path to be passed, you can use it to pass additional parameters if needed
// the * can be replaced with anything you want, but make sure there is something after the last slash



const API_BASE = `${config.backend.baseUrl}/firebase` ; 

/**
 * creates a new user in Firebase, in the firebase database it also adds an empty user_game_history object to the user
 * @param {*} username 
 * @param {*} password 
 * @param {*} email 
 * @returns {Promise<string>} The user ID of the newly created user
 */
export async function addUser(username, password, email) {

  const res = await fetch(`${API_BASE}/register/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });

  const data = await res.json();
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



/**
 * verifies a user by checking their username and password against the Firebase database.
 * @param {*} username 
 * @param {*} password 
 * @returns {Promise<string>} The user ID if the login is successful
 */
export async function verifyUser(username, password) {
  const res = await fetch(`${API_BASE}/login/*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data.userId;
}

