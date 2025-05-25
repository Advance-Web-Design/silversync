/**
 * API Configuration
 * 
 * This file centralizes API configuration settings.
 * All API calls now go through the backend for security.
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// API Endpoints Configuration
const config = {
  // Base URLs
  tmdb: {
    // Keep these for reference but they won't be used directly
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    // Remove API key and token from client - now handled by backend
  },
  
  // Backend configuration - all calls go through here
  backend: {
    // Backend server URL
    baseUrl: isProduction ? '/api' : 'http://localhost:3000/api',
    // Endpoints that map to our backend API routes
    endpoints: {
      person: '/tmdb/actor',      // Maps to server/app/api/tmdb/actor/[...path]/route.js
      movie: '/tmdb/movie',       // Maps to server/app/api/tmdb/movie/[...path]/route.js
      tv: '/tmdb/tv-show',        // Maps to server/app/api/tmdb/tv-show/[...path]/route.js
      search: '/tmdb/search',     // Maps to server/app/api/tmdb/search/[...path]/route.js
      images: '/tmdb'             // For image-related endpoints
    }
  },
  
  // Feature flags - force backend usage
  features: {
    useBackend: true,          // ALWAYS use backend - no direct TMDB calls
    cacheResponses: true,
    enableLogging: !isProduction
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
  }
};

export default config;