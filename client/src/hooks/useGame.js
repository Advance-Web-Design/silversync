import { useState, useEffect } from 'react';
import { getPersonDetails } from '../services/tmdbService';
import { saveGameToHistory as saveGameToFirebase } from '../services/firebaseService';
import { INITIAL_KNOWN_ENTITIES } from '../utils/constants';
import { logger } from '../utils/loggerUtils';
import { 
  validateStartActors,
  initializeGameBoard,
  updateBestScore,
  loadBestScore,
  getInitialGameState,
  updateActorSearchTerm,
  clearActorSearchResults
} from '../utils/gameUtils';

/**
 * Custom hook for managing game state
 * @returns {Object} - Game methods and state
 */
export const useGame = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameStartTime, setGameStartTime] = useState(null);
    const [startActors, setStartActors] = useState([null, null]);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [keepPlayingAfterWin, setKeepPlayingAfterWin] = useState(false);  
    const [startActorsError, setStartActorsError] = useState(null);
    const [knownEntities, setKnownEntities] = useState(INITIAL_KNOWN_ENTITIES);
  const [gameScore, setGameScore] = useState(() => loadBestScore());
  const [currentGameScore, setCurrentGameScore] = useState(null);
  
  const [shortestPathLength, setShortestPathLength] = useState(null);
  
  // Actor search related state
  const [actorSearchResults, setActorSearchResults] = useState([[], []]);
  const [actorSearchTerms, setActorSearchTerms] = useState(['', '']);
  const [actorSearchPages, setActorSearchPages] = useState([1, 1]);
  const [actorSearchTotalPages, setActorSearchTotalPages] = useState([1, 1]);
    // Load game score from localStorage on mount
  useEffect(() => {
    const savedScore = loadBestScore();
    if (savedScore) {
      setGameScore(savedScore);
    }
  }, []);
    /**
   * Start the game with the selected actors
   * @param {function} setNodes - Function to set board nodes
   * @param {function} setNodePositions - Function to set node positions
   */
  const startGame = async (setNodes, setNodePositions) => {
    // Validate if we can start the game with the selected actors
    const { valid, error } = validateStartActors(startActors[0], startActors[1]);
    
    if (!valid) {
      setStartActorsError(error);
      return;
    }
    
    setStartActorsError(null);
    setIsLoading(true);
    
    try {
      // The startActors should already be enhanced by selectStartActor
      // which now uses the modified getPersonDetails
      logger.info("Starting game with actors (already enhanced with guest appearances):", startActors);
    
      // Initialize the game board with the starting actors
      const { nodes, nodePositions } = initializeGameBoard(startActors);
      
      setNodes(nodes);
      setNodePositions(nodePositions);
      
      setGameStartTime(new Date().getTime());
      setGameStarted(true);
    } catch (error) {
      logger.error("Error starting game:", error);
      setStartActorsError("Error starting game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
    /**
   * Reset the game to initial state
   * @param {function} setNodes - Function to set board nodes
   * @param {function} setNodePositions - Function to set node positions
   * @param {function} setConnections - Function to set connections
   * @param {function} setSearchResults - Function to set search results
   * @param {function} setConnectableItems - Function to set connectable items
   */  const resetGame = (
    setNodes, 
    setNodePositions, 
    setConnections, 
    setSearchResults, 
    setConnectableItems
  ) => {    // Reset game state flags
    setGameStarted(false);
    setGameCompleted(false);
    setGameStartTime(null);
    setKeepPlayingAfterWin(false);
    setStartActors([null, null]);
    setShortestPathLength(null); // Reset shortest path length when starting a new game
    setCurrentGameScore(null); // Reset current game score when starting a new game
    
    // Reset board state using initial values
    const initialState = getInitialGameState();
    setNodes(initialState.nodes);
    setNodePositions(initialState.nodePositions);
    setConnections(initialState.connections);
    setSearchResults(initialState.searchResults);
    setConnectableItems(initialState.connectableItems);
    // Keep previousSearches and knownEntities for better suggestions across games
  };  /**
   * Set game as completed and update game score if needed
   * @param {number} score - Current game score
   * @param {Object} connectionResult - Connection result containing path information (optional)
   * @param {number} timeTaken - Time taken to complete the game in seconds (optional)
   * @param {Object} currentUser - Current logged in user (optional)
   * @param {string} challengeMode - Current challenge mode (optional)
   */
  const completeGame = (score, connectionResult = null, timeTaken = null, currentUser = null, challengeMode = null) => {
    setGameCompleted(true);
    setCurrentGameScore(score); // Store the current game's score
    
    // Update best score if current score is better (lower) than previous best score
    const newBestScore = updateBestScore(score, gameScore);
    if (newBestScore !== gameScore) {
      setGameScore(newBestScore);
    }

    // Save game to history if user is logged in
    if (currentUser && startActors[0] && startActors[1] && connectionResult) {
      saveGameToHistory(currentUser, score, connectionResult, timeTaken, challengeMode);
    }  };
  
  /**
   * Save completed game to user's game history
   * @param {Object} currentUser - Current logged in user
   * @param {number} score - Final game score
   * @param {number} timeTaken - Time taken to complete the game in seconds
   * @param {string} challengeMode - Current challenge mode
   */  const saveGameToHistory = async (currentUser, score,connectionResult, timeTaken, challengeMode) => {
    try {
      logger.info('💾 Saving game to history for user:', currentUser.userId);
        // Determine game mode name using the challenge id
      const gameModeName = challengeMode?.id || 'for-fun';
        // Get the board's nodes from the hook parameter (we need to pass this in)
      // For now, just save the path IDs and improve this later
        const gameData = {
        startingActor1: startActors[0].name,
        startingActor2: startActors[1].name,
        pathLength: connectionResult?.pathLength || 0,
        fullPath: connectionResult?.fullPath || [],
        timeTaken: timeTaken || Math.floor((Date.now() - gameStartTime) / 1000),
        score: score,
        completedAt: new Date().toISOString()
      };
      
      logger.info('🎮 Client - gameData being sent:', JSON.stringify(gameData, null, 2));
      logger.info('🎮 Client - gameData keys:', Object.keys(gameData));
        // Call the imported Firebase service function
      const result = await saveGameToFirebase(currentUser.userId, gameModeName, gameData);
      logger.info('✅ Game saved to history successfully, result:', result);
      
    } catch (error) {
      logger.error('❌ Failed to save game to history:', error);
      // Don't throw error as game completion should still work
    }
  };
    /**
   * Select an actor as a starting actor
   * @param {number} actorId - ID of the actor to select
   * @param {number} actorIndex - Index (0 or 1) of the actor position
   */
  const selectStartActor = async (actorId, actorIndex) => {
    try {
      if (!actorId) {
        setStartActors(prev => {
          const newStartActors = [...prev];
          newStartActors[actorIndex] = null;
          return newStartActors;
        });
        setActorSearchResults(prev => clearActorSearchResults(actorIndex, prev));
        setActorSearch('', actorIndex);
        return;
      }
      
      setIsLoading(true);      
      // getPersonDetails now handles merging of guest appearances
      const actorDetails = await getPersonDetails(actorId);

      setStartActors(prev => {
        const newStartActors = [...prev];
        newStartActors[actorIndex] = actorDetails;
        return newStartActors;
      });
      
      setActorSearchResults(prev => clearActorSearchResults(actorIndex, prev));
    } catch (error) {
      logger.error('Error selecting start actor:', error);
      // Potentially set an error state for the UI
    } finally {
      setIsLoading(false);
    }
  };
    /**
   * Set actor search term
   * @param {string} term - Search term
   * @param {number} actorIndex - Index (0 or 1) of the actor position
   */
  const setActorSearch = (term, actorIndex) => {
    setActorSearchTerms(prev => updateActorSearchTerm(term, actorIndex, prev));
  };
  
  return {
    isLoading, 
    setIsLoading,
    gameStarted, 
    setGameStarted,
    gameStartTime,
    setGameStartTime,
    startActors, 
    setStartActors,
    gameCompleted, 
    setGameCompleted,
    keepPlayingAfterWin, 
    setKeepPlayingAfterWin,
    startActorsError,
    setStartActorsError,    knownEntities,
    setKnownEntities,
    gameScore,
    setGameScore,
    currentGameScore, // Add current game score
    shortestPathLength,
    setShortestPathLength,
    actorSearchResults,
    setActorSearchResults,
    actorSearchTerms,
    setActorSearchTerms,
    actorSearchPages,
    setActorSearchPages, 
    actorSearchTotalPages,
    setActorSearchTotalPages,
    startGame,
    resetGame,
    completeGame,
    selectStartActor,
    setActorSearch
  };
};