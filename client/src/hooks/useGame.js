import { useState, useEffect } from 'react';
import { getPersonDetails } from '../services/tmdbService';
import { INITIAL_KNOWN_ENTITIES } from '../utils/constants';

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
  const [bestScore, setBestScore] = useState(() => {
    // Initialize best score from localStorage
    const savedBestScore = localStorage.getItem('bestScore');
    return savedBestScore ? parseInt(savedBestScore) : null;
  });
  const [shortestPathLength, setShortestPathLength] = useState(null);
  
  // Actor search related state
  const [actorSearchResults, setActorSearchResults] = useState([[], []]);
  const [actorSearchTerms, setActorSearchTerms] = useState(['', '']);
  const [actorSearchPages, setActorSearchPages] = useState([1, 1]);
  const [actorSearchTotalPages, setActorSearchTotalPages] = useState([1, 1]);
  
  // Load best score from localStorage on mount
  useEffect(() => {
    const savedBestScore = localStorage.getItem('bestScore');
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore));
    }
  }, []);
  
  /**
   * Start the game with the selected actors
   * @param {function} setNodes - Function to set board nodes
   * @param {function} setNodePositions - Function to set node positions
   */
  const startGame = async (setNodes, setNodePositions) => {
    if (startActors[0] && startActors[1]) {
      if (startActors[0].id === startActors[1].id) {
        setStartActorsError("Cannot start with duplicate actors. Please select two different actors.");
        return;
      }
      setStartActorsError(null);
      setIsLoading(true);
      
      try {
        // The startActors should already be enhanced by selectStartActor
        // which now uses the modified getPersonDetails
        console.log("Starting game with actors (already enhanced with guest appearances):", startActors);
      
        const actor1Id = `person-${startActors[0].id}`;
        const actor2Id = `person-${startActors[1].id}`;
        
        setNodes([
          { id: actor1Id, type: 'person', data: startActors[0] },
          { id: actor2Id, type: 'person', data: startActors[1] }
        ]);
        
        setNodePositions({
          [actor1Id]: { x: 100, y: 100 },
          [actor2Id]: { x: 500, y: 100 }
        });
        
        setGameStartTime(new Date().getTime());
        setGameStarted(true);
      } catch (error) {
        console.error("Error starting game:", error);
        setStartActorsError("Error starting game. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  /**
   * Reset the game to initial state
   * @param {function} setNodes - Function to set board nodes
   * @param {function} setNodePositions - Function to set node positions
   * @param {function} setConnections - Function to set connections
   * @param {function} setSearchResults - Function to set search results
   * @param {function} setConnectableItems - Function to set connectable items
   */
  const resetGame = (
    setNodes, 
    setNodePositions, 
    setConnections, 
    setSearchResults, 
    setConnectableItems
  ) => {
    setGameStarted(false);
    setGameCompleted(false);
    setGameStartTime(null);
    setKeepPlayingAfterWin(false); // Reset the keepPlayingAfterWin flag
    setStartActors([null, null]);
    setNodes([]);
    setNodePositions({});
    setConnections([]);
    setSearchResults([]);
    setConnectableItems({});
    // Keep previousSearches and knownEntities for better suggestions across games
  };
  
  /**
   * Set game as completed and update best score if needed
   * @param {number} score - Current game score
   */
  const completeGame = (score) => {
    setGameCompleted(true);
    
    // Update best score if current score is better (lower) than previous best
    if (!bestScore || score < bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score.toString());
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
        setActorSearchResults(prev => {
          const newResults = [...prev];
          newResults[actorIndex] = [];
          return newResults;
        });
        setActorSearch('', actorIndex);
        return;
      }
      
      setIsLoading(true);
      
      // getPersonDetails now handles merging of guest appearances
      const actorDetails = await getPersonDetails(actorId);
      
      // Log to confirm structure (optional)
      // console.log(`Selected actor ${actorDetails.name} details with processed guest appearances:`, actorDetails);

      setStartActors(prev => {
        const newStartActors = [...prev];
        newStartActors[actorIndex] = actorDetails;
        return newStartActors;
      });
      
      setActorSearchResults(prev => {
        const newResults = [...prev];
        newResults[actorIndex] = [];
        return newResults;
      });
    } catch (error) {
      console.error('Error selecting start actor:', error);
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
    setActorSearchTerms(prev => {
      const newTerms = [...prev];
      newTerms[actorIndex] = term;
      return newTerms;
    });
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
    setStartActorsError,
    knownEntities,
    setKnownEntities,
    bestScore,
    setBestScore,
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