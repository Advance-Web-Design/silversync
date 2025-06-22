/**
 * Cheat Sheet Cache - Consolidated caching and enrichment system
 * 
 * GLOBAL IMAGE FILTER: All entities (movies, TV shows, actors) without images
 * are automatically excluded from the game in ALL modes. This ensures that
 * players only encounter entities with poster_path (movies/TV) or profile_path (actors).
 */
import { logger } from './loggerUtils';
import { filterEntitiesByChallenge } from './challengeUtils';

// Cache keys
const CACHE_KEYS = {
  CHEAT_SHEET: 'cheatSheetCache',
  PREVIOUS_SEARCHES: 'previousSearches',
  KNOWN_ENTITIES: 'knownEntities'
};

// Cache validity duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Generate cheat sheet data based on current board state
 * @param {Array} nodes - Current board nodes
 * @param {boolean} gameStarted - Whether the game has started
 * @param {Array} startActors - Starting actors
 * @param {Object} filterOptions - Optional filtering options
 */
export const generateCheatSheet = async (nodes, gameStarted, startActors, filterOptions = {}) => {
  const startTime = Date.now();
  logger.time('cheat-sheet-generation');
  logger.info('🎯 Generating cheat sheet from cache system');

  try {
    if (nodes.length === 0 || !gameStarted) {
      return [];
    }    // No limits - get entire cast for complete coverage

    let relevantEntities = [];    // Always use the advanced phase logic to get all connectable entities
    logger.debug('🎯 Fetching all connectable entities from board');
    logger.debug(`🔍 Board has ${nodes.length} nodes:`, nodes.map(n => `${n.type}-${n.data?.name || n.data?.title || n.id}`));
    relevantEntities = await fetchConnectableEntitiesOptimized(nodes, filterOptions);

    logger.debug(`🔍 Total entities before filtering: ${relevantEntities.length}`);    // Fast filtering pipeline without hard limits
    const finalEntities = await optimizeEntityFilteringFast(
      relevantEntities, 
      nodes, 
      filterOptions
    );

    const duration = Date.now() - startTime;
    logger.info(`🎯 Cheat sheet generated: ${finalEntities.length} entities in ${duration}ms`);
    logger.timeEnd('cheat-sheet-generation');

    // Cache the results
    setCachedCheatSheet(finalEntities, nodes);

    return finalEntities;
  } catch (error) {
    logger.error('Error generating cheat sheet:', error);
    return [];
  }
};

/**
 * Cache management functions
 */
export const setCachedCheatSheet = (entities, boardState) => {
  try {
    const cacheData = {
      entities,
      boardHash: generateBoardHash(boardState),
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEYS.CHEAT_SHEET, JSON.stringify(cacheData));
  } catch (error) {
    logger.error('Error caching cheat sheet:', error);
  }
};

/**
 * Clear cheat sheet cache when starting a new game
 * This clears cached entities but preserves connection data (previousSearches, knownEntities)
 */
export const clearCheatSheetCacheForNewGame = () => {
  try {
    // Clear only the cheat sheet cache, not connection data
    sessionStorage.removeItem(CACHE_KEYS.CHEAT_SHEET);
    // Note: PREVIOUS_SEARCHES and KNOWN_ENTITIES are preserved for better user experience
    logger.info('🗑️ Cleared cheat sheet cache for new game (preserved connection data)');
  } catch (error) {
    logger.error('Error clearing cheat sheet cache:', error);
  }
};

/**
 * Generate a hash of the current board state for cache validation
 */
const generateBoardHash = (nodes) => {
  if (!nodes || nodes.length === 0) return 'empty';

  const sortedNodeIds = nodes
    .map(node => node.id)
    .sort()
    .join('|');
  return btoa(sortedNodeIds).slice(0, 16); // Simple hash for cache key
};

/**
 * Optimized version of fetchConnectableEntitiesFromBoard
 */
const fetchConnectableEntitiesOptimized = async (nodes, filterOptions = {}) => {
  const allConnectableEntities = [];
  const seenEntities = new Set();
  
  logger.debug(`🔍 Processing ${nodes.length} nodes for connections`);
  
  for (const node of nodes) {
    if (!node?.data?.id) continue;

    let nodeConnections = [];
    logger.debug(`🔍 Processing node: ${node.type}-${node.id} (${node.data?.name || node.data?.title})`);

    if (node.type === 'person') {
      // Process movie credits - include movies UNLESS we're in tv-only mode
      if (node.data.movie_credits?.cast && 
          (!filterOptions?.enableProductionFiltering || 
           !filterOptions?.filtertype?.includes('tv-only'))) {
        const movies = node.data.movie_credits.cast
          .filter(movie => movie.id && movie.title)
          .map(movie => ({
            ...movie,
            media_type: 'movie',
            source_node: node.id,
            poster_path: movie.poster_path || null
          }));
        nodeConnections.push(...movies);
      }

      // Process TV credits - include TV shows UNLESS we're in movies-only mode
      if (node.data.tv_credits?.cast && 
          (!filterOptions?.enableProductionFiltering || 
           !filterOptions?.filtertype?.includes('movies-only'))) {
        const shows = node.data.tv_credits.cast
          .filter(show => show.id && show.name)
          .map(show => ({
            ...show,
            media_type: 'tv',
            source_node: node.id,
            poster_path: show.poster_path || null,
            connection_type: show.is_guest_appearance ? 'guest' : 'cast'
          }));
        nodeConnections.push(...shows);
      }

      // Process guest appearances - include UNLESS we're in movies-only mode
      if (node.data.guest_appearances && 
          (!filterOptions?.enableProductionFiltering || 
           !filterOptions?.filtertype?.includes('movies-only'))) {
        const guests = node.data.guest_appearances
          .filter(show => show.id && show.name)
          .map(show => ({
            ...show,
            media_type: 'tv',
            is_guest_appearance: true,
            connection_type: 'guest',
            source_node: node.id,
            poster_path: show.poster_path || null
          }));
        nodeConnections.push(...guests);
      }
    } 
    else if (node.type === 'movie' && node.data.credits?.cast) {
      // Always include actors from movies (no filtering needed for actors)
      const actors = node.data.credits.cast
        .filter(actor => actor.id && actor.name)
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id,
          profile_path: actor.profile_path || null
        }));
      nodeConnections.push(...actors);
    } 
    else if (node.type === 'tv') {
      // Always include actors from TV shows (no filtering needed for actors)
      logger.debug(`🔍 TV node: ${node.data?.name}, has aggregate_credits: ${!!node.data.aggregate_credits?.cast}, cast count: ${node.data.aggregate_credits?.cast?.length || 0}`);
      
      if (node.data.aggregate_credits?.cast) {
        const actors = node.data.aggregate_credits.cast
          .filter(actor => actor.id && actor.name)
          .map(actor => ({
            ...actor,
            media_type: 'person',
            source_node: node.id,
            profile_path: actor.profile_path || null
          }));
        nodeConnections.push(...actors);
      } else if (node.data.credits?.cast) {
        const actors = node.data.credits.cast
          .filter(actor => actor.id && actor.name)
          .map(actor => ({
            ...actor,
            media_type: 'person',
            source_node: node.id,
            profile_path: actor.profile_path || null
          }));
        nodeConnections.push(...actors);
      }

      // Process guest stars
      if (node.data.guest_stars) {
        const guestStars = node.data.guest_stars
          .filter(actor => actor.id && actor.name)
          .map(actor => ({
            ...actor,
            media_type: 'person',
            is_guest_star: true,
            source_node: node.id,
            profile_path: actor.profile_path || null
          }));
        nodeConnections.push(...guestStars);
      }
    }

    // Add to results with duplicate checking
    for (const entity of nodeConnections) {
      const entityKey = `${entity.media_type}-${entity.id}`;
      if (!seenEntities.has(entityKey)) {
        seenEntities.add(entityKey);
        allConnectableEntities.push(entity);
      }
    }
    
    logger.debug(`🔍 Node ${node.type}-${node.id} contributed ${nodeConnections.length} connections`);
  }

  logger.debug(`🔍 Total connectable entities: ${allConnectableEntities.length}`);
  return allConnectableEntities;
};

/**
 * Ultra-fast filtering pipeline
 */
const optimizeEntityFilteringFast = async (relevantEntities, nodes, filterOptions) => {
  const startFilterTime = Date.now();
  
  // Pre-compute board entities for fast lookup
  const existingBoardIds = new Set(nodes.map(node => `${node.type}-${node.data?.id}`));
    // Single-pass filtering
  const processedEntities = [];
    for (const entity of relevantEntities) {
    if (!entity?.id) continue;

    // Skip if already on board (fast Set lookup)
    const entityKey = `${entity.media_type}-${entity.id}`;
    if (existingBoardIds.has(entityKey)) continue;

    // GLOBAL IMAGE FILTER: Always exclude entities without images
    // This applies to all game modes and challenges
    if (entity.media_type === 'person') {
      // For actors, require profile_path
      if (!entity.profile_path) {
        continue; // Skip this entity
      }
    } else {
      // For movies/TV shows, require poster_path
      if (!entity.poster_path) {
        continue; // Skip this entity
      }
    }

    processedEntities.push(entity);
  }

  logger.debug(`🔍 Fast filtering with global image filter: ${relevantEntities.length} → ${processedEntities.length} in ${Date.now() - startFilterTime}ms`);

  // Apply challenge-based filtering first (most important)
  let challengeFilteredEntities = processedEntities;
  if (filterOptions.challengeName) {
    const challengeStartTime = Date.now();
    challengeFilteredEntities = filterEntitiesByChallenge(processedEntities, filterOptions.challengeName);
    logger.debug(`🎯 Challenge filtering (${filterOptions.challengeName}): ${processedEntities.length} → ${challengeFilteredEntities.length} in ${Date.now() - challengeStartTime}ms`);
  }
  // Apply media type filters
  let finalEntities = challengeFilteredEntities;
  if (filterOptions.enableProductionFiltering) {
    if (filterOptions.filtertype?.includes('movies-only')) {
      finalEntities = finalEntities.filter(entity => entity.media_type !== 'tv');
    } else if (filterOptions.filtertype?.includes('tv-only')) {
      finalEntities = finalEntities.filter(entity => entity.media_type !== 'movie');
    }
  }
  return finalEntities;
};