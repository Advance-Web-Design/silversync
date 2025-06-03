/**
 * apiUtils.js
 * 
 * Utilities for API calls and request handling.
 * This module provides a layer of abstraction for API calls,
 * making it easier to switch between direct API calls and a backend service.
 */

// Request caching mechanism
const requestCache = new Map();
const CACHE_TTL = 60000; // Cache entries for 1 minute

/**
 * Makes an API call with request caching
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

  try {
    const response = await fetch(url.toString(), { 
      method: method,
      headers: headers,
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
  }
};

/**
 * Clears the API request cache
 */
export const clearApiCache = () => {
  requestCache.clear();
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

export default {
  makeApiCall,
  clearApiCache,
  getCachedApiResponse,
  setCachedApiResponse,
  sessionStorageManager,
  imageUtils
};