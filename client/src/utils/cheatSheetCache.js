/**
 * Cheat Sheet Cache - Consolidated caching and enrichment system
 */
import { getMovieDetails, getTvShowDetails } from '../services/tmdbService';
import { logger } from './loggerUtils';

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
    relevantEntities = await fetchConnectableEntitiesOptimized(nodes);

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

// Legacy storage functions (simplified)
export const loadPreviousSearches = () => {
  try {
    const stored = sessionStorage.getItem('previousSearches');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error loading previous searches:', error);
    return [];
  }
};

export const savePreviousSearches = (searches) => {
  if (searches && searches.length > 0) {
    try {
      sessionStorage.setItem('previousSearches', JSON.stringify(searches));
    } catch (error) {
      logger.error('Error saving previous searches:', error);
    }
  }
};

export const loadKnownEntities = () => {
  try {
    const stored = sessionStorage.getItem('knownEntities');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error loading known entities:', error);
    return [];
  }
};

export const saveKnownEntities = (entities) => {
  if (entities && entities.length > 0) {
    try {
      sessionStorage.setItem('knownEntities', JSON.stringify(entities));
    } catch (error) {
      logger.error('Error saving known entities:', error);
    }
  }
};

export const addToSearchHistory = (term, results) => {
  if (!term || !results || results.length === 0) return;

  // Update previous searches
  try {
    const currentSearches = loadPreviousSearches();
    if (!currentSearches.includes(term.toLowerCase())) {
      const updatedSearches = [...currentSearches, term.toLowerCase()];
      savePreviousSearches(updatedSearches);
    }
  } catch (error) {
    logger.warn('Failed to update search history:', error);
  }

  // Update known entities
  try {
    const currentEntities = loadKnownEntities();
    const updatedEntities = [...currentEntities];
    const existingIds = new Set();

    currentEntities.forEach(entity => {
      if (typeof entity === 'object' && entity !== null && entity.id) {
        existingIds.add(`${entity.media_type}-${entity.id}`);
      }
    });

    results.forEach(entity => {
      const entityId = `${entity.media_type}-${entity.id}`;
      if (!existingIds.has(entityId)) {
        updatedEntities.push(entity);
        existingIds.add(entityId);
      }
    });

    saveKnownEntities(updatedEntities);
  } catch (error) {
    logger.warn('Failed to update known entities:', error);
  }
};

/**
 * Helper function to check if production companies contain excluded companies
 * @param {Array} productionCompanies - Array of production company objects
 * @param {Array} excludeCompanies - Array of company names to exclude
 * @returns {boolean} - Whether any excluded company is found
 */
const hasExcludedProductionCompany = (productionCompanies, excludeCompanies) => {
  return productionCompanies.some(company =>
    excludeCompanies.some(excludedCompany =>
      company.name && company.name.includes(excludedCompany)
    )
  );
};

/**
 * Ultra-optimized filtering for better performance
 */
export const filterEntitiesAdvancedOptimized = async (entities, filterOptions = {}) => {  const {
    excludeProductionCompanies = [],
    minPopularity = 0,
    batchSize = 50 // Larger batches
  } = filterOptions;

  if (!entities || entities.length === 0) {
    return [];
  }

  logger.debug(`🔍 Starting ultra-optimized filtering on ${entities.length} entities`);
  const startTime = Date.now();

  // Pre-filter by popularity (very fast, no API calls)
  let filteredEntities = entities;
  if (minPopularity > 0) {
    filteredEntities = entities.filter(entity => (entity.popularity || 0) >= minPopularity);
  }
  // Early exit if no production company filtering needed
  if (excludeProductionCompanies.length === 0) {
    logger.debug(`🔍 No production filtering needed: ${entities.length} → ${filteredEntities.length} in ${Date.now() - startTime}ms`);
    return filteredEntities;
  }

  // Cache for production company data with aggressive caching strategy
  const productionCompanyCache = new Map();
  const failedFetches = new Set(); // Track failed API calls to avoid retries
    const finalEntities = [];
  
  // Process in larger batches with timeout protection
  for (let i = 0; i < filteredEntities.length; i += batchSize) {
    const batch = filteredEntities.slice(i, i + batchSize);
    
    // Set a timeout for the entire batch
    const batchPromise = Promise.race([
      processBatchWithTimeout(batch, excludeProductionCompanies, productionCompanyCache, failedFetches),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Batch timeout')), 3000)) // 3 second timeout
    ]);

    try {      const batchResults = await batchPromise;
      const validResults = batchResults.filter(entity => entity !== null);
      finalEntities.push(...validResults);
        // Very short delay between batches
      if (i + batchSize < filteredEntities.length) {
        await new Promise(resolve => setTimeout(resolve, 25)); // Reduced to 25ms
      }
    } catch (error) {      if (error.message === 'Batch timeout') {
        logger.warn(`⚠️ Batch ${i}-${i + batchSize} timed out, skipping`);
        // Add entities without filtering on timeout
        finalEntities.push(...batch);
      } else {
        logger.error('Batch processing error:', error);
      }
    }
  }
  const duration = Date.now() - startTime;

  logger.debug(`🔍 Ultra-optimized filtering complete: ${entities.length} → ${finalEntities.length} in ${duration}ms`);
  return finalEntities;
};

/**
 * Process a batch with timeout protection
 */
const processBatchWithTimeout = async (batch, excludeProductionCompanies, cache, failedFetches) => {
  const batchPromises = batch.map(async (entity) => {
    try {
      const cacheKey = `${entity.media_type}-${entity.id}`;
      
      // Skip if we know this fetch failed before
      if (failedFetches.has(cacheKey)) {
        return entity; // Keep entity if we can't check
      }
      
      // Check cache first
      if (cache.has(cacheKey)) {
        const passes = cache.get(cacheKey);
        return passes ? entity : null;
      }

      const passesFilter = await filterByProductionCompaniesUltraFast(
        entity, 
        excludeProductionCompanies,
        cache,
        failedFetches
      );
      
      return passesFilter ? entity : null;
    } catch (error) {
      logger.error(`Error filtering entity ${entity.title || entity.name}:`, error);
      return entity; // Keep entity if filtering fails
    }
  });

  return await Promise.all(batchPromises);
};

/**
 * Get cached cheat sheet if valid
 */
export const getCachedCheatSheet = (boardState) => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEYS.CHEAT_SHEET);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const currentBoardHash = generateBoardHash(boardState);
    
    // Check if cache is still valid (same board state and not expired)
    if (cacheData.boardHash === currentBoardHash && 
        Date.now() - cacheData.timestamp < CACHE_DURATION) {
      return cacheData.entities;
    }
    
    return null;
  } catch (error) {
    logger.error('Error reading cached cheat sheet:', error);
    return null;
  }
};

/**
 * Optimized version of fetchConnectableEntitiesFromBoard
 */
const fetchConnectableEntitiesOptimized = async (nodes) => {
  const allConnectableEntities = [];
  const seenEntities = new Set(); // For fast duplicate detection
  
  logger.debug(`🔍 Processing ${nodes.length} nodes for connections`);
  
  for (const node of nodes) {
    if (!node?.data?.id) continue;

    let nodeConnections = [];
    logger.debug(`🔍 Processing node: ${node.type}-${node.id} (${node.data?.name || node.data?.title})`);

    if (node.type === 'person') {// Process movie credits - no limits, get full cast (including those without images)
      if (node.data.movie_credits?.cast) {
        const movies = node.data.movie_credits.cast
          .filter(movie => movie.id && movie.title) // Filter by essential data only
          .map(movie => ({
            ...movie,
            media_type: 'movie',
            source_node: node.id,
            poster_path: movie.poster_path || null
          }));
        nodeConnections.push(...movies);
      }

      // Process TV credits - no limits, get full cast (including those without images)
      if (node.data.tv_credits?.cast) {
        const shows = node.data.tv_credits.cast
          .filter(show => show.id && show.name) // Filter by essential data only
          .map(show => ({
            ...show,
            media_type: 'tv',
            source_node: node.id,
            poster_path: show.poster_path || null,
            connection_type: show.is_guest_appearance ? 'guest' : 'cast'
          }));
        nodeConnections.push(...shows);
      }
        // Process guest appearances - no limits, get all guest appearances (including those without images)
      if (node.data.guest_appearances) {
        const guests = node.data.guest_appearances
          .filter(show => show.id && show.name) // Filter by essential data only
          .map(show => ({
            ...show,
            media_type: 'tv',
            is_guest_appearance: true,
            connection_type: 'guest',
            source_node: node.id,
            poster_path: show.poster_path || null
          }));
        nodeConnections.push(...guests);
      }    } else if (node.type === 'movie' && node.data.credits?.cast) {
      const actors = node.data.credits.cast
        .filter(actor => actor.id && actor.name) // Filter by essential data only
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id,
          profile_path: actor.profile_path || null
        }));
      nodeConnections.push(...actors);    } else if (node.type === 'tv') {
      logger.debug(`🔍 TV node: ${node.data?.name}, has aggregate_credits: ${!!node.data.aggregate_credits?.cast}, cast count: ${node.data.aggregate_credits?.cast?.length || 0}`);
      
      // Use aggregate_credits.cast for more comprehensive actor list - no limits
      if (node.data.aggregate_credits?.cast) {
        const actors = node.data.aggregate_credits.cast
          .filter(actor => actor.id && actor.name) // Include ALL actors with id/name, regardless of profile_path
          .map(actor => ({
            ...actor,
            media_type: 'person',
            source_node: node.id,
            profile_path: actor.profile_path || null
          }));
        nodeConnections.push(...actors);
      } else if (node.data.credits?.cast) {        // Fallback to regular credits if aggregate_credits not available - no limits
        const actors = node.data.credits.cast
          .filter(actor => actor.id && actor.name) // Remove profile_path requirement for consistency
          .map(actor => ({
            ...actor,
            media_type: 'person',
            source_node: node.id,
            profile_path: actor.profile_path || null
          }));
        nodeConnections.push(...actors);
      }      // Process guest stars - no limits, get all guest stars (including those without images)
      if (node.data.guest_stars) {
        const guestStars = node.data.guest_stars
          .filter(actor => actor.id && actor.name) // Filter by essential data only
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
      if (!seenEntities.has(entityKey)) {        seenEntities.add(entityKey);
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

    // Include all entities (already filtered for images during extraction)
    processedEntities.push(entity);
  }

  logger.debug(`🔍 Fast filtering: ${relevantEntities.length} → ${processedEntities.length} in ${Date.now() - startFilterTime}ms`);
  // Apply media type filters
  let finalEntities = processedEntities;
  if (filterOptions.enableProductionFiltering) {
    if (filterOptions.filtertype?.includes('movies-only')) {
      finalEntities = finalEntities.filter(entity => entity.media_type !== 'tv');
    } else if (filterOptions.filtertype?.includes('tv-only')) {
      finalEntities = finalEntities.filter(entity => entity.media_type !== 'movie');
    }
  }
  // Apply production company filtering with adaptive limits based on dataset size
  if (filterOptions.enableProductionFiltering && 
      filterOptions.filtertype?.includes('no-production-companie')) {
    
    if (finalEntities.length < 200) {      logger.debug('🔍 Applying full production company filtering');
      finalEntities = await filterEntitiesAdvancedOptimized(finalEntities, {
        ...filterOptions,
        batchSize: 50 // Larger batches
      });
    } else {      logger.debug('🔍 Applying optimized production company filtering for large dataset');      // For large datasets, apply filtering but without limits
      finalEntities = await filterEntitiesAdvancedOptimized(finalEntities, {
        ...filterOptions,
        batchSize: 100 // Even larger batches for efficiency
      });
    }
  }

  return finalEntities;
};

/**
 * Ultra-fast version of filterByProductionCompanies with aggressive caching and timeout protection
 */
export const filterByProductionCompaniesUltraFast = async (entity, excludeCompanies = [], cache = null, failedFetches = null) => {
  // Only filter movies and TV shows for production companies
  if (!entity || (entity.media_type !== 'movie' && entity.media_type !== 'tv')) {
    return true; // Keep people and other entities
  }

  // If no companies to exclude, keep all movies and TV shows
  if (!excludeCompanies || excludeCompanies.length === 0) {
    return true;
  }

  try {
    // Check if we already have production company data
    if (entity.production_companies && Array.isArray(entity.production_companies)) {
      return !hasExcludedProductionCompany(entity.production_companies, excludeCompanies);
    }

    // Check cache first if provided
    const cacheKey = `details-${entity.media_type}-${entity.id}`;
    let details = cache?.get(cacheKey);

    if (!details) {
      // Check if this fetch failed before
      if (failedFetches?.has(cacheKey)) {
        return true; // Skip if we know it will fail
      }

      // Set a timeout for individual API calls
      const fetchPromise = entity.media_type === 'movie' 
        ? getMovieDetails(entity.id)
        : getTvShowDetails(entity.id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 2000) // 2 second timeout per call
      );

      try {
        details = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (error) {
        if (error.message === 'API timeout') {
          logger.warn(`⚠️ API timeout for ${entity.media_type} ${entity.id}, skipping filter`);
          failedFetches?.add(cacheKey);
          return true; // Keep entity on timeout
        }
        throw error;
      }

      // Cache the details if cache is provided
      if (cache && details) {
        cache.set(cacheKey, details);
      }
    }

    if (details && details.production_companies && Array.isArray(details.production_companies)) {
      const hasExcludedCompany = hasExcludedProductionCompany(details.production_companies, excludeCompanies);
      return !hasExcludedCompany;
    }

    return true; // Keep the movie/TV show if no excluded companies found

  } catch (error) {
    logger.error(`Error checking production companies for ${entity.title || entity.name}:`, error);
    failedFetches?.add(`details-${entity.media_type}-${entity.id}`);
    return true; // Keep the entity if we can't check (fail gracefully)
  }
};