/**
 * API Configuration
 * 
 * This file centralizes API configuration settings.
 * When migrating to a backend, this file will be the primary place to make changes.
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// API Endpoints Configuration
const config = {
  // Base URLs
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    // This will be handled by the backend in the future
    apiKey: 'bdfd168e527a1c86c379e6bb6b7c3a9f',
    apiToken: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZGZkMTY4ZTUyN2ExYzg2YzM3OWU2YmI2YjdjM2E5ZiIsIm5iZiI6MTc0NTEzMzk4OS4wNTMsInN1YiI6IjY4MDRhMWE1NmUxYTc2OWU4MWVlMDg3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Hs2RaAd_2xRcdxTfL0JJkTUhosZFrjLvsUhLaX5rVq8'
  },
  
  // When backend is implemented, we'll switch to this
  backend: {
    // In production, we'd use a relative URL that will be handled by the backend server
    baseUrl: isProduction ? '/api' : 'http://localhost:5000/api',
    // Endpoints that will be available on the backend
    endpoints: {
      person: '/person',
      movie: '/movie',
      tv: '/tv',
      search: '/search',
      images: '/images'
    }
  },
  
  // Feature flags for the service layer
  features: {
    useBackend: false, // Set to true when migrating to backend
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
    poster: 'w500',   // For movie/TV posters
    profile: 'w185',  // For person profiles
    backdrop: 'w780', // For backdrops
    small: 'w92',     // For small thumbnails
    medium: 'w185',   // For medium thumbnails
    large: 'w500'     // For large images
  }
};

export default config;