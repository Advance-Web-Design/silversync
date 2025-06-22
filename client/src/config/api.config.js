/**
 * API Configuration
 * 
 * This file centralizes API configuration settings.
 * All API calls now go through the backend for security.
 */

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Get backend URL based on environment
const getBackendUrl = () => {
  // For production, use the environment variable
  if (isProduction) {
    return import.meta.env.VITE_BACKEND_URL || 'https://localhost:3000';
  }
  
  // Check for custom backend URL in development
  if (typeof window !== 'undefined') {
    const customBackendUrl = localStorage.getItem('customBackendUrl');
    if (customBackendUrl) {
      return customBackendUrl;
    }
  }
    // Default development backend URL
  return 'http://localhost:3000';
};

// API Endpoints Configuration
const config = {
  // Base URLs
  tmdb: {
    // Keep these for reference but they won't be used directly
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    // Remove API key and token from client - now handled by backend
  },  // Backend configuration - all calls go through here
  backend: {
    // Backend server URL
    baseUrl: getBackendUrl(),
    
    // Optimized headers for better performance
    defaultHeaders: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',   // Enable compression for faster responses
      'Connection': 'keep-alive',               // Keep connection alive for multiple requests
      'Keep-Alive': 'timeout=30, max=50',       // Keep-alive settings, timeout of 30 seconds, max 50 requests
      'Cache-Control': 'no-cache',              // Disable caching for API responses
      'DNT': '1',                               // DNT = Do Not Track
    },
    
    // Endpoints that map to our backend API routes
    endpoints: {
      person: '/api/tmdb/actor',      // Maps to existing server/app/api/tmdb/actor/[...path]/route.js
      movie: '/api/tmdb/movie',       // Maps to server/app/api/tmdb/movie/[...path]/route.js
      tv: '/api/tmdb/tv-show',        // Maps to existing server/app/api/tmdb/tv-show/[...path]/route.js
      search: '/api/tmdb/search',     // Maps to server/app/api/tmdb/search/[...path]/route.js
      images: '/api/tmdb'             // For image-related endpoints
    }
  },
  // Feature flags - force backend usage
  features: {
    useBackend: import.meta.env.VITE_USE_BACKEND !== 'false', // Default true, can be disabled via env
    cacheResponses: true,
    enableLogging: isDevelopment
  },
  
  // Cache configuration
  cache: {
    ttl: 60000, // 1 minute in milliseconds
    sessionStorageTTL: 6 * 60 * 60 * 1000 // 6 hours in milliseconds
  },
  
  // Image size configuration
  imageSizes: {
    poster: 'w500',
    profile: 'w185',
    backdrop: 'w780',
    small: 'w92',
    medium: 'w185',
    large: 'w500'
  },

  // Performance optimization settings
  performance: {
    enableOptimizations: true,
    requestDeduplication: true,
    resultProcessingOptimized: true
  }
};

// Enhanced fetch function with optimized headers
export const optimizedFetch = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...config.backend.defaultHeaders,
      ...options.headers
    }
  });
};



export default config;