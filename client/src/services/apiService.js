/**
 * API Service
 * 
 * This service provides a consistent interface for making API calls through our backend.
 * All TMDB API calls are proxied through our Next.js backend for security.
 */
import config from '../config/api.config';

/**
 * Make a call to the backend API endpoint
 * 
 * @param {string} endpoint - The TMDB API endpoint to call (e.g., '/movie/550')
 * @param {Object} params - URL parameters for the request
 * @param {Object} options - Additional options for the request
 * @returns {Promise<Object>} - The response data
 */
export const callApi = async (endpoint, params = {}, options = {}) => {
  try {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Build the backend URL - ALL calls go through backend now
    const backendUrl = `${config.backend.baseUrl}/tmdb/${cleanEndpoint}`;
    

    // Build query string from parameters
    const queryString = new URLSearchParams(params).toString();
    const finalUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;
    
    // Set up headers for backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    
    // Make the request to our backend proxy
    const response = await fetch(finalUrl, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}` 
      }));
      throw new Error(`API call failed: ${response.status} - ${errorData.message || errorData.status_message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Backend API call failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Store data in session storage with JSON serialization
 * 
 * @param {string} key - Key to store under
 * @param {any} data - Data to store
 */
export const storeInSession = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing data in session storage:', error);
  }
};

/**
 * Get data from session storage with JSON parsing
 * 
 * @param {string} key - Key to retrieve
 * @returns {any} The stored data or null
 */
export const getFromSession = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error retrieving data from session storage:', error);
    return null;
  }
};

export default {
  callApi,
  storeInSession,
  getFromSession
};