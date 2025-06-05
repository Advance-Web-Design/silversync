/**
 * GameProvider.jsx 
 * 
 * This file defines and exports the GameProvider component which serves as the central state management
 * for the "Connect the Shows" game. It combines multiple custom hooks to handle different aspects
 * of the game (board management, searching, game state) and provides this combined state and 
 * functionality to all components via React Context.
 * 
 * The GameProvider handles:
 * - Starting actor selection and game initialization
 * - Search functionality for movies, TV shows, and actors
 * - Board state management including connections between entities
 * - Game progression and win state tracking
 */
import { useState, useEffect } from 'react';
import { GameContext } from './gameContext';
import { useGame } from '../hooks/useGame';
import { useBoard } from '../hooks/useBoard';
import { useSearch } from '../hooks/useSearch';
import { getItemTitle } from '../utils/stringUtils';
import { 
  fetchAllPossibleConnections as fetchEntityConnections,
  checkActorTvShowConnection as checkActorTvConnection,
  fetchConnectableEntitiesFromBoard,
} from '../utils/entityUtils';
import { processSearchResults as processResults } from '../utils/searchUtils';
import { filterExistingBoardEntities, fetchRandomUniqueActor } from '../utils/boardUtils';
import { getPersonDetails, getMovieDetails, getTvShowDetails, checkActorInTvShow, fetchRandomPerson, searchMulti } from '../services/tmdbService';

/**
 * Main Game Provider component that wraps the application
 * Combines state from multiple custom hooks and provides unified game context
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to context
 */
export const GameProvider = ({ children }) => {
  // Use custom hooks for different aspects of the game
  const gameState = useGame();
  const boardState = useBoard();
  const searchState = useSearch();

  // Local state for UI and game interactions
  const [selectedNode, setSelectedNode] = useState(null);
  const [possibleConnections, setPossibleConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [showAllSearchable, setShowAllSearchable] = useState(false);
  const [cheatSheetResults, setCheatSheetResults] = useState([]);
  
  // Destructure state from hooks for easier access
  const {
    isLoading, setIsLoading,
    gameStarted, setGameStarted,
    startActors, setStartActors,
    gameCompleted, setGameCompleted,
    keepPlayingAfterWin, setKeepPlayingAfterWin, setStartActorsError,
    actorSearchResults, setActorSearchResults,
    actorSearchTerms, actorSearchPages, actorSearchTotalPages,
    setActorSearchPages, setActorSearchTotalPages,
    selectStartActor,
    setActorSearch,
    gameStartTime,
    shortestPathLength,
  } = gameState;

  const {
    nodes, setNodes,
    connections, setConnections,
    nodePositions, setNodePositions,
    updateNodePosition: updateNodePositionFromBoard,
    checkItemConnectability,
    checkInitialConnectability,
    addToBoard: addToBoardFn,
    checkGameCompletion
  } = boardState;

  const {
    searchTerm,
    setSearchTerm,
    searchResults, setSearchResults,
    noMatchFound, setNoMatchFound,
    didYouMean, setDidYouMean,
    exactMatch, setExactMatch,
    originalSearchTerm, setOriginalSearchTerm,
    connectableItems, setConnectableItems,
    searchStartActors: searchStartActorsFn
  } = searchState;

  /**
   * Wrapper function to update node positions on the board
   * Ensures correct format for DraggableNode component
   * 
   * @param {string} nodeId - ID of the node to update
   * @param {Object} newPosition - New x,y coordinates
   */
  const updateNodePosition = (nodeId, newPosition) => {
    updateNodePositionFromBoard(nodeId, newPosition);
  };

  /**
   * Handles selection of a node on the game board
   * Fetches all possible connections for the selected node
   * 
   * @param {Object} node - The selected node object
   */
  const selectNode = async (node) => {
    setSelectedNode(node);
    setIsLoadingConnections(true);

    try {
      // Fetch all possible connections for this node
      const connections = await fetchAllPossibleConnections(node);
      setPossibleConnections(connections);
    } catch (error) {
      console.error("Error fetching possible connections:", error);
      setPossibleConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  /**
   * Fetches all entities that can connect to a given node
   * Based on node type (person/movie/TV), gets relevant connections
   * 
   * @param {Object} node - Node to find connections for
   * @returns {Array} - List of entities that can connect to the node
   */
  const fetchAllPossibleConnections = async (node) => {
    return fetchEntityConnections(node, { getPersonDetails, getMovieDetails, getTvShowDetails });
  };

  /**
   * Closes the connections panel by clearing selected node state
   */
  const closeConnectionsPanel = () => {
    setSelectedNode(null);
    setPossibleConnections([]);
  };

  /**
   * Toggles visibility of all searchable entities in the sidebar
   * When enabled, fetches and displays all entities that can connect to the board
   */
  const toggleShowAllSearchable = () => {
    const newShowAllSearchable = !showAllSearchable;
    setShowAllSearchable(newShowAllSearchable);

    // If turning on, fetch all connectable entities
    if (newShowAllSearchable) {
      fetchAndSetAllSearchableEntities();
    } else {
      // If turning off, clear the cheat sheet results
      setCheatSheetResults([]);
    }
  };

  /**
   * Fetches and displays all entities that can be added to the current board
   * Shows different results based on game state (starting phase vs. mid-game)
   */
  const fetchAndSetAllSearchableEntities = async () => {
    setIsLoading(true);
    try {
      if (nodes.length === 0 || !gameStarted) {
        setCheatSheetResults([]);
        return;
      }
      else if (nodes.length <= 2 && startActors.length === 2) {
        const relevantEntities = [];

        // Check if we have data for the starting actors AND any movies/TV shows on the board
        for (const node of nodes) {
          if (node.type === 'person' && node.data) {
            // For actors, get their movie and TV credits
            if (node.data.movie_credits?.cast) {
              relevantEntities.push(...node.data.movie_credits.cast.map(movie => ({
                ...movie,
                media_type: 'movie',
                source_node: node.id
              })));
            }

            if (node.data.tv_credits?.cast) {
              relevantEntities.push(...node.data.tv_credits.cast.map(show => ({
                ...show,
                media_type: 'tv',
                source_node: node.id
              })));
            }
          } else if (node.type === 'movie' && node.data) {
            // For movies, get their cast members (actors)
            if (node.data.credits?.cast) {
              relevantEntities.push(...node.data.credits.cast.map(actor => ({
                ...actor,
                media_type: 'person',
                source_node: node.id
              })));
            }
          } else if (node.type === 'tv' && node.data) {
            // For TV shows, get their cast members (actors)
            if (node.data.credits?.cast) {
              relevantEntities.push(...node.data.credits.cast.map(actor => ({
                ...actor,
                media_type: 'person',
                source_node: node.id
              })));
            }
          }
        }

        // Filter for images and remove duplicates
        const filteredEntities = relevantEntities.filter(entity =>
          entity && entity.id && (
            (entity.media_type === 'movie' && entity.poster_path) ||
            (entity.media_type === 'tv' && entity.poster_path) ||
            (entity.media_type === 'person' && entity.profile_path)
          )
        );

        // Remove duplicates based on id and media_type
        const uniqueEntities = filteredEntities.filter((entity, index, self) =>
          index === self.findIndex(e => e.id === entity.id && e.media_type === entity.media_type)
        );

        // Filter out entities already on board
        const finalEntities = uniqueEntities.filter(entity => 
          !nodes.some(node => 
            node.id === `${entity.media_type}-${entity.id}`
          )
        );

        // Set cheat sheet results instead of search results
        setCheatSheetResults(finalEntities);

        // Mark all these entities as connectable
        const newConnectableItems = {};
        finalEntities.forEach(item => {
          const itemKey = `${item.media_type}-${item.id}`;
          newConnectableItems[itemKey] = true;
        });

        setConnectableItems(newConnectableItems);
      } else {
        // With nodes on the board beyond just starting actors, build a list of all connectable entities
        const allConnectableEntities = await fetchConnectableEntitiesFromBoard(
          nodes, 
          { getPersonDetails, getMovieDetails, getTvShowDetails }
        );

        // Filter out entities that are already on the board
        const filteredEntities = filterExistingBoardEntities(allConnectableEntities, nodes);

        // Remove duplicates
        const uniqueEntities = filteredEntities.filter((entity, index, self) =>
          index === self.findIndex(e => e.id === entity.id && e.media_type === entity.media_type)
        );

        // Set cheat sheet results instead of search results  
        setCheatSheetResults(uniqueEntities);

        const newConnectableItems = {};
        uniqueEntities.forEach(item => {
          const itemKey = `${item.media_type}-${item.id}`;
          newConnectableItems[itemKey] = true;
        });

        setConnectableItems(newConnectableItems);
      }
    } catch (error) {
      console.error("Error fetching connectable entities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches a random actor for a starting position
   * Makes multiple attempts if needed to avoid duplicates
   * 
   * @param {number} actorIndex - Index (0 or 1) of the actor position to fill
   */
  const randomizeActors = async (actorIndex) => {
    setIsLoading(true);
    setStartActorsError(null);
    
    try {
      const randomActor = await fetchRandomUniqueActor(actorIndex, startActors, fetchRandomPerson);
      
      if (randomActor) {
        const newStartActors = [...startActors];
        newStartActors[actorIndex] = randomActor;
        setStartActors(newStartActors);
      } else {
        const errorMsg = "Failed to find a unique actor after multiple attempts";
        setStartActorsError(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching random actor:", error);
      setStartActorsError(`Failed to load actor: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Starts the game with the selected starting actors
   * Initializes the board with starting nodes
   */
  const startGame = async () => {
    setIsLoading(true);
    try {
      await gameState.startGame(setNodes, setNodePositions);
      setGameStarted(true);
    } catch (error) {
      console.error("Error starting game:", error);
      setStartActorsError("Error starting game. Please try again: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets the game to initial state
   * Clears board, connections, and search results
   */
  const resetGame = () => {
    gameState.resetGame(
      setNodes,
      setNodePositions,
      setConnections,
      setSearchResults,
      setConnectableItems
    );
  };

  /**
   * Main search function for finding movies, TV shows, or actors
   * Uses fuzzy search capabilities but without showing "Did you mean" prompts
   * 
   * @param {string} term - Search term entered by the user
   */
  const handleSearch = async (term) => {
    if (!term) return;

    setOriginalSearchTerm(term);
    setExactMatch(null);
    setNoMatchFound(false);
    setIsLoading(true);

    try {
      // First check if there's a string similarity match in our local database
      const similarityMatch = searchState.checkForMisspelling(term);
      let apiSearchTerm = term; // Default to original term

      // If we found a match in the local database
      if (similarityMatch && typeof similarityMatch === 'object' && similarityMatch.id) {
        const matchTitle = getItemTitle(similarityMatch);

        // If the match is different from what the user typed, use it automatically
        // without showing "Did you mean" prompt
        if (matchTitle.toLowerCase() !== term.toLowerCase()) {
          // Use the exact title/name for our API search to get best results
          apiSearchTerm = matchTitle;
        }
      }

      // Search the API using either original term or corrected term from local database
      let allResults = await searchMulti(apiSearchTerm);

      await processSearchResults(allResults, term, apiSearchTerm);
    } catch (error) {
      console.error("Error searching:", error);
      setNoMatchFound(true);
    } finally {
      setIsLoading(false);
    }
  };  

    /**
   * Processes and filters search results from the API
   * Handles exact matches and connectability checks, but without spelling suggestions UI
   * 
   * @param {Array} allResults - Raw search results from API
   * @param {string} originalTerm - Original search term from user
   * @param {string} apiSearchTerm - Term used for API search (may differ after fuzzy search)
   */
  const processSearchResults = async (allResults, originalTerm, apiSearchTerm) => {
    // Determine which connectability function to use based on game state
    let checkConnectability;
    
    if (nodes.length === 0 || !gameStarted) {
      // If no nodes on board or game not started, nothing is connectable
      checkConnectability = () => Promise.resolve(false);
    } else if (nodes.length <= 2 && startActors.length === 2) {
      // If only starting actors on board, check initial connectability
      checkConnectability = (item) => checkInitialConnectability(item, startActors);
    } else {
      // If there are other nodes on board, check general connectability
      checkConnectability = checkItemConnectability;
    }
    
    const gameContext = {
      checkConnectability,
      setConnectableItems
    };
    
    return await processResults(allResults, originalTerm, apiSearchTerm, searchState, {
      setNoMatchFound,
      setExactMatch,
      setSearchResults
    }, gameContext);
  };

  /**
   * Checks if an actor has appeared in a TV show (including guest appearances)
   * Handles different data sources based on whether actor is on board
   * 
   * @param {number} actorId - TMDB ID of the actor
   * @param {number} tvShowId - TMDB ID of the TV show
   * @returns {Promise<boolean>} - Whether actor has appeared in the show
   */
  const checkActorTvShowConnection = async (actorId, tvShowId) => {
    return checkActorTvConnection(actorId, tvShowId, nodes, checkActorInTvShow);
  };
  /**
   * Adds a person to the board and fetches their detailed information
   * @param {Object} person - Person object to add
   */  const addPersonToBoard = async (person) => {
    return addToBoardFn(person, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, gameState.setShortestPathLength, gameState.completeGame, gameStartTime, setGameCompleted);
  };

  /**
   * Adds a movie to the board and fetches its detailed information
   * @param {Object} movie - Movie object to add
   */
  const addMovieToBoard = async (movie) => {
    return addToBoardFn(movie, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, gameState.setShortestPathLength, gameState.completeGame, gameStartTime, setGameCompleted);
  };

  /**
   * Adds a TV show to the board and fetches its detailed information
   * @param {Object} tvShow - TV show object to add
   */
  const addTvShowToBoard = async (tvShow) => {
    return addToBoardFn(tvShow, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, gameState.setShortestPathLength, gameState.completeGame, gameStartTime, setGameCompleted);
  };
  /**
   * Generic function to add any entity to the board
   * @param {Object} entity - Entity to add (person, movie, or TV show)
   */  const addToBoard = async (entity) => {
    const result = await addToBoardFn(entity, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, gameState.setShortestPathLength, gameState.completeGame, gameStartTime, setGameCompleted);
    
    // Remove from regular search results
    setSearchResults(prev => 
      prev.filter(item => 
        !(item.id === entity.id && item.media_type === entity.media_type)
      )
    );
    
    // Remove from cheat sheet results immediately (to provide instant feedback)
    setCheatSheetResults(prev => 
      prev.filter(item => 
        !(item.id === entity.id && item.media_type === entity.media_type)
      )
    );
    
    // Remove from connectable items tracking
    const itemKey = `${entity.media_type}-${entity.id}`;
    setConnectableItems(prev => {
      const updated = { ...prev };
      delete updated[itemKey];
      return updated;
    });
    
    return result;
  };

  /**
   * Wrapper function for searchStartActors that provides all required parameters
   * This ensures the function is called with the correct state setters
   * 
   * @param {string} query - Search query for actors
   * @param {number} actorIndex - Index of the actor position (0 or 1)
   * @param {number} page - Page number for pagination
   */
  const searchStartActorsWrapper = (query, actorIndex, page) => {
    searchStartActorsFn(
      query,
      actorIndex,
      page,
      setActorSearchResults,
      setActorSearchPages,
      setActorSearchTotalPages,
      setIsLoading
    );
  };

  const contextValue = {
    // Game state and actions
    isLoading,
    gameStarted,
    startActors,
    gameCompleted,
    keepPlayingAfterWin,
    actorSearchResults,
    actorSearchTerms,
    actorSearchPages,
    actorSearchTotalPages,
    searchTerm,
    searchResults,
    noMatchFound,
    didYouMean,
    exactMatch,
    originalSearchTerm,
    connectableItems,
    gameStartTime,
    shortestPathLength,

    // Board state
    nodes,
    connections,
    nodePositions,
    selectedNode,
    possibleConnections,
    isLoadingConnections,
    showAllSearchable,

    // Functions
    setIsLoading,
    setGameStarted,
    setStartActors,
    setGameCompleted,
    setKeepPlayingAfterWin,
    setActorSearchResults,
    setActorSearchPages,
    setActorSearchTotalPages,
    setSearchResults,
    setNoMatchFound,
    setDidYouMean,
    setExactMatch,
    setOriginalSearchTerm,
    setConnectableItems,
    setSearchTerm,

    // Board functions
    addToBoard,
    addPersonToBoard,
    addMovieToBoard,
    addTvShowToBoard,
    checkItemConnectability,
    checkInitialConnectability,
    checkGameCompletion,
    checkActorTvShowConnection,

    // Custom hooks actions
    startGame,
    resetGame,
    selectStartActor,
    updateNodePosition,
    selectNode,
    closeConnectionsPanel,
    toggleShowAllSearchable,
    fetchAndSetAllSearchableEntities,    
    randomizeActors,
    handleSearch,
    searchStartActors: searchStartActorsWrapper,
    setActorSearch,

    // Cheat sheet results
    cheatSheetResults,
    setCheatSheetResults,
  };

  // Auto-refresh cheat sheet when nodes change (if it's currently open)
  useEffect(() => {
    if (showAllSearchable && gameStarted && nodes.length > 0) {
      fetchAndSetAllSearchableEntities();
    }
  }, [nodes, showAllSearchable, gameStarted]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};