/**
 * tmdbUtils.js
 * 
 * Utility functions and constants for working with the TMDB API.
 * This file contains helper functions for caching, image handling, and data processing
 * to keep the main tmdbService.js file cleaner and more focused.
 */
import { getImageUrl as getApiImageUrl } from '../services/apiService';
import config from '../config/api.config';

// Constants
export const CACHE_TTL = config.cache.ttl;
export const SIX_HOURS = 6 * 60 * 60 * 1000;

// Initialize request cache for specialized caching
export const requestCache = new Map();

/**
 * Helper function to check if a value is cached and still valid
 * 
 * @param {string} key - The cache key to check
 * @param {Map} cache - The cache object to check in (defaults to requestCache)
 * @returns {Object|null} - The cached data if valid, null otherwise
 */
export const getValidCachedData = (key, cache = requestCache) => {
  if (cache.has(key)) {
    const cachedData = cache.get(key);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }
  return null;
};

/**
 * Helper function to store data in cache with timestamp
 * 
 * @param {string} key - The cache key
 * @param {any} data - The data to cache
 * @param {Object} options - Additional options
 * @param {Map} cache - The cache object to store in (defaults to requestCache)
 */
export const setCachedData = (key, data, options = {}, cache = requestCache) => {
  cache.set(key, {
    timestamp: Date.now(),
    data,
    ...options
  });
};

/**
 * Gets the full image URL for TMDB images with fallback
 * 
 * @param {string} path - The image path
 * @param {string} type - The image type (poster, profile, etc.)
 * @returns {string} - The image URL
 */
export const getImageUrl = (path, type = 'poster') => {
  if (!path) {
    // Return appropriate placeholder based on image type
    switch (type) {
      case 'poster':
        return 'https://via.placeholder.com/342x513?text=No+Poster';
      case 'profile':
        return 'https://via.placeholder.com/185x278?text=No+Image';
      case 'backdrop':
        return 'https://via.placeholder.com/780x439?text=No+Backdrop';
      default:
        return 'https://via.placeholder.com/500x750?text=No+Image';
    }
  }
  
  return getApiImageUrl(path, type);
};

/**
 * Process movie results into standardized entities
 * 
 * @param {Array} movieResults - Array of movie result pages
 * @returns {Array} - Processed movie entities
 */
export const processMovieResults = (movieResults) => {
  let entities = [];
  
  movieResults.forEach(popularMovies => {
    const movieEntities = popularMovies.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      name: movie.title, // Duplicate as name for consistency in search
      original_title: movie.original_title,
      poster_path: movie.poster_path,
      media_type: 'movie',
      popularity: movie.popularity,
      release_date: movie.release_date
    }));
    entities = [...entities, ...movieEntities];
  });
  
  return entities;
};

/**
 * Process TV show results into standardized entities
 * 
 * @param {Array} tvResults - Array of TV result pages
 * @returns {Array} - Processed TV show entities
 */
export const processTvResults = (tvResults) => {
  let entities = [];
  
  tvResults.forEach(popularTv => {
    const tvEntities = popularTv.results.map(show => ({
      id: show.id,
      name: show.name,
      title: show.name, // Duplicate as title for consistency in search
      original_name: show.original_name,
      poster_path: show.poster_path,
      media_type: 'tv',
      popularity: show.popularity,
      first_air_date: show.first_air_date
    }));
    entities = [...entities, ...tvEntities];
  });
  
  return entities;
};

/**
 * Process person results into standardized entities
 * 
 * @param {Array} personResults - Array of person result pages
 * @returns {Array} - Processed person entities
 */
export const processPersonResults = (personResults) => {
  let entities = [];
  
  personResults.forEach(popularPeople => {
    const personEntities = popularPeople.results.map(person => ({
      id: person.id,
      name: person.name,
      profile_path: person.profile_path,
      media_type: 'person',
      popularity: person.popularity,
      known_for_department: person.known_for_department,
      known_for: person.known_for
    }));
    entities = [...entities, ...personEntities];
  });
  
  return entities;
};

/**
 * Filter entities to ensure they have required fields
 * 
 * @param {Array} entities - Array of entities to filter
 * @returns {Array} - Filtered entities
 */
export const filterValidEntities = (entities) => {
  return entities.filter(entity => (
    entity && entity.id && 
    ((entity.media_type === 'person' && entity.profile_path) || 
     (entity.media_type !== 'person' && entity.poster_path))
  ));
};

/**
 * Creates batched promises with adaptive batch sizes and rate limiting
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} promiseFactory - Function that creates a promise for an item
 * @param {Object} options - Options for batching
 * @param {number} options.batchSize - Size of each batch (default: 5)
 * @param {number} options.delayBetweenBatches - Delay in ms between batches (default: 100)
 * @returns {Promise<Array>} - Results from all batched promises
 */
export const processBatchedPromises = async (items, promiseFactory, options = {}) => {
  const { 
    batchSize = 5, 
    delayBetweenBatches = 100,
    adaptiveSizing = true
  } = options;
  
  if (items.length === 0) {
    return [];
  }
  
  // Determine actual batch size based on total items if adaptive sizing is enabled
  let actualBatchSize = batchSize;
  
  if (adaptiveSizing) {
    if (items.length <= batchSize) {
      actualBatchSize = items.length;
    } else if (items.length <= batchSize * 2) {
      actualBatchSize = Math.ceil(items.length / 2);
    }
  }
  
  let results = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += actualBatchSize) {
    // Add delay between batches except for the first one
    if (i > 0 && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
    
    const batch = items.slice(i, i + actualBatchSize);
    const batchPromises = batch.map(promiseFactory);
    
    const batchResults = await Promise.all(batchPromises);
    results = [...results, ...batchResults.filter(Boolean)];
  }
  
  return results;
};

export default {
  requestCache,
  CACHE_TTL,
  SIX_HOURS,
  getValidCachedData,
  setCachedData,
  getImageUrl,
  processMovieResults,
  processTvResults,
  processPersonResults,
  filterValidEntities,
  processBatchedPromises
};