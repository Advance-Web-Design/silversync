/**
 * Challenge Filtering Utilities
 * 
 * Utility functions for applying challenge-based filtering to movies and TV shows.
 * These functions work with the cached blacklist data in sessionStorage.
 */
import { logger } from './loggerUtils';

/**
 * Get cached blacklists from sessionStorage
 * @returns {Object|null} - Cached blacklists or null if not found
 */
export function getCachedBlacklists() {
  try {
    const cached = sessionStorage.getItem('challengeBlacklists');
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Error reading cached blacklists:', error);
    return null;
  }
}

/**
 * Check if a movie should be filtered out for a given challenge
 * @param {number} movieId - TMDB movie ID
 * @param {string} challengeName - Name of the challenge mode
 * @returns {boolean} - True if movie should be blocked/filtered
 */
export function isMovieBlocked(movieId, challengeName) {
  if (!challengeName) return false;
  
  const blacklists = getCachedBlacklists();
  if (!blacklists || !blacklists[challengeName]) return false;
  
  const challengeData = blacklists[challengeName];
  
  // Handle special case where all movies are blocked
  if (challengeData.blockedMovies === '*') return true;
  
  // Check if movie ID is in the blocked list
  return challengeData.blockedMovies && 
         challengeData.blockedMovies[movieId.toString()];
}

/**
 * Check if a TV show should be filtered out for a given challenge
 * @param {number} tvShowId - TMDB TV show ID
 * @param {string} challengeName - Name of the challenge mode
 * @returns {boolean} - True if TV show should be blocked/filtered
 */
export function isTvShowBlocked(tvShowId, challengeName) {
  if (!challengeName) return false;
  
  const blacklists = getCachedBlacklists();
  if (!blacklists || !blacklists[challengeName]) return false;
  
  const challengeData = blacklists[challengeName];
  
  // Handle special case where all TV shows are blocked
  if (challengeData.blockedTvShows === '*') return true;
  
  // Check if TV show ID is in the blocked list
  return challengeData.blockedTvShows && 
         challengeData.blockedTvShows[tvShowId.toString()];
}

/**
 * Filter an array of entities based on challenge mode
 * @param {Array} entities - Array of movies/TV shows to filter
 * @param {string} challengeName - Name of the challenge mode
 * @returns {Array} - Filtered array with blocked content removed
 */
export function filterEntitiesByChallenge(entities, challengeName) {
  if (!challengeName || !entities || !Array.isArray(entities)) {
    return entities || [];
  }
  
  return entities.filter(entity => {
    if (entity.media_type === 'movie') {
      return !isMovieBlocked(entity.id, challengeName);
    } else if (entity.media_type === 'tv') {
      return !isTvShowBlocked(entity.id, challengeName);
    }
    // Don't filter persons/actors
    return true;
  });
}

/**
 * Get challenge blacklist statistics
 * @param {string} challengeName - Name of the challenge mode
 * @returns {Object|null} - Stats object or null if not found
 */
export function getChallengeStats(challengeName) {
  const blacklists = getCachedBlacklists();
  if (!blacklists || !blacklists[challengeName]) return null;
  
  return blacklists[challengeName].stats || null;
}

/**
 * Check if challenge blacklists are loaded and ready
 * @returns {boolean} - True if blacklists are available
 */
export function areBlacklistsLoaded() {
  const blacklists = getCachedBlacklists();
  return blacklists && Object.keys(blacklists).length > 0;
}

/**
 * List of challenges that require no filtering
 */
export const NO_FILTER_CHALLENGES = ['for-fun', 'classic'];

/**
 * List of challenges that require filtering
 */
export const FILTERABLE_CHALLENGES = [
  'no-marvel', 
  'no-dc', 
  'no-disney', 
  'Nathan', 
  'movies-only', 
  'tv-only'
];

/**
 * Check if a challenge requires filtering
 * @param {string} challengeName - Name of the challenge mode
 * @returns {boolean} - True if challenge requires filtering
 */
export function requiresFiltering(challengeName) {
  return FILTERABLE_CHALLENGES.includes(challengeName);
}
