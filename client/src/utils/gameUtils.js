// Utilities for game functionality
import { logger } from './loggerUtils';

/**
 * Validates if two actors can be used to start the game
 * @param {Object} actor1 - First actor object
 * @param {Object} actor2 - Second actor object
 * @returns {Object} - { valid: boolean, error: string | null }
 */
export const validateStartActors = (actor1, actor2) => {
  if (!actor1 || !actor2) {
    return { valid: false, error: "Please select two actors to start the game." };
  }
  
  if (actor1.id === actor2.id) {
    return { valid: false, error: "Cannot start with duplicate actors. Please select two different actors." };
  }
  
  return { valid: true, error: null };
};

/**
 * Initializes the game board with starting actors
 * @param {Array} startActors - Array of two actor objects to start the game with
 * @returns {Object} - { nodes, nodePositions }
 */
export const initializeGameBoard = (startActors) => {
  if (!startActors[0] || !startActors[1]) {
    return { nodes: [], nodePositions: {} };
  }
  
  const actor1Id = `person-${startActors[0].id}`;
  const actor2Id = `person-${startActors[1].id}`;
  
  const nodes = [
    { id: actor1Id, type: 'person', data: startActors[0] },
    { id: actor2Id, type: 'person', data: startActors[1] }
  ];
  
  const nodePositions = {
    [actor1Id]: { x: 100, y: 100 },
    [actor2Id]: { x: 500, y: 100 }
  };
  
  return { nodes, nodePositions };
};

/**
 * Updates the best score in localStorage if the current score is better
 * @param {number} currentScore - The score from the current game
 * @param {number|null} bestScore - The current best score
 * @returns {number} - The new best score
 */
export const updateBestScore = (currentScore, bestScore) => {
  if (!bestScore || currentScore < bestScore) {
    localStorage.setItem('bestScore', currentScore.toString());
    return currentScore;
  }
  return bestScore;
};

/**
 * Loads the best score from localStorage
 * @returns {number|null} - The best score or null if not set
 */
export const loadBestScore = () => {
  try {
    const savedBestScore = localStorage.getItem('bestScore');
    return savedBestScore ? parseInt(savedBestScore) : null;
  } catch (error) {
    logger.error('Error loading best score:', error);
    return null;
  }
};

/**
 * Resets all game state
 * @returns {Object} - Initial game state values
 */
export const getInitialGameState = () => {
  return {
    nodes: [],
    nodePositions: {},
    connections: [],
    searchResults: [],
    connectableItems: {}
  };
};

/**
 * Updates actor search state for a specific actor index
 * @param {string} term - Search term
 * @param {number} actorIndex - Index (0 or 1) of the actor position
 * @param {Array} currentTerms - Current search terms array
 * @returns {Array} - Updated search terms array
 */
export const updateActorSearchTerm = (term, actorIndex, currentTerms) => {
  const newTerms = [...currentTerms];
  newTerms[actorIndex] = term;
  return newTerms;
};

/**
 * Clears actor search results for a specific index
 * @param {number} actorIndex - Index (0 or 1) of the actor position
 * @param {Array} currentResults - Current search results array
 * @returns {Array} - Updated search results array
 */
export const clearActorSearchResults = (actorIndex, currentResults) => {
  const newResults = [...currentResults];
  newResults[actorIndex] = [];
  return newResults;
};