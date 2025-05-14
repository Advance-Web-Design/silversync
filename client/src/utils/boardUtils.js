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
 * @param {Object} item - Entity to save
 */
export const saveEntityToLocalDatabase = (item) => {
  try {
    const itemType = item.media_type;
    const localStorageKey = `${itemType}History`;
    
    // Get existing history
    const existingHistory = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    
    // Check if this item already exists in history
    const exists = existingHistory.some(historyItem => 
      historyItem.id === item.id && historyItem.media_type === item.media_type
    );
    
    if (!exists) {
      // Add to history and save back to local storage
      const simplifiedItem = {
        id: item.id,
        media_type: item.media_type,
        name: item.name || item.title,
        title: item.title,
        poster_path: item.poster_path,
        profile_path: item.profile_path,
        popularity: item.popularity
      };
      
      existingHistory.push(simplifiedItem);
      
      // Sort by popularity (most popular first) and limit size
      existingHistory.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      const MAX_HISTORY_SIZE = 100;
      const trimmedHistory = existingHistory.slice(0, MAX_HISTORY_SIZE);
      
      localStorage.setItem(localStorageKey, JSON.stringify(trimmedHistory));
      console.log(`Saved ${getItemTitle(item)} to ${localStorageKey}`);
    }
  } catch (error) {
    console.error("Error saving to local database:", error);
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