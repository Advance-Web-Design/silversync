/**
 * useBoard.js - Custom hook for managing the game board
 * 
 * Manages nodes, connections, positions, and connectivity logic between
 * different entities (actors, movies, TV shows) on the game board.
 */
import { useState } from 'react';
import { getPersonDetails, getMovieDetails, getTvShowDetails } from '../services/tmdbService';
import { logger } from '../utils/loggerUtils';
import { actorTreeManager } from '../utils/actorTreeUtils';
import { isMovieBlocked, isTvShowBlocked } from '../utils/challengeUtils';

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
  };

  /**
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
   */  const addToBoard = async (item, exactMatch, connectableItems, setIsLoading, startActors, gameCompleted, setShortestPathLength, completeGame, gameStartTime, setGameCompleted, currentUser = null, challengeMode = null) => {
    if (!item) return;

    setIsLoading(true);

    try {      // Apply challenge filtering as a safety measure
      if (challengeMode?.id) {
        if (item.media_type === 'movie' && isMovieBlocked(item.id, challengeMode.id)) {
          logger.warn(`🚫 Blocked movie from being added to board: ${item.title} (challenge: ${challengeMode.id})`);
          setIsLoading(false);
          return;
        }
        if (item.media_type === 'tv' && isTvShowBlocked(item.id, challengeMode.id)) {
          logger.warn(`🚫 Blocked TV show from being added to board: ${item.name} (challenge: ${challengeMode.id})`);
          setIsLoading(false);
          return;
        }
      }

      const itemKey = `${item.media_type}-${item.id}`;
      const isConnectable = connectableItems[itemKey];

      // Don't allow duplicates on the board
      const existingNode = nodes.find(node =>
        node.id === `${item.media_type}-${item.id}`
      );

      if (existingNode || !isConnectable) {
        setIsLoading(false);
        return;
      }      // Process the item by type to add to the board
      let nodeData = null;
      let nodeId = null;
      let nodeType = null;

      // Process based on media type
      if (item.media_type === 'person') {
        const details = await getPersonDetails(item.id);
        nodeData = details;
        nodeId = `person-${item.id}`;
        nodeType = 'person';

      } else if (item.media_type === 'movie') {
        const details = await getMovieDetails(item.id);
        nodeData = details;
        nodeId = `movie-${item.id}`;
        nodeType = 'movie';

      } else if (item.media_type === 'tv') {
        const details = await getTvShowDetails(item.id);
        nodeData = details;
        nodeId = `tv-${item.id}`;
        nodeType = 'tv';
      }

      // Calculate a simple position for the new node
      const newNodePosition = {
        x: 250 + Math.random() * 100 - 50, // Random position near center
        y: 250 + Math.random() * 100 - 50
      };

      const newNode = {
        id: nodeId,
        type: nodeType,
        data: nodeData,
        position: newNodePosition
      };

      // Add to nodes state
      setNodes(prevNodes => [...prevNodes, newNode]);      // Update node positions
      setNodePositions(prevPositions => ({
        ...prevPositions,
        [nodeId]: newNodePosition
      }));
        // Create connections to existing nodes on the board
      const newConnections = [];
      
      // Check connections based on node type
      if (nodeType === 'person') {
        // For actors, connect to movies/TV shows they appeared in that are on the board
        const movieCredits = nodeData.movie_credits?.cast || [];
        const tvCredits = nodeData.tv_credits?.cast || [];
        
        nodes.forEach(existingNode => {
          if (existingNode.type === 'movie') {
            const movieMatch = movieCredits.find(credit => credit.id === existingNode.data.id);
            if (movieMatch) {
              newConnections.push({
                source: nodeId,
                target: existingNode.id
              });
            }
          } else if (existingNode.type === 'tv') {
            const tvMatch = tvCredits.find(credit => credit.id === existingNode.data.id);
            if (tvMatch) {
              newConnections.push({
                source: nodeId,
                target: existingNode.id
              });
            }
          }
        });
      } else if (nodeType === 'movie') {
        // For movies, connect to actors that are on the board and appeared in this movie
        const cast = nodeData.credits?.cast || [];
        
        nodes.forEach(existingNode => {
          if (existingNode.type === 'person') {
            const actorMatch = cast.find(actor => actor.id === existingNode.data.id);
            if (actorMatch) {
              newConnections.push({
                source: nodeId,
                target: existingNode.id
              });
            }
          }
        });
      } else if (nodeType === 'tv') {
        // For TV shows, connect to actors that are on the board and appeared in this show
        const regularCast = nodeData.credits?.cast || [];
        const aggregateCast = nodeData.aggregate_credits?.cast || [];
        const allCast = [...regularCast, ...aggregateCast];
        
        nodes.forEach(existingNode => {
          if (existingNode.type === 'person') {
            const actorMatch = allCast.find(actor => actor.id === existingNode.data.id);
            if (actorMatch) {
              newConnections.push({
                source: nodeId,
                target: existingNode.id
              });
            }
          }
        });
      }

      // Add the new connections to the connections state
      if (newConnections.length > 0) {
        setConnections(prevConnections => [...prevConnections, ...newConnections]);
        logger.info(`🔗 Created ${newConnections.length} connections for ${nodeData.name || nodeData.title}`);
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
          const pathLength = treeResult.shortestConnection.pathLength;          // Update the shortest path length
          setShortestPathLength(pathLength);
          
          logger.info(`🎉 Connection found! Path length: ${pathLength}`, {
            bridgeNode: treeResult.shortestConnection.bridgeNode,
            fullPath: treeResult.shortestConnection.fullPath
          });
          
          // If the game wasn't already completed, use checkGameCompletion to handle scoring
          if (!gameCompleted) {            checkGameCompletion(
              startActors,
              false, // keepPlayingAfterWin
              completeGame,
              gameStartTime,
              setShortestPathLength,
              currentUser,
              challengeMode
            );
          }
        } else {
          // If no direct connection through this entity, check if actors are connected through any path
          const startActorId1 = `person-${startActors[0].id}`;
          const startActorId2 = `person-${startActors[1].id}`;

          const connectionCheck = actorTreeManager.checkActorsConnected(startActorId1, startActorId2);          if (connectionCheck) {
            const pathLength = connectionCheck.pathLength;
            setShortestPathLength(pathLength);
            
            logger.info(`🔗 Actors connected! Path length: ${pathLength}`, {
              bridgeNode: connectionCheck.bridgeNode,
              fullPath: connectionCheck.fullPath
            });
            
            if (!gameCompleted) {              checkGameCompletion(
                startActors,
                false, 
                completeGame,
                gameStartTime,
                setShortestPathLength,
                currentUser,
                challengeMode
              );
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
  };
  /**
   * Check if a path exists between the starting actors (win condition)
   * Uses the actor tree manager for more efficient path finding
   * 
   * @param {Array} startActors - The starting actors
   * @param {boolean} keepPlayingAfterWin - Whether to keep playing after finding a path
   * @param {function} completeGame - Function to handle game completion and score tracking
   * @param {number} gameStartTime - When the game started (for score calculation)
   * @param {function} setShortestPathLength - Function to set the shortest path length
   * @param {Object} currentUser - Current logged in user (optional)
   * @param {Object} challengeMode - Current challenge mode (optional)
   * @returns {boolean} - Whether a path was found
   */
  const checkGameCompletion = (
    startActors, 
    keepPlayingAfterWin, 
    completeGame, 
    gameStartTime, 
    setShortestPathLength,
    currentUser = null,
    challengeMode = null
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
      });      // Calculate score based on new scoring system
      if (gameStartTime && completeGame) {
        const completionTime = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
        
        const activeNodes = connectionResult.pathLength; 
        
        // Get total unique nodes across all trees (excluding starting actors)
        const totalNodes = actorTreeManager.getTotalUniqueNodes();        
        // Calculate final score: (activeNodes / totalNodes) * (10,000 / completionTime)
        let finalScore = 0;
        if (totalNodes > 0 && completionTime > 0) {
          const ratio = activeNodes / totalNodes;
          const timeBonus = 100000 / completionTime;
          finalScore = ratio * timeBonus;
        }
          logger.info(`🎯 Score calculation: activeNodes=${activeNodes}, totalNodes=${totalNodes}, time=${completionTime}s, score=${finalScore.toFixed(2)}`);
        
        const roundedScore = Math.round(finalScore);
        completeGame(roundedScore, connectionResult, completionTime, currentUser, challengeMode);
      }
  
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