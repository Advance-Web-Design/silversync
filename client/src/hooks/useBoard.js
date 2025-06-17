/**
 * useBoard.js - Custom hook for managing the game board
 * 
 * Manages nodes, connections, positions, and connectivity logic between
 * different entities (actors, movies, TV shows) on the game board.
 */
import { useState } from 'react';
import { getPersonDetails, getMovieDetails, getTvShowDetails } from '../services/tmdbService';
import { processPersonDetails, findPersonConnections, findMovieConnections, findTvShowConnections, checkInitialConnectability as checkInitialConnectabilityUtil, checkItemConnectabilityUtil } from '../utils/entityUtils';
import { DEFAULT_NODE_POSITION, RANDOM_POSITION_RANGE, calculateNodePosition, saveEntityToLocalDatabase, findPathBetweenNodes } from '../utils/boardUtils';
import { logger } from '../utils/loggerUtils';
import { actorTreeManager } from '../utils/actorTreeUtils';

/**
 * @returns {Object} Board methods and state variables
 */
export const useBoard = () => {
  // State for nodes (actors, movies, TV shows) on the board
  const [nodes, setNodes] = useState([]);
  
  // State for connections between the nodes
  const [connections, setConnections] = useState([]);
    // State for tracking the position of each node on the board
  const [nodePositions, setNodePositions] = useState({});
  
  /**
   * Initialize the actor tree manager with starting actors
   * This should be called when the game starts with the two starting actors
   * 
   * @param {Array} startingActors - Array of starting actor objects
   */
  const initializeActorTrees = (startingActors) => {
    if (startingActors && startingActors.length >= 2) {
      actorTreeManager.initializeTrees(startingActors);
      logger.info('🌳 Initialized actor trees for game');
    }
  };
  
  /**
   * Update a node's position on the board after it's been dragged
   * 
   * @param {string} nodeId - ID of node to update (format: "type-id")
   * @param {Object} position - New position coordinates {x, y}
   */
  const updateNodePosition = (nodeId, position) => {
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: position
    }));
  };
    /**
   * Check if an item can be connected to existing nodes on the board
   * 
   * For each entity type:
   * - Actors: Check if they were in any movie/show already on the board
   * - Movies: Check if any actor on the board appeared in the movie
   * - TV Shows: Check if any actor on the board appeared in the show
   * 
   * @param {Object} item - Item to check (person, movie, TV)
   * @returns {Promise<boolean>} - Whether the item is connectable to current board
   */
  const checkItemConnectability = async (item) => {
    try {
      // Use the utility function from entityUtils.js
      return await checkItemConnectabilityUtil(
        item,
        nodes,
        getPersonDetails,
        getMovieDetails,
        getTvShowDetails
      );
    } catch (error) {
      logger.error("Error checking item connectability:", error);
      return false;
    }
  };
  /**
   * Check if an item can connect with the starting actors
   * 
   * Critical for the initial game state when only starting actors are on the board.
   * For each entity type:
   * - Movies: Check if either starting actor appeared in the movie
   * - TV Shows: Check if either starting actor appeared in the show (regular cast or guest)
   * - Actors: Check if they appeared in any same production as either starting actor
   * 
   * @param {Object} item - Item to check (person, movie, TV)
   * @param {Array} startingActors - The two starting actors
   * @returns {Promise<boolean>} - Whether the item can connect to starting actors
   */
  const checkInitialConnectability = async (item, startingActors) => {
    try {
      // Use the utility function from entityUtils.js
      // Pass the services functions to avoid circular dependencies
      return await checkInitialConnectabilityUtil(
        item, 
        startingActors,
        getPersonDetails,
        getMovieDetails,
        getTvShowDetails
      );
    } catch (error) {
      logger.error("Error checking initial connectability:", error);
      return false;
    }
  };  /**
   * Add an item to the board and create necessary connections
   * 
   * @param {Object} item - Item to add (person, movie, TV)
   * @param {boolean} exactMatch - Whether it's an exact match
   * @param {Object} connectableItems - Map of connectable items
   * @param {Function} setIsLoading - Function to set loading state
   * @param {Array} startActors - The starting actors (needed for path calculation)
   * @param {boolean} gameCompleted - Whether the game is already completed
   * @param {Function} setShortestPathLength - Function to update shortest path length
   * @param {Function} completeGame - Function to handle game completion and score tracking
   * @param {number} gameStartTime - When the game started (for score calculation)
   * @param {Function} setGameCompleted - Function to set game completion state
   * @returns {Promise<void>} - Promise that resolves when item is added
   */
  const addToBoard = async (item, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, setShortestPathLength, completeGame, gameStartTime, setGameCompleted) => {
    if (!item) return;

    setIsLoading(true);
    
    try {
      const itemKey = `${item.media_type}-${item.id}`;
      const isConnectable = connectableItems[itemKey];
      
      // Don't allow duplicates on the board
      const existingNode = nodes.find(node => 
        node.id === `${item.media_type}-${item.id}`
      );
      
      if (existingNode || !isConnectable) {
        setIsLoading(false);
        return;
      }
      
      // Process the item by type to add to the board
      let nodeData = null;
      let nodeId = null;
      let nodeType = null;
      let newConnections = [];

      // Process based on media type
      if (item.media_type === 'person') {
        const details = await processPersonDetails(item.id);
        nodeData = details;
        nodeId = `person-${item.id}`;
        nodeType = 'person';
        newConnections = findPersonConnections(details, nodes, nodeId);
        
      } else if (item.media_type === 'movie') {
        const details = await getMovieDetails(item.id);
        nodeData = details;
        nodeId = `movie-${item.id}`;
        nodeType = 'movie';
        newConnections = findMovieConnections(details, nodes, nodeId);
        
      } else if (item.media_type === 'tv') {
        const details = await getTvShowDetails(item.id);
        nodeData = details;
        nodeId = `tv-${item.id}`;
        nodeType = 'tv';
        newConnections = findTvShowConnections(details, nodes, nodeId);
      }
      
      // Calculate a position for the new node
      const newNodePosition = calculateNodePosition(newConnections, nodePositions, nodeId);
      
      const newNode = {
        id: nodeId,
        type: nodeType,
        data: nodeData,
        position: newNodePosition
      };
      
      // Add to nodes state
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      // Update node positions
      setNodePositions(prevPositions => ({
        ...prevPositions,
        [nodeId]: newNodePosition
      }));        // Add new connections
      if (newConnections.length > 0) {
        setConnections(prev => [...prev, ...newConnections]);
      }

      // Add the entity to actor trees and check for connections
      if (startActors && startActors[0] && startActors[1] && setShortestPathLength) {
        const treeResult = actorTreeManager.addEntityToTrees(
          nodeId, 
          nodeType, 
          nodeData, 
          newConnections
        );

        // Check if this entity created a connection between the starting actors
        if (treeResult.shortestConnection) {
          const pathLength = treeResult.shortestConnection.pathLength;
          
          // Update the shortest path length
          setShortestPathLength(pathLength);
          
          logger.info(`🎉 Connection found! Path length: ${pathLength}`, {
            bridgeNode: treeResult.shortestConnection.bridgeNode,
            fullPath: treeResult.shortestConnection.fullPath
          });

          // If the game wasn't already completed, complete it now
          if (!gameCompleted) {
            // Calculate score based on path length and time taken
            if (gameStartTime && completeGame) {
              const completionTime = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
              const finalScore = completionTime * pathLength;
              completeGame(finalScore);
            }
            // Mark game as completed
            if (setGameCompleted) {
              setGameCompleted(true);
            }
          }
        } else {
          // If no direct connection through this entity, check if actors are connected through any path
          const startActorId1 = `person-${startActors[0].id}`;
          const startActorId2 = `person-${startActors[1].id}`;
          
          const connectionCheck = actorTreeManager.checkActorsConnected(startActorId1, startActorId2);
          
          if (connectionCheck) {
            const pathLength = connectionCheck.pathLength;
            setShortestPathLength(pathLength);
            
            logger.info(`🔗 Actors connected! Path length: ${pathLength}`, {
              bridgeNode: connectionCheck.bridgeNode,
              fullPath: connectionCheck.fullPath
            });

            // If the game wasn't already completed, complete it now
            if (!gameCompleted) {
              // Calculate score based on path length and time taken
              if (gameStartTime && completeGame) {
                const completionTime = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
                const finalScore = completionTime * pathLength;
                completeGame(finalScore);
              }
              // Mark game as completed
              if (setGameCompleted) {
                setGameCompleted(true);
              }
            }
          }
        }
      }

      // Save this entity to our local database for future fuzzy searches
      saveEntityToLocalDatabase(item);
      
    } catch (error) {
      logger.error("Error adding to board:", error);
    } finally {
      setIsLoading(false);
    }
  };  /**
   * Check if a path exists between the starting actors (win condition)
   * Uses the actor tree manager for more efficient path finding
   * 
   * @param {Array} startActors - The starting actors
   * @param {boolean} keepPlayingAfterWin - Whether to keep playing after finding a path
   * @param {function} setGameCompleted - Function to set game completion state
   * @param {function} completeGame - Function to handle game completion and score tracking
   * @param {number} gameStartTime - When the game started (for score calculation)
   * @param {function} setShortestPathLength - Function to set the shortest path length
   * @returns {boolean} - Whether a path was found
   */
  const checkGameCompletion = (
    startActors, 
    keepPlayingAfterWin, 
    setGameCompleted, 
    completeGame, 
    gameStartTime, 
    setShortestPathLength
  ) => {
    // If user chose to keep playing after win, don't show completion again
    if (keepPlayingAfterWin) {
      return false;
    }
    
    // Make sure we have the starting actors
    if (!startActors[0] || !startActors[1]) {
      return false;
    }
    
    const startActorId1 = `person-${startActors[0].id}`;
    const startActorId2 = `person-${startActors[1].id}`;
    
    // Use actor tree manager to check if actors are connected
    const connectionResult = actorTreeManager.checkActorsConnected(startActorId1, startActorId2);
    
    if (connectionResult) {
      const pathLength = connectionResult.pathLength;
      
      // Set the shortest path length in the game state
      if (setShortestPathLength) {
        setShortestPathLength(pathLength);
      }
      
      logger.info(`🎯 Game completion check: Connection found! Path length: ${pathLength}`, {
        bridgeNode: connectionResult.bridgeNode,
        fullPath: connectionResult.fullPath
      });
      
      // Calculate score based on path length and time taken
      if (gameStartTime && completeGame) {
        const completionTime = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
        const finalScore = completionTime * pathLength;
        completeGame(finalScore);
      }
      
      setGameCompleted(true);
      return true;
    }
      logger.debug('🎯 Game completion check: No connection found yet');
    return false;
  };

  /**
   * Reset the actor tree manager
   * Should be called when starting a new game
   */
  const resetActorTrees = () => {
    actorTreeManager.reset();
    logger.info('🌲 Reset actor trees for new game');
  };
  
  // Using saveEntityToLocalDatabase from boardUtils.js
  // Return methods and state variables from the hook
  return {
    nodes,
    setNodes,
    connections,
    setConnections,
    nodePositions,
    setNodePositions,
    updateNodePosition,
    checkItemConnectability,
    checkInitialConnectability,
    addToBoard,
    checkGameCompletion,
    initializeActorTrees,
    resetActorTrees
  };
};