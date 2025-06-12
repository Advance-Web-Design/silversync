/**
 * tmdbUtils.js
 * 
 * Utility functions and constants for working with the TMDB API through our backend.
 * This file contains helper functions for caching, image handling, and data processing.
 */
import config from '../config/api.config';
import { 
  adaptiveResultProcessor, 
  processMultiPageResults, 
  optimizeSearchResults 
} from './apiUtils';

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
 * @param {string} path - The image path from TMDB API response
 * @param {string} type - The image type (poster, profile, backdrop, etc.)
 * @returns {string} - The complete image URL or placeholder
 */
export const getImageUrl = (path, type = 'poster') => {
  if (!path) {
    // Return appropriate placeholder based on type
    switch (type) {
      case 'poster':
        return 'https://via.placeholder.com/342x513/cccccc/666666?text=No+Poster';
      case 'profile':
        return 'https://via.placeholder.com/185x278/cccccc/666666?text=No+Image';
      case 'backdrop':
        return 'https://via.placeholder.com/780x439/cccccc/666666?text=No+Backdrop';
      case 'small':
        return 'https://via.placeholder.com/92x138/cccccc/666666?text=No+Image';
      case 'medium':
        return 'https://via.placeholder.com/185x278/cccccc/666666?text=No+Image';
      case 'large':
        return 'https://via.placeholder.com/500x750/cccccc/666666?text=No+Image';
      default:
        return 'https://via.placeholder.com/500x750/cccccc/666666?text=No+Image';
    }
  }
  
  // Use config for image sizes
  const size = config.imageSizes[type] || 'w500';
  
  // Return direct TMDB image URL (no API key needed)
  return `https://image.tmdb.org/t/p/${size}${path}`;
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
  processBatchedPromises,
  adaptiveResultProcessor,
  processMultiPageResults,
  optimizeSearchResults
};

// export the optimized functions for external use
export { adaptiveResultProcessor, processMultiPageResults, optimizeSearchResults };