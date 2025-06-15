/**
 * Cheat Sheet Cache - Consolidated caching and enrichment system
 */

import { getPersonDetails, getMovieDetails, getTvShowDetails } from '../services/tmdbService';
import { fetchConnectableEntitiesFromBoard } from './entityUtils';
import { filterExistingBoardEntities } from './boardUtils';
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

    let relevantEntities = [];
    // Initial game phase: show connections to starting actors
    if (nodes.length <= 2 && startActors.length === 2) {
      logger.debug('🎯 Initial game phase - extracting connections from starting actors');
      for (const node of nodes) {
        if (node.type === 'person' && node.data) {
          logger.debug(`🎭 Processing actor: ${node.data.name}`);

          // Add movie credits
          if (node.data.movie_credits?.cast) {
            const movieCredits = node.data.movie_credits.cast.map(movie => ({
              ...movie,
              media_type: 'movie',
              source_node: node.id
            }));
            logger.debug(`🎬 Found ${movieCredits.length} movies for ${node.data.name}`);
            // Log some movie titles for debugging
            movieCredits.slice(0, 5).forEach(movie => {
              logger.debug(`  📽️ Movie: "${movie.title}"`);
            });
            relevantEntities.push(...movieCredits);
          }
          // Add TV credits
          if (node.data.tv_credits?.cast) {
            const tvCredits = node.data.tv_credits.cast.map(show => ({
              ...show,
              media_type: 'tv',
              source_node: node.id
            }));
            logger.debug(`📺 Found ${tvCredits.length} TV shows for ${node.data.name}`);
            relevantEntities.push(...tvCredits);
          }
        } else if (node.type === 'movie' && node.data) {
          // Add movie cast
          if (node.data.credits?.cast) {
            relevantEntities.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person',
              source_node: node.id
            })));
          }
        } else if (node.type === 'tv' && node.data) {
          // Add TV cast
          if (node.data.credits?.cast) {
            relevantEntities.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person',
              source_node: node.id
            })));
          }
        }
      }
    } else {
      // Advanced game phase: get all connectable entities from board
      const allConnectableEntities = await fetchConnectableEntitiesFromBoard(
        nodes,
        { getPersonDetails, getMovieDetails, getTvShowDetails }
      );
      relevantEntities = allConnectableEntities;
    }

    // Filter for entities with images
    const entitiesWithImages = relevantEntities.filter(entity =>
      entity && entity.id && (
        (entity.media_type === 'movie' && entity.poster_path) ||
        (entity.media_type === 'tv' && entity.poster_path) ||
        (entity.media_type === 'person' && entity.profile_path)
      )
    );

    // Remove duplicates
    const uniqueEntities = entitiesWithImages.filter((entity, index, self) =>
      index === self.findIndex(e => e.id === entity.id && e.media_type === entity.media_type)
    );    // Filter out entities already on board
    const filteredEntities = filterExistingBoardEntities(uniqueEntities, nodes);
      // Apply advanced filtering (controlled by caller)
    let finalEntities = filteredEntities;
    //////! filter movies and tv shows by production companies
    if (filterOptions.enableProductionFiltering || filterOptions.excludeProductionCompanies) {
      logger.debug('🔍 Applying production company filtering');
      finalEntities = await filterEntitiesAdvanced(filteredEntities, {
        excludeProductionCompanies: filterOptions.excludeProductionCompanies || [], // Use caller's choice or no filtering
        minPopularity: filterOptions.minPopularity || 0,
        maxResults: filterOptions.maxResults || null,
        batchSize: filterOptions.batchSize || 10
      });
    } 

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
////////////////////////////// TODO CHECK PRODUCTION COMPANIES //////////////////////////

/**
 * Filter entity by production companies
 * @param {Object} entity - The entity to filter
 * @param {Array} excludeCompanies - Array of company names to exclude (empty array = no filtering)
 * @returns {Promise<boolean>} - Whether the entity should be included (true) or filtered out (false)
 */
export const filterByProductionCompanies = async (entity, excludeCompanies = []) => {
  // Only filter movies and TV shows for production companies
  if (!entity || (entity.media_type !== 'movie' && entity.media_type !== 'tv')) {
    return true; // Keep people and other entities
  }

  // If no companies to exclude, keep all movies and TV shows
  if (!excludeCompanies || excludeCompanies.length === 0) {
    return true; // Keep all movies/TV shows when no exclusions specified
  }

  try {
    // Check if we already have production company data
    if (entity.production_companies && Array.isArray(entity.production_companies)) {
      return !hasExcludedProductionCompany(entity.production_companies, excludeCompanies);
    }

    // Fetch details based on media type
    let details;
    if (entity.media_type === 'movie') {
      details = await getMovieDetails(entity.id);
    } else if (entity.media_type === 'tv') {
      details = await getTvShowDetails(entity.id);
    }

    if (details && details.production_companies && Array.isArray(details.production_companies)) {
      const hasExcludedCompany = hasExcludedProductionCompany(details.production_companies, excludeCompanies);

      if (hasExcludedCompany) {
        logger.debug(`Filtering out ${entity.media_type}: ${entity.title || entity.name} (produced by: ${details.production_companies.map(c => c.name).join(', ')})`);
        return false;
      }
    }

    return true; // Keep the movie/TV show if no excluded companies found

  } catch (error) {
    logger.error(`Error checking production companies for ${entity.title || entity.name}:`, error);
    return true; // Keep the entity if we can't check (fail gracefully)
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
 * Filter entities based on multiple criteria
 * @param {Array} entities - Array of entities to filter
 * @param {Object} filterOptions - Filter configuration
 * @returns {Promise<Array>} - Filtered entities
 */
export const filterEntitiesAdvanced = async (entities, filterOptions = {}) => {
  const {
    excludeProductionCompanies = [], // Default: exclude no companies
    excludeGenres = [],
    minPopularity = 0,
    maxResults = null,
    batchSize = 10
  } = filterOptions;

  if (!entities || entities.length === 0) {
    return [];
  }

  logger.debug(`🔍 Starting advanced filtering on ${entities.length} entities`);
  const startTime = Date.now();

  // Process entities in batches to avoid overwhelming the API
  const filteredEntities = [];

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (entity) => {
      try {
        // Apply production company filter
        if (excludeProductionCompanies.length > 0) {
          const passesProductionFilter = await filterByProductionCompanies(entity, excludeProductionCompanies);
          if (!passesProductionFilter) {
            return null;
          }
        }

        // Apply popularity filter
        if (minPopularity > 0 && (entity.popularity || 0) < minPopularity) {
          return null;
        }

        // Apply genre filter (if implemented in the future)
        if (excludeGenres.length > 0) {
          // This could be expanded to check genres
          // For now, just pass through
        }

        return entity;
      } catch (error) {
        logger.error(`Error filtering entity ${entity.title || entity.name}:`, error);
        return entity; // Keep entity if filtering fails
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter(entity => entity !== null);
    filteredEntities.push(...validResults);

    // Add small delay between batches to be respectful to the API
    if (i + batchSize < entities.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Stop if we've reached maxResults
    if (maxResults && filteredEntities.length >= maxResults) {
      break;
    }
  }

  const finalResults = maxResults ? filteredEntities.slice(0, maxResults) : filteredEntities;
  const duration = Date.now() - startTime;

  logger.debug(`🔍 Advanced filtering complete: ${entities.length} → ${finalResults.length} entities in ${duration}ms`);

  return finalResults;
};

/**
 * Helper function to get production company lists for filtering
 * @param {string|Array} companies - Company filter type(s) or custom array
 * @returns {Array} - Array of company names to exclude
 */
export const getProductionCompaniesToExclude = (companies) => {
  if (!companies) {
    return []; // No filtering by default
  }
  
  if (Array.isArray(companies)) {
    return companies; // Custom array of company names
  }
  
  if (typeof companies === 'string') {
    // Handle multiple company types separated by comma
    const companyTypes = companies.split(',').map(type => type.trim().toUpperCase());
    let allCompanies = [];
    
    companyTypes.forEach(type => {
      if (PRODUCTION_COMPANY_FILTERS[type]) {
        allCompanies.push(...PRODUCTION_COMPANY_FILTERS[type]);
      }
    });
    
    return allCompanies;
  }
  
  return [];
};