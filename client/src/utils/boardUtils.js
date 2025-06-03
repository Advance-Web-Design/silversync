// Board-specific utility functions
import { getItemTitle } from './entityUtils';

// Constants for node positioning
export const DEFAULT_NODE_POSITION = { x: 250, y: 250 };
export const RANDOM_POSITION_RANGE = {
  X: { MIN: 100, MAX: 800 },
  Y: { MIN: 100, MAX: 600 }
};

/**
 * Calculate strategic position for a new node based on connected nodes
 * 
 * @param {Array} connections - Array of connections for the new node
 * @param {Object} nodePositions - Current node positions map
 * @param {string} nodeId - ID of the new node
 * @returns {Object} - Position coordinates {x, y}
 */
export const calculateNodePosition = (connections, nodePositions, nodeId) => {
  if (connections.length > 0) {
    // Find average position of connected nodes
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    connections.forEach(connection => {
      // For each connection, find the node ID that isn't the new one
      const connectedNodeId = connection.source === nodeId ? connection.target : connection.source;
      const connectedNodePos = nodePositions[connectedNodeId];
      
      if (connectedNodePos) {
        sumX += connectedNodePos.x;
        sumY += connectedNodePos.y;
        count++;
      }
    });
    
    if (count > 0) {
      // Place the new node near the average position of connected nodes
      return {
        x: (sumX / count) + Math.random() * 100 - 50, // Add some randomness
        y: (sumY / count) + Math.random() * 100 - 50
      };
    }
  }
  
  // If no connections or positions, place it in a random position
  return {
    x: RANDOM_POSITION_RANGE.X.MIN + Math.random() * (RANDOM_POSITION_RANGE.X.MAX - RANDOM_POSITION_RANGE.X.MIN),
    y: RANDOM_POSITION_RANGE.Y.MIN + Math.random() * (RANDOM_POSITION_RANGE.Y.MAX - RANDOM_POSITION_RANGE.Y.MIN)
  };
};

/**
 * Save an entity to local database for future fuzzy searches
 * 
 * @param {Object} entity - Entity to save
 */
export const saveEntityToLocalDatabase = (entity) => {
  try {
    const storedEntities = localStorage.getItem('searchableEntities');
    let entities = storedEntities ? JSON.parse(storedEntities) : [];
    
    // Check if entity already exists
    const existingIndex = entities.findIndex(e => 
      e.id === entity.id && e.media_type === entity.media_type
    );
    
    const entityToSave = {
      id: entity.id,
      name: entity.name || entity.title || '',
      title: entity.title || entity.name || '',
      profile_path: entity.profile_path,
      poster_path: entity.poster_path,
      media_type: entity.media_type,
      popularity: entity.popularity || 50
    };
    
    if (existingIndex >= 0) {
      // Update existing entity
      entities[existingIndex] = entityToSave;
    } else {
      // Add new entity
      entities.push(entityToSave);
    }
    
    localStorage.setItem('searchableEntities', JSON.stringify(entities));
  } catch (error) {
    console.error('Error saving entity to local database:', error);
  }
};

/**
 * Check if a path exists between two nodes using BFS algorithm
 * 
 * @param {string} startNodeId - Starting node ID
 * @param {string} endNodeId - Ending node ID
 * @param {Array} connections - Array of connections
 * @returns {Object} - Path information {found, path, pathNodes}
 */
export const findPathBetweenNodes = (startNodeId, endNodeId, connections) => {
  // Use BFS to find the shortest path
  const visited = new Set();
  const queue = [{ id: startNodeId, path: [startNodeId], pathNodes: [startNodeId] }];
  
  // Create an adjacency list for faster lookups
  const adjacencyList = {};
  connections.forEach(conn => {
    if (!adjacencyList[conn.source]) adjacencyList[conn.source] = [];
    if (!adjacencyList[conn.target]) adjacencyList[conn.target] = [];
    
    adjacencyList[conn.source].push({ 
      id: conn.target,
      connection: conn
    });
    adjacencyList[conn.target].push({ 
      id: conn.source,
      connection: conn
    });
  });
  
  while (queue.length > 0) {
    const { id: currentNodeId, path, pathNodes } = queue.shift();
    
    if (currentNodeId === endNodeId) {
      return { found: true, path, pathNodes };
    }
    
    if (!visited.has(currentNodeId)) {
      visited.add(currentNodeId);
        // Get all connections for the current node
      const neighbors = adjacencyList[currentNodeId] || [];
      
      for (const { id: neighborId } of neighbors) {
        if (!visited.has(neighborId)) {
          // Add this neighbor to the queue with updated path
          const newPath = [...path, neighborId];
          const newPathNodes = [...pathNodes, neighborId];
          queue.push({ 
            id: neighborId, 
            path: newPath,
            pathNodes: newPathNodes
          });
        }
      }
    }
  }
  
  // If we get here, no path exists
  return { found: false, path: [], pathNodes: [] };
};

/**
 * Filters out entities that are already on the board
 * @param {Array} entities - Array of entities to filter
 * @param {Array} nodes - Current board nodes
 * @returns {Array} - Filtered entities
 */
export const filterExistingBoardEntities = (entities, nodes) => {
  const existingNodeIds = new Set(nodes.map(n => n.id));
  return entities.filter(item => {
    const itemId = `${item.media_type}-${item.id}`;
    return !existingNodeIds.has(itemId);
  });
};

/**
 * Fetches a random actor for a starting position, avoiding duplicates
 * @param {number} actorIndex - Index (0 or 1) of the actor position
 * @param {Array} startActors - Current starting actors array
 * @param {Function} fetchRandomPerson - TMDB service function
 * @param {number} maxAttempts - Maximum attempts to avoid infinite loops
 * @returns {Object|null} - Random actor or null if failed
 */
export const fetchRandomUniqueActor = async (actorIndex, startActors, fetchRandomPerson, maxAttempts = 5) => {
  let randomActor = null;
  let attempts = 0;

  console.log(`Fetching random actor for position ${actorIndex}...`);

  while (!randomActor && attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts} to fetch random actor...`);
    
    const actor = await fetchRandomPerson();
    console.log('Fetched actor:', actor?.name, actor?.id);

    // Check if this actor is already used in the other position
    const otherIndex = actorIndex === 0 ? 1 : 0;
    const otherActor = startActors[otherIndex];

    // Only use this actor if it's not the same as the other position
    if (!otherActor || otherActor.id !== actor.id) {
      randomActor = actor;
      console.log(`Successfully selected actor: ${actor.name}`);
    } else {
      console.log("Duplicate actor found, trying again...");
    }
  }

  return randomActor;
};