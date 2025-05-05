import { useState, useEffect } from 'react';
import { getPersonDetails, findPersonGuestAppearances } from '../services/tmdbService';
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
      // Check if both actors are the same
      if (startActors[0].id === startActors[1].id) {
        setStartActorsError("Cannot start with duplicate actors. Please select two different actors.");
        return;
      }
      
      // Clear any previous errors
      setStartActorsError(null);
      
      setIsLoading(true);
      
      try {
        // Enhance both actors with guest appearances before starting the game
        const enhancedActors = [];
        
        for (let i = 0; i < 2; i++) {
          // Get full details with guest appearances
          const actorWithGuests = {...startActors[i]};
          
          // Explicitly fetch guest appearances for both actors
          const guestAppearances = await findPersonGuestAppearances(actorWithGuests.id);
          
          // Ensure TV credits include guest appearances
          if (guestAppearances && guestAppearances.length > 0) {
            console.log(`Found ${guestAppearances.length} guest appearances for actor ${actorWithGuests.name}`);
            
            if (!actorWithGuests.tv_credits) {
              actorWithGuests.tv_credits = { cast: [] };
            }
            
            // Add any guest appearances that aren't already in the TV credits
            const existingTvIds = new Set(actorWithGuests.tv_credits.cast.map(credit => credit.id));
            
            for (const appearance of guestAppearances) {
              if (!existingTvIds.has(appearance.id)) {
                actorWithGuests.tv_credits.cast.push({
                  ...appearance,
                  is_guest_appearance: true,  // Mark as guest appearance
                  isGuestAppearance: true     // Add alternative flag for robustness
                });
                existingTvIds.add(appearance.id);
              } else {
                // If it's already there, mark it as a guest appearance if it is one
                const existingCredit = actorWithGuests.tv_credits.cast.find(credit => credit.id === appearance.id);
                if (existingCredit) {
                  existingCredit.is_guest_appearance = true;
                  existingCredit.isGuestAppearance = true; // Add alternative flag for robustness
                }
              }
            }
            
            actorWithGuests.guest_appearances_added = true;
            // Store guest appearances separately for easier access
            actorWithGuests.guest_appearances = guestAppearances;
          }
          
          enhancedActors.push(actorWithGuests);
        }
        
        console.log("Starting game with enhanced actors including guest appearances");
      
        // Set initial positions for the starting actor nodes
        const actor1Id = `person-${enhancedActors[0].id}`;
        const actor2Id = `person-${enhancedActors[1].id}`;
        
        // Initialize the game board with the two starting actors (with guest appearances)
        setNodes([
          { id: actor1Id, type: 'person', data: enhancedActors[0] },
          { id: actor2Id, type: 'person', data: enhancedActors[1] }
        ]);
        
        // Set initial positions (left and right sides of the board)
        setNodePositions({
          [actor1Id]: { x: 100, y: 100 },
          [actor2Id]: { x: 500, y: 100 }
        });
        
        // Set game start time for timer
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
      // Special case for null actorId - we're clearing the actor
      if (!actorId) {
        setStartActors(prev => {
          const newStartActors = [...prev];
          newStartActors[actorIndex] = null;
          return newStartActors;
        });
        
        // Clear the search results for this slot
        setActorSearchResults(prev => {
          const newResults = [...prev];
          newResults[actorIndex] = [];
          return newResults;
        });
        
        // Also reset the search term
        setActorSearch('', actorIndex);
        return;
      }
      
      // For non-null actorId, continue with API call
      setIsLoading(true);
      
      // Get detailed information for the actor
      const actorDetails = await getPersonDetails(actorId);
      
      // Also fetch guest appearances for this actor
      const guestAppearances = await findPersonGuestAppearances(actorId);
      
      // Enhance the actor details with guest appearances
      if (guestAppearances && guestAppearances.length > 0) {
        console.log(`Found ${guestAppearances.length} guest appearances for actor ${actorDetails.name}`);
        
        if (!actorDetails.tv_credits) {
          actorDetails.tv_credits = { cast: [] };
        }
        
        // Add any guest appearances that aren't already in the TV credits
        const existingTvIds = new Set(actorDetails.tv_credits.cast.map(credit => credit.id));
        
        for (const appearance of guestAppearances) {
          if (!existingTvIds.has(appearance.id)) {
            actorDetails.tv_credits.cast.push({
              ...appearance,
              is_guest_appearance: true  // Mark as guest appearance
            });
            existingTvIds.add(appearance.id);
          } else {
            // If it's already there, mark it as a guest appearance if it is one
            const existingCredit = actorDetails.tv_credits.cast.find(credit => credit.id === appearance.id);
            if (existingCredit) {
              existingCredit.is_guest_appearance = true;
            }
          }
        }
        
        actorDetails.guest_appearances_added = true;
      }
      
      setStartActors(prev => {
        const newStartActors = [...prev];
        newStartActors[actorIndex] = actorDetails;
        return newStartActors;
      });
      
      // Clear the search results for this slot
      setActorSearchResults(prev => {
        const newResults = [...prev];
        newResults[actorIndex] = [];
        return newResults;
      });
    } catch (error) {
      console.error('Error selecting start actor:', error);
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