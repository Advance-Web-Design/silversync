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
    }


    // Early limit to prevent massive datasets
    const maxEntitiesPerNode = filterOptions.maxEntitiesPerNode || 100;
    const absoluteMaxResults = filterOptions.absoluteMaxResults || 500;    let relevantEntities = [];
    // Initial game phase: show connections to starting actors
    if (nodes.length <= 2 && startActors.length === 2) {
      logger.debug('🎯 Initial game phase - extracting connections from starting actors');
      relevantEntities = await extractConnectionsFromNodes(nodes, maxEntitiesPerNode);
    } else {
      // Advanced game phase: get all connectable entities from board (optimized)
      logger.debug('🎯 Advanced game phase - fetching connectable entities');
      relevantEntities = await fetchConnectableEntitiesOptimized(nodes, maxEntitiesPerNode);
    }

    logger.debug(`🔍 Total entities before filtering: ${relevantEntities.length}`);

    // Fast filtering pipeline with early termination
    const finalEntities = await optimizeEntityFilteringFast(
      relevantEntities, 
      nodes, 
      filterOptions, 
      absoluteMaxResults
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
export const filterEntitiesAdvancedOptimized = async (entities, filterOptions = {}) => {
  const {
    excludeProductionCompanies = [],
    minPopularity = 0,
    maxResults = 100, // Lower default
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
    const result = maxResults ? filteredEntities.slice(0, maxResults) : filteredEntities;
    logger.debug(`🔍 No production filtering needed: ${entities.length} → ${result.length} in ${Date.now() - startTime}ms`);
    return result;
  }

  // Cache for production company data with aggressive caching strategy
  const productionCompanyCache = new Map();
  const failedFetches = new Set(); // Track failed API calls to avoid retries
  
  const finalEntities = [];
  let processedCount = 0;

  // Process in larger batches with timeout protection
  for (let i = 0; i < filteredEntities.length; i += batchSize) {
    if (processedCount >= maxResults) break; // Early termination
    
    const batch = filteredEntities.slice(i, i + batchSize);
    
    // Set a timeout for the entire batch
    const batchPromise = Promise.race([
      processBatchWithTimeout(batch, excludeProductionCompanies, productionCompanyCache, failedFetches),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Batch timeout')), 3000)) // 3 second timeout
    ]);

    try {
      const batchResults = await batchPromise;
      const validResults = batchResults.filter(entity => entity !== null);
      finalEntities.push(...validResults);
      processedCount += validResults.length;
      
      // Very short delay
      if (i + batchSize < filteredEntities.length && processedCount < maxResults) {
        await new Promise(resolve => setTimeout(resolve, 25)); // Reduced to 25ms
      }
    } catch (error) {
      if (error.message === 'Batch timeout') {
        logger.warn(`⚠️ Batch ${i}-${i + batchSize} timed out, skipping`);
        // Add entities without filtering on timeout
        const timeoutBatch = batch.slice(0, Math.min(batch.length, maxResults - processedCount));
        finalEntities.push(...timeoutBatch);
        processedCount += timeoutBatch.length;
      } else {
        logger.error('Batch processing error:', error);
      }
    }
  }

  const finalResults = maxResults ? finalEntities.slice(0, maxResults) : finalEntities;
  const duration = Date.now() - startTime;

  logger.debug(`🔍 Ultra-optimized filtering complete: ${entities.length} → ${finalResults.length} in ${duration}ms`);
  return finalResults;
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
 * Fast extraction of connections from nodes with early limits
 */
const extractConnectionsFromNodes = async (nodes, maxPerNode) => {
  const relevantEntities = [];
  
  for (const node of nodes) {
    let nodeEntities = [];
    
    if (node.type === 'person' && node.data) {
      // Add movie credits with limit
      if (node.data.movie_credits?.cast) {
        const movieCredits = node.data.movie_credits.cast
          .slice(0, maxPerNode) // Early limit
          .filter(movie => movie.poster_path) // Filter with images immediately
          .map(movie => ({
            ...movie,
            media_type: 'movie',
            source_node: node.id
          }));
        nodeEntities.push(...movieCredits);
      }
      
      // Add TV credits with limit
      if (node.data.tv_credits?.cast) {
        const tvCredits = node.data.tv_credits.cast
          .slice(0, maxPerNode) // Early limit
          .filter(show => show.poster_path) // Filter with images immediately
          .map(show => ({
            ...show,
            media_type: 'tv',
            source_node: node.id
          }));
        nodeEntities.push(...tvCredits);
      }
    } else if (node.type === 'movie' && node.data.credits?.cast) {
      const actors = node.data.credits.cast
        .slice(0, maxPerNode) // Early limit
        .filter(actor => actor.profile_path) // Filter with images immediately
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id
        }));
      nodeEntities.push(...actors);
    } else if (node.type === 'tv' && node.data.credits?.cast) {
      const actors = node.data.credits.cast
        .slice(0, maxPerNode) // Early limit
        .filter(actor => actor.profile_path) // Filter with images immediately
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id
        }));
      nodeEntities.push(...actors);
    }
    
    relevantEntities.push(...nodeEntities);
  }
  
  return relevantEntities;
};

/**
 * Optimized version of fetchConnectableEntitiesFromBoard with limits
 */
const fetchConnectableEntitiesOptimized = async (nodes, maxPerNode) => {
  const allConnectableEntities = [];
  const seenEntities = new Set(); // For fast duplicate detection
  
  for (const node of nodes) {
    if (!node?.data?.id) continue;

    let nodeConnections = [];

    if (node.type === 'person') {
      // Process movie credits with early filtering
      if (node.data.movie_credits?.cast) {
        const movies = node.data.movie_credits.cast
          .filter(movie => movie.poster_path && movie.id) // Filter early
          .slice(0, maxPerNode) // Limit early
          .map(movie => ({
            ...movie,
            media_type: 'movie',
            source_node: node.id
          }));
        nodeConnections.push(...movies);
      }

      // Process TV credits with early filtering
      if (node.data.tv_credits?.cast) {
        const shows = node.data.tv_credits.cast
          .filter(show => show.poster_path && show.id) // Filter early
          .slice(0, maxPerNode) // Limit early
          .map(show => ({
            ...show,
            media_type: 'tv',
            source_node: node.id,
            connection_type: show.is_guest_appearance ? 'guest' : 'cast'
          }));
        nodeConnections.push(...shows);
      }

      // Process guest appearances with early filtering
      if (node.data.guest_appearances) {
        const guests = node.data.guest_appearances
          .filter(show => show.poster_path && show.id) // Filter early
          .slice(0, Math.floor(maxPerNode / 2)) // Smaller limit for guests
          .map(show => ({
            ...show,
            media_type: 'tv',
            is_guest_appearance: true,
            connection_type: 'guest',
            source_node: node.id
          }));
        nodeConnections.push(...guests);
      }
    } else if (node.type === 'movie' && node.data.credits?.cast) {
      const actors = node.data.credits.cast
        .filter(actor => actor.profile_path && actor.id) // Filter early
        .slice(0, maxPerNode) // Limit early
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id
        }));
      nodeConnections.push(...actors);
    } else if (node.type === 'tv' && node.data.credits?.cast) {
      const actors = node.data.credits.cast
        .filter(actor => actor.profile_path && actor.id) // Filter early
        .slice(0, maxPerNode) // Limit early
        .map(actor => ({
          ...actor,
          media_type: 'person',
          source_node: node.id
        }));
      nodeConnections.push(...actors);

      // Process guest stars with smaller limit
      if (node.data.guest_stars) {
        const guestStars = node.data.guest_stars
          .filter(actor => actor.profile_path && actor.id) // Filter early
          .slice(0, Math.floor(maxPerNode / 2)) // Smaller limit for guests
          .map(actor => ({
            ...actor,
            media_type: 'person',
            is_guest_star: true,
            source_node: node.id
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
  }

  return allConnectableEntities;
};

/**
 * Ultra-fast filtering pipeline with early termination
 */
const optimizeEntityFilteringFast = async (relevantEntities, nodes, filterOptions, maxResults) => {
  const startFilterTime = Date.now();
  
  // Pre-compute board entities for fast lookup
  const existingBoardIds = new Set(nodes.map(node => `${node.type}-${node.data?.id}`));
  
  // Single-pass filtering with early termination
  const processedEntities = [];
  let processedCount = 0;
  
  for (const entity of relevantEntities) {
    // Early termination if we have enough results
    if (processedCount >= maxResults) {
      logger.debug(`🚀 Early termination at ${processedCount} entities`);
      break;
    }
    
    if (!entity?.id) continue;

    // Skip if already on board (fast Set lookup)
    const entityKey = `${entity.media_type}-${entity.id}`;
    if (existingBoardIds.has(entityKey)) continue;

    // Entity already has image (filtered early in extraction)
    processedEntities.push(entity);
    processedCount++;
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
    
    if (finalEntities.length < 200) {
      logger.debug('🔍 Applying full production company filtering');
      finalEntities = await filterEntitiesAdvancedOptimized(finalEntities, {
        ...filterOptions,
        maxResults: Math.min(filterOptions.maxResults || 100, 100), // Cap at 100
        batchSize: 50 // Larger batches
      });
    } else {
      logger.debug('🔍 Applying optimized production company filtering for large dataset');
      // For large datasets, apply filtering but with stricter limits
      finalEntities = await filterEntitiesAdvancedOptimized(finalEntities.slice(0, 300), {
        ...filterOptions,
        maxResults: Math.min(filterOptions.maxResults || 150, 150), // Increased cap for large datasets
        batchSize: 100 // Even larger batches for efficiency
      });
    }
  }

  return finalEntities.slice(0, maxResults);
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