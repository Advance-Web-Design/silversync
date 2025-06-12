/**
 * apiUtils.js
 * 
 * Utilities for API calls and request handling.
 * This module provides a layer of abstraction for API calls,
 * making it easier to switch between direct API calls and a backend service.
 */
import config from '../config/api.config';

// Request caching mechanism
const requestCache = new Map();
const CACHE_TTL = 60000; // Cache entries for 1 minute

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map();

/**
 * Makes an API call with request caching, deduplication, and optimized headers
 * 
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} params - Query parameters to include in the request
 * @param {Object} options - Additional options for the fetch request
 * @param {string} baseUrl - Base URL for the API
 * @returns {Promise<Object>} The JSON response from the API
 * @throws {Error} If the API call fails
 */
export const makeApiCall = async (endpoint, params = {}, options = {}, baseUrl) => {
  const { headers = {}, method = 'GET', body = null } = options;
  
  const url = new URL(`${baseUrl}${endpoint}`);
  
  // Add parameters to the URL
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  const cacheKey = url.toString();
  const now = Date.now();
  
  // Check if we have a cached response
  if (requestCache.has(cacheKey)) {
    const cachedData = requestCache.get(cacheKey);
    if (now - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }

  // REQUEST DEDUPLICATION: Check if same request is already in flight
  if (pendingRequests.has(cacheKey)) {
    // Return the existing promise instead of making a new request
    return pendingRequests.get(cacheKey);
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Merge optimized headers from config with any provided headers
      const optimizedHeaders = {
        ...config.backend.defaultHeaders,
        ...headers
      };
      
      const response = await fetch(url.toString(), { 
        method: method,
        headers: optimizedHeaders,
        body: method !== 'GET' && body ? JSON.stringify(body) : null,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      requestCache.set(cacheKey, {
        timestamp: now,
        data: data
      });
      
      return data;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    } finally {
      // Clean up pending request after completion (success or failure)
      setTimeout(() => {
        pendingRequests.delete(cacheKey);
      }, 100);
    }
  })();

  // Store the promise in pending requests
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

/**
 * Clears the API request cache and pending requests
 */
export const clearApiCache = () => {
  requestCache.clear();
  pendingRequests.clear();
};

/**
 * Gets a cached API response if available
 * 
 * @param {string} cacheKey - The cache key to check
 * @returns {Object|null} The cached data or null if not found/expired
 */
export const getCachedApiResponse = (cacheKey) => {
  if (requestCache.has(cacheKey)) {
    const cachedData = requestCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }
  return null;
};

/**
 * Sets a cached API response
 * 
 * @param {string} cacheKey - The cache key to set
 * @param {Object} data - The data to cache
 */
export const setCachedApiResponse = (cacheKey, data) => {
  requestCache.set(cacheKey, {
    timestamp: Date.now(),
    data
  });
};

/**
 * Checks if a request is currently pending
 * 
 * @param {string} cacheKey - The cache key to check
 * @returns {boolean} True if request is pending
 */
export const isRequestPending = (cacheKey) => {
  return pendingRequests.has(cacheKey);
};

/**
 * Gets the number of pending requests (for debugging)
 * 
 * @returns {number} Number of pending requests
 */
export const getPendingRequestCount = () => {
  return pendingRequests.size;
};

/**
 * Manages browser session storage for API data
 */
export const sessionStorageManager = {
  /**
   * Gets an item from session storage
   * 
   * @param {string} key - The storage key
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Object|null} The stored value or null if not found/expired
   */
  getItem: (key, maxAge = null) => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      
      if (maxAge && Date.now() - timestamp > maxAge) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`Error retrieving ${key} from session storage:`, error);
      return null;
    }
  },
  
  /**
   * Sets an item in session storage
   * 
   * @param {string} key - The storage key
   * @param {Object} data - The data to store
   */
  setItem: (key, data) => {
    try {
      const storageValue = JSON.stringify({
        timestamp: Date.now(),
        data
      });
      sessionStorage.setItem(key, storageValue);
    } catch (error) {
      console.error(`Error storing ${key} in session storage:`, error);
    }
  },
  
  /**
   * Removes an item from session storage
   * 
   * @param {string} key - The storage key
   */
  removeItem: (key) => {
    sessionStorage.removeItem(key);
  }
};

/**
 * Image utilities for handling various image sources
 */
export const imageUtils = {
  /**
   * Gets a fallback image URL
   * 
   * @param {string} type - The image type
   * @returns {string} A placeholder image URL
   */
  getFallbackImageUrl: (type = 'poster') => {
    const dimensions = type === 'poster' ? '500x750' : '185x278';
    return `https://via.placeholder.com/${dimensions}?text=No+Image`;
  }
};

/**
 * OPTIMIZED RESULT PROCESSING
 * Fast, single-pass result filtering and validation
 */

/**
 * Optimized processing for search results with single-pass filtering
 * 
 * @param {Array} results - Raw search results from API
 * @param {Object} options - Processing options
 * @returns {Array} Filtered and validated results
 */
export const optimizeSearchResults = (results, options = {}) => {
  const {
    maxResults = 100,
    requireImages = true,
    removeDuplicates = true
  } = options;

  // Early exit for empty results
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  // Pre-allocate array for better performance
  const validResults = [];
  const seenIds = removeDuplicates ? new Set() : null;
  
  // Single pass filtering with early exits
  for (let i = 0; i < results.length && validResults.length < maxResults; i++) {
    const item = results[i];
    
    // Quick validation checks with early continue
    if (!item?.id) continue;
    
    // Duplicate check
    if (removeDuplicates) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
    }
    
    // Image validation (if required)
    if (requireImages) {
      const hasImage = item.media_type === 'person' ? 
        !!item.profile_path : 
        !!item.poster_path;
      
      if (!hasImage) continue;
    }
    
    // Add to valid results
    validResults.push(item);
  }
  
  return validResults;
};

/**
 * Fast processing for small result sets (< 20 items)
 * Skips complex validation for better performance
 * 
 * @param {Array} results - Raw search results
 * @returns {Array} Minimally processed results
 */
export const fastProcessSmallResults = (results) => {
  // For very small sets, minimal processing
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }
  
  if (results.length <= 10) {
    // Ultra-fast filter for tiny result sets
    return results.filter(item => 
      item?.id && 
      (item.poster_path || item.profile_path)
    );
  }
  
  // Standard optimized processing for small-medium sets
  return optimizeSearchResults(results, { 
    maxResults: 50,
    requireImages: true,
    removeDuplicates: true 
  });
};

/**
 * Processes multiple pages of results efficiently
 * Combines and deduplicates results from multiple API pages
 * 
 * @param {Array} pageResults - Array of page result arrays
 * @param {Object} options - Processing options
 * @returns {Array} Combined and processed results
 */
export const processMultiPageResults = (pageResults, options = {}) => {
  const {
    maxResults = 200,
    requireImages = true
  } = options;

  // Flatten all page results into single array
  const allResults = [];
  const seenIds = new Set();
  
  for (const pageData of pageResults) {
    const pageItems = Array.isArray(pageData) ? pageData : (pageData?.results || []);
    
    for (const item of pageItems) {
      // Quick validation and deduplication
      if (!item?.id || seenIds.has(item.id)) continue;
      
      // Image check
      if (requireImages) {
        const hasImage = item.media_type === 'person' ? 
          !!item.profile_path : 
          !!item.poster_path;
        
        if (!hasImage) continue;
      }
      
      seenIds.add(item.id);
      allResults.push(item);
      
      // Stop if we've hit max results
      if (allResults.length >= maxResults) break;
    }
    
    // Break outer loop if max reached
    if (allResults.length >= maxResults) break;
  }
  
  return allResults;
};

/**
 * Adaptive result processor that chooses the best processing method
 * based on result set size and characteristics
 * 
 * @param {Array|Object} rawResults - Raw API results (array or object with results property)
 * @param {Object} options - Processing options
 * @returns {Array} Optimally processed results
 */
export const adaptiveResultProcessor = (rawResults, options = {}) => {
  // Handle different input formats
  let results;
  if (Array.isArray(rawResults)) {
    results = rawResults;
  } else if (rawResults?.results) {
    results = rawResults.results;
  } else {
    return [];
  }
  
  // Choose processing method based on size
  if (results.length <= 20) {
    return fastProcessSmallResults(results);
  } else if (results.length <= 100) {
    return optimizeSearchResults(results, options);
  } else {
    // For very large sets, limit processing scope
    return optimizeSearchResults(results, { 
      ...options, 
      maxResults: options.maxResults || 150 
    });
  }
};


export default {
  makeApiCall,
  clearApiCache,
  getCachedApiResponse,
  setCachedApiResponse,
  isRequestPending,
  getPendingRequestCount,
  sessionStorageManager,
  imageUtils,
  // New optimized processing functions
  optimizeSearchResults,
  fastProcessSmallResults,
  processMultiPageResults,
  adaptiveResultProcessor,
};