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
 */
export const generateCheatSheet = async (nodes, gameStarted, startActors) => {
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
    );
    
    // Filter out entities already on board
    const filteredEntities = filterExistingBoardEntities(uniqueEntities, nodes);    const duration = Date.now() - startTime;
    logger.info(`🎯 Cheat sheet generated: ${filteredEntities.length} entities in ${duration}ms`);
      // Debug: Log some entities for debugging
    const spiderEntities = filteredEntities.filter(e => 
      (e.title || e.name || '').toLowerCase().includes('spider')
    );
    if (spiderEntities.length > 0) {
      logger.debug(`🕷️ Found Spider entities:`, spiderEntities.map(e => e.title || e.name));
    } else {
      logger.debug(`🕷️ No Spider entities found. Sample entities:`, 
        filteredEntities.slice(0, 15).map(e => e.title || e.name)
      );
    }
    
    const thorEntities = filteredEntities.filter(e => 
      (e.title || e.name || '').toLowerCase().includes('thor') ||
      (e.title || e.name || '').toLowerCase().includes('captain')
    );
    if (thorEntities.length > 0) {
      logger.debug(`🔍 Found Thor/Captain entities:`, thorEntities.map(e => e.title || e.name));
    } else {
      logger.debug(`🔍 No Thor/Captain entities found in cache. Sample entities:`, 
        filteredEntities.slice(0, 10).map(e => e.title || e.name)
      );
    }
    
    logger.timeEnd('cheat-sheet-generation');
    
    // Cache the results
    setCachedCheatSheet(filteredEntities, nodes);
    
    return filteredEntities;
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

export const getCachedCheatSheet = (currentBoardState) => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEYS.CHEAT_SHEET);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const currentHash = generateBoardHash(currentBoardState);
    
    // Check if cache is valid (same board state and not expired)
    if (
      cacheData.boardHash === currentHash &&
      Date.now() - cacheData.timestamp < CACHE_DURATION
    ) {
      logger.info('🎯 Using cached cheat sheet');
      return cacheData.entities;
    }
    
    return null;
  } catch (error) {
    logger.error('Error reading cached cheat sheet:', error);
    return null;
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
