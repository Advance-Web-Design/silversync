/**
 * API Service
 * 
 * This service provides a consistent interface for making API calls,
 * abstracting away whether we're calling the TMDB API directly or our backend.
 */
import { makeApiCall, sessionStorageManager } from '../utils/apiUtils';
import config from '../config/api.config';

// TMDB API headers with authorization
const tmdbHeaders = {
  'Authorization': `Bearer ${config.tmdb.apiToken}`,
  'Accept': 'application/json'
};

// Backend API headers if needed
const backendHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Make a call to the appropriate API endpoint based on configuration
 * 
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} params - URL parameters for the request
 * @param {Object} options - Additional options for the request
 * @returns {Promise<Object>} - The response data
 */
export const callApi = async (endpoint, params = {}, options = {}) => {
  if (config.features.useBackend) {
    // Route the request through our backend
    // Map TMDB endpoints to our backend endpoints
    const backendEndpoint = mapToBackendEndpoint(endpoint);
    
    return makeApiCall(
      backendEndpoint,
      params,
      { ...options, headers: { ...backendHeaders, ...options.headers } },
      config.backend.baseUrl
    );
  } else {
    // Direct call to TMDB API
    // Add API key to parameters
    const tmdbParams = { ...params, api_key: config.tmdb.apiKey };
    
    return makeApiCall(
      endpoint,
      tmdbParams,
      { ...options, headers: { ...tmdbHeaders, ...options.headers } },
      config.tmdb.baseUrl
    );
  }
};

/**
 * Maps a TMDB API endpoint to our backend endpoint structure
 * 
 * @param {string} tmdbEndpoint - The original TMDB endpoint
 * @returns {string} - The corresponding backend endpoint
 */
const mapToBackendEndpoint = (tmdbEndpoint) => {
  // Simple mapping example - this would be expanded based on backend API design
  if (tmdbEndpoint.startsWith('/person')) {
    return `${config.backend.endpoints.person}${tmdbEndpoint.replace('/person', '')}`;
  } else if (tmdbEndpoint.startsWith('/movie')) {
    return `${config.backend.endpoints.movie}${tmdbEndpoint.replace('/movie', '')}`;
  } else if (tmdbEndpoint.startsWith('/tv')) {
    return `${config.backend.endpoints.tv}${tmdbEndpoint.replace('/tv', '')}`;
  } else if (tmdbEndpoint.startsWith('/search')) {
    return `${config.backend.endpoints.search}${tmdbEndpoint.replace('/search', '')}`;
  }
  
  // Default case - pass through the endpoint
  return tmdbEndpoint;
};

/**
 * Gets an image URL, either directly from TMDB or via our backend
 * 
 * @param {string} path - The image path from TMDB
 * @param {string} type - The image type (poster, profile, etc.)
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (path, type = 'poster') => {
  if (!path) {
    return `https://via.placeholder.com/500x750?text=No+Image`;
  }
  
  if (config.features.useBackend) {
    // When using a backend, the backend can proxy image requests or serve cached images
    return `${config.backend.baseUrl}${config.backend.endpoints.images}/${type}/${encodeURIComponent(path)}`;
  } else {
    // Direct URL to TMDB images
    const size = config.imageSizes[type] || 'w500';
    return `${config.tmdb.imageBaseUrl}/${size}${path}`;
  }
};

/**
 * Stores data in session storage with timestamp for expiration
 * 
 * @param {string} key - The storage key
 * @param {Object} data - The data to store
 */
export const storeInSession = (key, data) => {
  sessionStorageManager.setItem(key, data);
};

/**
 * Retrieves data from session storage if not expired
 * 
 * @param {string} key - The storage key
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {Object|null} - The stored data or null if not found/expired
 */
export const getFromSession = (key, maxAge = config.cache.sessionStorageTTL) => {
  return sessionStorageManager.getItem(key, maxAge);
};

export default {
  callApi,
  getImageUrl,
  storeInSession,
  getFromSession
};