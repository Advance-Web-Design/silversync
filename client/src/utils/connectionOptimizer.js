/**
 * Connection calculation optimizations using indexed lookups
 * Replaces O(n) linear searches with O(1) hash map lookups
 */
import { logger } from './loggerUtils';

/**
 * Create optimized index structures for fast connection lookups
 * @param {Array} nodes - Current board nodes
 * @returns {Object} - Optimized lookup structures
 */
export const createConnectionIndex = (nodes) => {
  const personIndex = new Map(); // person.id -> node
  const movieIndex = new Map();  // movie.id -> node
  const tvIndex = new Map();     // tv.id -> node
  
  // Build indexes by type
  for (const node of nodes) {
    switch (node.type) {
      case 'person':
        personIndex.set(node.data.id, node);
        break;
      case 'movie':
        movieIndex.set(node.data.id, node);
        break;
      case 'tv':
        tvIndex.set(node.data.id, node);
        break;
    }
  }
  
  logger.debug(`🔍 Built connection index: ${personIndex.size} actors, ${movieIndex.size} movies, ${tvIndex.size} TV shows`);
  
  return { personIndex, movieIndex, tvIndex };
};

/**
 * Create credit indexes for a person's filmography
 * @param {Object} person - Person with movie/TV credits
 * @returns {Object} - Credit lookup maps
 */
export const createCreditIndex = (person) => {
  const movieCreditIndex = new Map();
  const tvCreditIndex = new Map();
  
  // Index movie credits
  const movieCredits = person.movie_credits?.cast || [];
  for (const credit of movieCredits) {
    movieCreditIndex.set(credit.id, credit);
  }
  
  // Index TV credits
  const tvCredits = person.tv_credits?.cast || [];
  for (const credit of tvCredits) {
    tvCreditIndex.set(credit.id, credit);
  }
  
  return { movieCreditIndex, tvCreditIndex };
};

/**
 * Create cast index for a movie or TV show
 * @param {Object} mediaItem - Movie or TV show with cast credits
 * @returns {Map} - Cast lookup map (actor.id -> actor)
 */
export const createCastIndex = (mediaItem) => {
  const castIndex = new Map();
  const cast = mediaItem.credits?.cast || [];
  
  for (const actor of cast) {
    castIndex.set(actor.id, actor);
  }
  
  return castIndex;
};

/**
 * Optimized person connection finding using indexes
 * @param {Object} person - Person object with complete details
 * @param {Object} connectionIndex - Pre-built connection indexes
 * @param {string} personNodeId - ID of the person node
 * @returns {Array} - Array of connections
 */
export const findPersonConnectionsOptimized = (person, connectionIndex, personNodeId) => {
  const connections = [];
  const { movieIndex, tvIndex } = connectionIndex;
  
  // Create credit indexes for this person
  const { movieCreditIndex, tvCreditIndex } = createCreditIndex(person);
  
  // Check movie connections using O(1) lookups
  for (const [movieId] of movieCreditIndex) {
    const movieNode = movieIndex.get(movieId);
    if (movieNode) {
      connections.push({
        id: `${personNodeId}-${movieNode.id}`,
        source: personNodeId,
        target: movieNode.id
      });
      logger.debug(`Found connection between ${personNodeId} and movie ${movieNode.id}`);
    }
  }
  
  // Check TV connections using O(1) lookups
  for (const [tvId, creditInfo] of tvCreditIndex) {
    const tvNode = tvIndex.get(tvId);
    if (tvNode) {
      const isGuestAppearance = creditInfo.is_guest_appearance || false;
      
      connections.push({
        id: `${personNodeId}-${tvNode.id}`,
        source: personNodeId,
        target: tvNode.id,
        isGuestAppearance
      });
      
      logger.debug(`Found connection between ${personNodeId} and TV show ${tvNode.id}${isGuestAppearance ? ' (guest)' : ''}`);
    }
  }
  
  return connections;
};

/**
 * Optimized movie connection finding using indexes
 * @param {Object} movie - Movie object with complete details
 * @param {Object} connectionIndex - Pre-built connection indexes
 * @param {string} movieNodeId - ID of the movie node
 * @returns {Array} - Array of connections
 */
export const findMovieConnectionsOptimized = (movie, connectionIndex, movieNodeId) => {
  const connections = [];
  const { personIndex } = connectionIndex;
  
  // Create cast index for this movie
  const castIndex = createCastIndex(movie);
  
  // Check actor connections using O(1) lookups
  for (const [actorId] of castIndex) {
    const personNode = personIndex.get(actorId);
    if (personNode) {
      connections.push({
        id: `${personNode.id}-${movieNodeId}`,
        source: personNode.id,
        target: movieNodeId
      });
      logger.debug(`Found connection between movie ${movieNodeId} and actor ${personNode.id}`);
    }
  }
  
  return connections;
};

/**
 * Optimized TV show connection finding using indexes
 * @param {Object} tvShow - TV show object with complete details
 * @param {Object} connectionIndex - Pre-built connection indexes
 * @param {string} tvNodeId - ID of the TV show node
 * @returns {Array} - Array of connections
 */
export const findTvShowConnectionsOptimized = (tvShow, connectionIndex, tvNodeId) => {
  const connections = [];
  const { personIndex } = connectionIndex;
  
  // Create cast index for this TV show
  const castIndex = createCastIndex(tvShow);
  
  // Check actor connections using O(1) lookups
  for (const [actorId] of castIndex) {
    const personNode = personIndex.get(actorId);
    if (personNode) {
      connections.push({
        id: `${personNode.id}-${tvNodeId}`,
        source: personNode.id,
        target: tvNodeId
      });
      logger.debug(`Found regular cast connection between TV show ${tvNodeId} and actor ${personNode.id}`);
    }
  }
  
  // Also check for guest appearances from actor credits
  for (const [actorId, personNode] of personIndex) {
    if (!castIndex.has(actorId)) { // Not in regular cast
      const tvCredits = personNode.data.tv_credits?.cast || [];
      const creditInfo = tvCredits.find(credit => credit.id === tvShow.id);
      
      if (creditInfo) {
        const isGuestAppearance = creditInfo.is_guest_appearance || false;
        connections.push({
          id: `${personNode.id}-${tvNodeId}`,
          source: personNode.id,
          target: tvNodeId,
          isGuestAppearance
        });
        logger.debug(`Found ${isGuestAppearance ? 'guest appearance' : 'cast'} connection between TV show ${tvNodeId} and actor ${personNode.id}`);
      }
    }
  }
  
  return connections;
};

/**
 * Optimized connectability check using batch processing
 * @param {Array} items - Items to check for connectability
 * @param {Array} nodes - Current board nodes
 * @param {Object} services - TMDB service functions
 * @returns {Promise<Map>} - Map of item.id -> boolean (connectable)
 */
export const batchCheckConnectability = async (items, nodes, services) => {
  const { getPersonDetails, getMovieDetails, getTvShowDetails } = services;
  const connectionIndex = createConnectionIndex(nodes);
  const results = new Map();
  
  // Group items by type for batch processing
  const groupedItems = {
    person: items.filter(item => item.media_type === 'person'),
    movie: items.filter(item => item.media_type === 'movie'),
    tv: items.filter(item => item.media_type === 'tv')
  };
  
  // Process each type in parallel batches
  const batchPromises = [];
  
  // Process persons
  if (groupedItems.person.length > 0) {
    batchPromises.push(
      processBatch(groupedItems.person, 'person', connectionIndex, getPersonDetails, results)
    );
  }
  
  // Process movies
  if (groupedItems.movie.length > 0) {
    batchPromises.push(
      processBatch(groupedItems.movie, 'movie', connectionIndex, getMovieDetails, results)
    );
  }
  
  // Process TV shows
  if (groupedItems.tv.length > 0) {
    batchPromises.push(
      processBatch(groupedItems.tv, 'tv', connectionIndex, getTvShowDetails, results)
    );
  }
  
  await Promise.all(batchPromises);
  
  logger.debug(`🚀 Batch processed ${items.length} items: ${Array.from(results.values()).filter(Boolean).length} connectable`);
  
  return results;
};

/**
 * Process a batch of items of the same type
 */
const processBatch = async (items, type, connectionIndex, getDetailsFn, results) => {
  const { personIndex, movieIndex, tvIndex } = connectionIndex;
  
  for (const item of items) {
    try {
      let isConnectable = false;
      
      if (type === 'person') {
        const details = await getDetailsFn(item.id);
        const { movieCreditIndex, tvCreditIndex } = createCreditIndex(details);
        
        // Check if any movies/TV shows on board are in this person's credits
        for (const [movieId] of movieCreditIndex) {
          if (movieIndex.has(movieId)) {
            isConnectable = true;
            break;
          }
        }
        
        if (!isConnectable) {
          for (const [tvId] of tvCreditIndex) {
            if (tvIndex.has(tvId)) {
              isConnectable = true;
              break;
            }
          }
        }
      } else if (type === 'movie' || type === 'tv') {
        const details = await getDetailsFn(item.id);
        const castIndex = createCastIndex(details);
        
        // Check if any actors on board are in this movie/TV show's cast
        for (const [actorId] of castIndex) {
          if (personIndex.has(actorId)) {
            isConnectable = true;
            break;
          }
        }
      }
      
      results.set(item.id, isConnectable);
    } catch (error) {
      logger.error(`Error checking connectability for ${type} ${item.id}:`, error);
      results.set(item.id, false);
    }
  }
};

/**
 * Memoized path finding with result caching
 */
class PathCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  getKey(startId, endId) {
    // Normalize key order for bidirectional paths
    return startId < endId ? `${startId}:${endId}` : `${endId}:${startId}`;
  }
  
  get(startId, endId) {
    return this.cache.get(this.getKey(startId, endId));
  }
  
  set(startId, endId, result) {
    const key = this.getKey(startId, endId);
    
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Global path cache instance
const pathCache = new PathCache();

/**
 * Optimized path finding with caching and early termination
 * @param {string} startNodeId - Starting node ID
 * @param {string} endNodeId - Ending node ID
 * @param {Array} connections - Array of connections
 * @returns {Object} - Path information {found, path, pathNodes}
 */
export const findPathBetweenNodesOptimized = (startNodeId, endNodeId, connections) => {
  // Check cache first
  const cached = pathCache.get(startNodeId, endNodeId);
  if (cached) {
    logger.debug(`📦 Using cached path result for ${startNodeId} -> ${endNodeId}`);
    return cached;
  }
  
  // Early termination: if start and end are the same
  if (startNodeId === endNodeId) {
    const result = { found: true, path: [startNodeId], pathNodes: [startNodeId] };
    pathCache.set(startNodeId, endNodeId, result);
    return result;
  }
  
  // Build adjacency list only once
  const adjacencyList = new Map();
  for (const conn of connections) {
    if (!adjacencyList.has(conn.source)) adjacencyList.set(conn.source, []);
    if (!adjacencyList.has(conn.target)) adjacencyList.set(conn.target, []);
    
    adjacencyList.get(conn.source).push(conn.target);
    adjacencyList.get(conn.target).push(conn.source);
  }
  
  // Early termination: if either node has no connections
  if (!adjacencyList.has(startNodeId) || !adjacencyList.has(endNodeId)) {
    const result = { found: false, path: [], pathNodes: [] };
    pathCache.set(startNodeId, endNodeId, result);
    return result;
  }
  
  // BFS with optimizations
  const visited = new Set();
  const queue = [{ id: startNodeId, path: [startNodeId] }];
  
  while (queue.length > 0) {
    const { id: currentNodeId, path } = queue.shift();
    
    if (currentNodeId === endNodeId) {
      const result = { found: true, path, pathNodes: path };
      pathCache.set(startNodeId, endNodeId, result);
      return result;
    }
    
    if (!visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      
      const neighbors = adjacencyList.get(currentNodeId) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          queue.push({ 
            id: neighborId, 
            path: [...path, neighborId]
          });
        }
      }
    }
  }
  
  // No path found
  const result = { found: false, path: [], pathNodes: [] };
  pathCache.set(startNodeId, endNodeId, result);
  return result;
};

/**
 * Clear the path cache (useful when board state changes significantly)
 */
export const clearPathCache = () => {
  pathCache.clear();
  logger.debug('🗑️ Path cache cleared');
};

export { pathCache };