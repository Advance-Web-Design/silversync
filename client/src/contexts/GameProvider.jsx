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
import { useState, useEffect, useCallback } from 'react';
import { GameContext } from './gameContext';
import { useGame } from '../hooks/useGame';
import { useBoard } from '../hooks/useBoard';
import { useSearch } from '../hooks/useSearch';
import {
  fetchAllPossibleConnections as fetchEntityConnections,
  checkActorTvShowConnection as checkActorTvConnection,
} from '../utils/entityUtils';
import { generateCheatSheet } from '../utils/cheatSheetCache';
import { fetchRandomUniqueActor, clearConnectionCache } from '../utils/boardUtils';
import { getPersonDetails, getMovieDetails, getTvShowDetails, checkActorInTvShow, fetchRandomPerson } from '../services/tmdbService';
import { logger } from '../utils/loggerUtils';

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
    // Challenge and screen navigation state
  const [currentScreen, setCurrentScreen] = useState('challenges'); // 'start', 'challenges', 'actor-selection', 'game'
  const [challengeMode, setChallengeMode] = useState(null);
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
  };  /**
   * Fetches and displays all entities that can be added to the current board
   * Shows different results based on game state (starting phase vs. mid-game)
   */  const fetchAndSetAllSearchableEntities = useCallback(async () => {
    logger.info('🎯 Fetching all searchable entities');

    setIsLoading(true);
    try {      // Generate new cheat sheet
      const cheatSheetEntities = await generateCheatSheet(nodes, gameStarted, startActors, {
        enableProductionFiltering: false,
        excludeProductionCompanies: challengeMode?.remove || [],
      });

      setCheatSheetResults(cheatSheetEntities);

      // Mark all entities as connectable
      const newConnectableItems = {};
      cheatSheetEntities.forEach(item => {
        const itemKey = `${item.media_type}-${item.id}`;
        newConnectableItems[itemKey] = true;
      });
      setConnectableItems(newConnectableItems);

    } catch (error) {
      logger.error("Error fetching connectable entities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, gameStarted, startActors, challengeMode?.remove, setCheatSheetResults, setConnectableItems, setIsLoading]);

  /**
   * Fetches a random actor for a starting position
   * Makes multiple attempts if needed to avoid duplicates
   * 
   * @param {number} actorIndex - Index (0 or 1) of the actor position to fill
   */
  const randomizeActors = async (actorIndex) => {
    logger.debug(`🎲 Randomizing actor for position ${actorIndex}`);
    setIsLoading(true);
    setStartActorsError(null);

    try {
      const randomActor = await fetchRandomUniqueActor(actorIndex, startActors, fetchRandomPerson);

      if (randomActor) {
        const newStartActors = [...startActors];
        newStartActors[actorIndex] = randomActor;
        setStartActors(newStartActors);
        logger.info(`✅ Random actor selected: ${randomActor.name}`);
      } else {
        const errorMsg = "Failed to find a unique actor after multiple attempts";
        setStartActorsError(errorMsg);
        logger.warn("⚠️ " + errorMsg);
      }
    } catch (error) {
      logger.error("Error fetching random actor:", error);
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
    logger.info('🚀 Starting game with actors:', startActors.map(a => a.name).join(' & '));
    setIsLoading(true);
    try {
      await gameState.startGame(setNodes, setNodePositions);
      setGameStarted(true);
      logger.info('✅ Game started successfully');
    } catch (error) {
      logger.error("Error starting game:", error);
      setStartActorsError("Error starting game. Please try again: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };  /**
   * Resets the game to initial state
   * Clears board, connections, and search results
   */
  const resetGame = () => {
    logger.info('🔄 Resetting game');
    gameState.resetGame(
      setNodes,
      setNodePositions,
      setConnections,
      setSearchResults,
      setConnectableItems
    );    // Also reset search input and state
    searchState.resetSearch();
    // Clear connection cache for optimized performance
    clearConnectionCache();
    // Reset screen navigation and challenge mode
    setCurrentScreen('challenges');
    setChallengeMode(null);
  };

  /**
   * Handles selection of a node on the game board
   * Fetches all possible connections for the selected node
   * 
   * @param {Object} node - The selected node object
   */
  const selectNode = async (node) => {
    logger.debug(`🎯 Selecting node: ${node.data?.name || node.data?.title || 'Unknown'}`);
    setSelectedNode(node);
    setIsLoadingConnections(true);

    try {
      // Fetch all possible connections for this node
      const connections = await fetchAllPossibleConnections(node);
      setPossibleConnections(connections);
      logger.debug(`📊 Found ${connections.length} possible connections`);
    } catch (error) {
      logger.error("Error fetching possible connections:", error);
      setPossibleConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  /**
   * Wrapper function for searchStartActors that provides all required parameters
   * This ensures the function is called with the correct state setters
   * 
   * @param {string} query - Search query for actors
   * @param {number} actorIndex - Index of the actor position to fill (0 or 1)
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

  /**
   * Generic function to add any entity to the board
   * @param {Object} entity - Entity to add (person, movie, or TV show)
   */
  const addToBoard = async (entity) => {
    const entityName = entity.name || entity.title || 'Unknown';
    logger.info(`➕ Adding to board: ${entityName} (${entity.media_type})`);

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
    );    // Remove from connectable items tracking
    const itemKey = `${entity.media_type}-${entity.id}`;
    setConnectableItems(prev => {
      const updated = { ...prev };
      delete updated[itemKey];
      return updated;
    });

    // Refresh all searchable entities after adding to board
    // This ensures new connections are available for search immediately
    try {
      logger.debug('🔄 Refreshing searchable entities after adding to board');
      await fetchAndSetAllSearchableEntities();
    } catch (error) {
      logger.error('Error refreshing searchable entities:', error);
    }

    logger.debug(`✅ Successfully added ${entityName} to board`);
    return result;
  };

  /**
   * Adds a person (actor) to the board
   * @param {Object} person - Person entity to add
   */
  const addPersonToBoard = async (person) => {
    return await addToBoard({ ...person, media_type: 'person' });
  };

  /**
   * Adds a movie to the board
   * @param {Object} movie - Movie entity to add
   */
  const addMovieToBoard = async (movie) => {
    return await addToBoard({ ...movie, media_type: 'movie' });
  };

  /**
   * Adds a TV show to the board
   * @param {Object} tvShow - TV show entity to add
   */
  const addTvShowToBoard = async (tvShow) => {
    return await addToBoard({ ...tvShow, media_type: 'tv' });
  };  /**
   * Main search function for finding movies, TV shows, or actors
   * @param {string} term - Search term entered by the user
   */
  const handleSearch = async (term) => {
    if (!term) return;

    const startTime = Date.now();
    logger.time('search-operation');
    logger.info(`🔍 Starting local search for: "${term}"`);

    setOriginalSearchTerm(term);
    setExactMatch(null);
    setNoMatchFound(false);
    setIsLoading(true);    
    try {
      const searchResult = searchState.performLocalSearch(term, cheatSheetResults);

      const duration = Date.now() - startTime;
      logger.info(`📊 Local search completed: ${searchResult.results.length} results in ${duration}ms`);

      // Debug: Log what we're searching for and what we found
      logger.debug(`🔍 Search term: "${term}"`);
      logger.debug(`🔍 Search results:`, searchResult.results.map(r => ({
        title: r.title || r.name,
        type: r.media_type,
        id: r.id
      })).slice(0, 10));

      logger.timeEnd('search-operation');
      // Process local search results
      if (searchResult.results.length === 0) {
        setNoMatchFound(true);
        logger.info(`🚫 No results found for: "${term}"`);
      } else {
        setSearchResults(searchResult.results);
        setExactMatch(searchResult.exactMatch);
        setNoMatchFound(false);

        // Mark search results as connectable for UI filtering
        const newConnectableItems = {};
        searchResult.results.forEach(item => {
          const itemKey = `${item.media_type}-${item.id}`;
          newConnectableItems[itemKey] = true; // Assume all search results are potentially connectable
        });
        setConnectableItems(prev => ({ ...prev, ...newConnectableItems }));

        logger.info(`✅ Marked ${searchResult.results.length} search results as connectable`);
      }

    } catch (error) {
      logger.error('❌ Search error:', error);
      setNoMatchFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if an actor appears in a TV show
   * @param {number} actorId - ID of the actor
   * @param {number} tvShowId - ID of the TV show
   */
  const checkActorTvShowConnection = async (actorId, tvShowId) => {
    return await checkActorTvConnection(actorId, tvShowId, {
      getPersonDetails,
      getTvShowDetails,
      checkActorInTvShow
    });
  };

  /**
   * Fetches all possible connections for a given node
   * @param {Object} node - The node to find connections for
   */
  const fetchAllPossibleConnections = async (node) => {
    return await fetchEntityConnections(
      node,
      { getPersonDetails, getMovieDetails, getTvShowDetails },
      nodes
    );
  };

  /**
   * Closes the connections panel by clearing selected node state
   */
  const closeConnectionsPanel = () => {
    logger.debug('❌ Closing connections panel');
    setSelectedNode(null);
    setPossibleConnections([]);
  };
  /**
   * Toggles visibility of all searchable entities in the sidebar
   * Uses existing cached data instead of regenerating
   */
  const toggleShowAllSearchable = () => {
    const newShowAllSearchable = !showAllSearchable;
    setShowAllSearchable(newShowAllSearchable);

    logger.debug(`🔧 Toggling cheat sheet: ${newShowAllSearchable ? 'ON' : 'OFF'}`);

    // If turning off, clear the cheat sheet results display
    if (!newShowAllSearchable) {
      setCheatSheetResults([]);
    }
    // When turning on, the existing cache will be used by the search components
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
    showAllSearchable,    // Challenge mode and screen navigation
    currentScreen,
    challengeMode,
    showLeaderboard,

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
    setConnectableItems,    setSearchTerm,
    setCurrentScreen,
    setChallengeMode,
    setShowLeaderboard,

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
    setCheatSheetResults,  };  // Auto-generate cache when game starts to enable local search
  useEffect(() => {
    if (gameStarted && nodes.length > 0) {
      logger.debug('🚀 Game started, generating cache for local search');
      fetchAndSetAllSearchableEntities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, nodes.length]); // Intentionally excluding fetchAndSetAllSearchableEntities to prevent infinite loop



  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};