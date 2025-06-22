/**
 * Challenge Blacklist Service
 * 
 * Handles fetching and caching challenge blacklists from the backend.
 * Provides O(1) lookup performance for gameplay filtering.
 */
import config from '../config/api.config';
import { logger } from '../utils/loggerUtils';

// Cache keys for session storage
const CACHE_KEYS = {
  BLACKLISTS: 'challengeBlacklists',
  LAST_UPDATED: 'challengeBlacklistsUpdated',
  VERSION: 'challengeBlacklistsVersion'
};

// Cache duration (24 hours in milliseconds)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Current cache version (increment when schema changes)
const CACHE_VERSION = '1.0.0';

/**
 * Available challenge modes that require blacklist filtering
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
 * Challenges that don't need filtering (no blacklists)
 */
export const NO_FILTER_CHALLENGES = [
  'for-fun',
  'classic'
];

/**
 * Fetch blacklist data for a specific challenge from the backend
 * 
 * @param {string} challengeName - The challenge name
 * @returns {Promise<Object>} - The blacklist data
 */
async function fetchChallengeBlacklist(challengeName) {
  try {
    const response = await fetch(`${config.backend.baseUrl}/api/firebase/challenge-data/${challengeName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${challengeName} blacklist: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    logger.debug(`Fetched blacklist for ${challengeName}:`, {
      movies: Object.keys(data.blockedMovies || {}).length,
      tvShows: data.blockedTvShows === '*' ? 'ALL' : Object.keys(data.blockedTvShows || {}).length,
      fetchMethod: data.fetchMethod,
      lastUpdated: data.lastUpdated
    });

    return data;
  } catch (error) {
    logger.error(`Error fetching blacklist for ${challengeName}:`, error);
    throw error;
  }
}

/**
 * Fetch all challenge blacklists from the backend
 * 
 * @returns {Promise<Object>} - Object containing all blacklists keyed by challenge name
 */
async function fetchAllChallengeBlacklists() {
  logger.info('Fetching all challenge blacklists from backend...');
  
  const blacklists = {};
  const errors = [];

  // Fetch all filterable challenges in parallel
  const fetchPromises = FILTERABLE_CHALLENGES.map(async (challengeName) => {
    try {
      const blacklist = await fetchChallengeBlacklist(challengeName);
      blacklists[challengeName] = blacklist;
    } catch (error) {
      errors.push({ challengeName, error: error.message });
      logger.error(`Failed to fetch blacklist for ${challengeName}:`, error);
    }
  });

  await Promise.all(fetchPromises);

  if (errors.length > 0) {
    logger.warn('Some blacklists failed to load:', errors);
    // Continue with partial data - better than failing completely
  }

  logger.info(`Successfully fetched ${Object.keys(blacklists).length}/${FILTERABLE_CHALLENGES.length} challenge blacklists`);
  return blacklists;
}

/**
 * Check if cached blacklists are still valid
 * 
 * @returns {boolean} - True if cache is valid
 */
function isCacheValid() {
  try {
    const cachedVersion = sessionStorage.getItem(CACHE_KEYS.VERSION);
    const lastUpdated = sessionStorage.getItem(CACHE_KEYS.LAST_UPDATED);
    const cachedData = sessionStorage.getItem(CACHE_KEYS.BLACKLISTS);

    // Check version compatibility
    if (cachedVersion !== CACHE_VERSION) {
      logger.info('Cache version mismatch, invalidating cache');
      return false;
    }

    // Check if data exists
    if (!lastUpdated || !cachedData) {
      return false;
    }

    // Check cache age
    const cacheAge = Date.now() - parseInt(lastUpdated);
    if (cacheAge > CACHE_DURATION) {
      logger.info('Cache expired, invalidating cache');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Save blacklists to session storage
 * 
 * @param {Object} blacklists - The blacklists to cache
 */
function saveToCache(blacklists) {
  try {
    sessionStorage.setItem(CACHE_KEYS.BLACKLISTS, JSON.stringify(blacklists));
    sessionStorage.setItem(CACHE_KEYS.LAST_UPDATED, Date.now().toString());
    sessionStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION);
    
    logger.info('Challenge blacklists saved to session storage');
  } catch (error) {
    logger.error('Error saving blacklists to cache:', error);
    // Continue without caching - not critical
  }
}

/**
 * Load blacklists from session storage
 * 
 * @returns {Object|null} - Cached blacklists or null if not available
 */
function loadFromCache() {
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEYS.BLACKLISTS);
    if (!cachedData) return null;

    const blacklists = JSON.parse(cachedData);
    logger.info('Challenge blacklists loaded from session storage');
    return blacklists;
  } catch (error) {
    logger.error('Error loading blacklists from cache:', error);
    return null;
  }
}

/**
 * Clear cached blacklists (useful for testing or force refresh)
 */
export function clearBlacklistCache() {
  try {
    sessionStorage.removeItem(CACHE_KEYS.BLACKLISTS);
    sessionStorage.removeItem(CACHE_KEYS.LAST_UPDATED);
    sessionStorage.removeItem(CACHE_KEYS.VERSION);
    logger.info('Challenge blacklist cache cleared');
  } catch (error) {
    logger.error('Error clearing blacklist cache:', error);
  }
}

/**
 * Load challenge blacklists (from cache or backend)
 * 
 * Main function to be called by the application.
 * Handles caching automatically for optimal performance.
 * 
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 * @returns {Promise<Object>} - Object containing all blacklists keyed by challenge name
 */
export async function loadChallengeBlacklists(forceRefresh = false) {
  try {
    // Check cache first (unless force refresh requested)
    if (!forceRefresh && isCacheValid()) {
      const cachedBlacklists = loadFromCache();
      if (cachedBlacklists) {
        logger.info('Using cached challenge blacklists');
        return cachedBlacklists;
      }
    }

    // Fetch fresh data from backend
    logger.info('Fetching fresh challenge blacklists from backend...');
    const blacklists = await fetchAllChallengeBlacklists();

    // Cache the results
    saveToCache(blacklists);

    return blacklists;
  } catch (error) {
    logger.error('Error loading challenge blacklists:', error);
    
    // Fallback to cache if available, even if expired
    const cachedBlacklists = loadFromCache();
    if (cachedBlacklists) {
      logger.warn('Using stale cached blacklists as fallback');
      return cachedBlacklists;
    }

    throw error;
  }
}

/**
 * Get blacklist for a specific challenge
 * 
 * @param {string} challengeName - The challenge name
 * @returns {Promise<Object|null>} - The blacklist data or null if not found
 */
export async function getChallengeBlacklist(challengeName) {
  // Handle no-filter challenges
  if (NO_FILTER_CHALLENGES.includes(challengeName)) {
    logger.debug(`Challenge ${challengeName} requires no filtering`);
    return null;
  }

  try {
    const allBlacklists = await loadChallengeBlacklists();
    return allBlacklists[challengeName] || null;
  } catch (error) {
    logger.error(`Error getting blacklist for challenge ${challengeName}:`, error);
    return null;
  }
}

/**
 * Check if a movie should be blocked for a challenge
 * 
 * @param {number|string} movieId - The TMDB movie ID
 * @param {string} challengeName - The challenge name
 * @param {Object} blacklists - Pre-loaded blacklists (optional, for performance)
 * @returns {Promise<boolean>} - True if movie should be blocked
 */
export async function isMovieBlocked(movieId, challengeName, blacklists = null) {
  try {
    // Handle no-filter challenges
    if (NO_FILTER_CHALLENGES.includes(challengeName)) {
      return false;
    }

    // Get blacklists (use provided or fetch)
    const allBlacklists = blacklists || await loadChallengeBlacklists();
    const challengeBlacklist = allBlacklists[challengeName];
    
    if (!challengeBlacklist) {
      logger.warn(`No blacklist found for challenge: ${challengeName}`);
      return false;
    }

    // Handle special cases
    if (challengeBlacklist.blockedMovies === '*') {
      return true; // All movies blocked (tv-only mode)
    }

    // Check if movie ID is in blocklist
    return movieId.toString() in challengeBlacklist.blockedMovies;
  } catch (error) {
    logger.error(`Error checking if movie ${movieId} is blocked for ${challengeName}:`, error);
    return false; // Default to allowing if error
  }
}

/**
 * Check if a TV show should be blocked for a challenge
 * 
 * @param {number|string} tvId - The TMDB TV show ID
 * @param {string} challengeName - The challenge name
 * @param {Object} blacklists - Pre-loaded blacklists (optional, for performance)
 * @returns {Promise<boolean>} - True if TV show should be blocked
 */
export async function isTvShowBlocked(tvId, challengeName, blacklists = null) {
  try {
    // Handle no-filter challenges
    if (NO_FILTER_CHALLENGES.includes(challengeName)) {
      return false;
    }

    // Get blacklists (use provided or fetch)
    const allBlacklists = blacklists || await loadChallengeBlacklists();
    const challengeBlacklist = allBlacklists[challengeName];
    
    if (!challengeBlacklist) {
      logger.warn(`No blacklist found for challenge: ${challengeName}`);
      return false;
    }

    // Handle special cases
    if (challengeBlacklist.blockedTvShows === '*') {
      return true; // All TV shows blocked (movies-only mode)
    }

    // Check if TV show ID is in blocklist
    return tvId.toString() in challengeBlacklist.blockedTvShows;
  } catch (error) {
    logger.error(`Error checking if TV show ${tvId} is blocked for ${challengeName}:`, error);
    return false; // Default to allowing if error
  }
}

/**
 * Filter an array of connections based on challenge rules
 * 
 * @param {Array} connections - Array of connection objects with id and type
 * @param {string} challengeName - The challenge name
 * @param {Object} blacklists - Pre-loaded blacklists (optional, for performance)
 * @returns {Promise<Array>} - Filtered array of connections
 */
export async function filterConnectionsByChallenge(connections, challengeName, blacklists = null) {
  try {
    // Handle no-filter challenges
    if (NO_FILTER_CHALLENGES.includes(challengeName)) {
      return connections;
    }

    // Get blacklists (use provided or fetch)
    const allBlacklists = blacklists || await loadChallengeBlacklists();
    
    // Filter connections
    const filteredConnections = [];
    for (const connection of connections) {
      let isBlocked = false;

      if (connection.type === 'movie') {
        isBlocked = await isMovieBlocked(connection.id, challengeName, allBlacklists);
      } else if (connection.type === 'tv') {
        isBlocked = await isTvShowBlocked(connection.id, challengeName, allBlacklists);
      }

      if (!isBlocked) {
        filteredConnections.push(connection);
      }
    }

    logger.debug(`Filtered ${connections.length} connections to ${filteredConnections.length} for challenge ${challengeName}`);
    return filteredConnections;
  } catch (error) {
    logger.error(`Error filtering connections for challenge ${challengeName}:`, error);
    return connections; // Return unfiltered on error
  }
}

/**
 * Get challenge blacklist statistics
 * 
 * @returns {Promise<Object>} - Statistics about loaded blacklists
 */
export async function getBlacklistStats() {
  try {
    const blacklists = await loadChallengeBlacklists();
    
    const stats = {
      totalChallenges: Object.keys(blacklists).length,
      challenges: {}
    };

    for (const [challengeName, blacklist] of Object.entries(blacklists)) {
      stats.challenges[challengeName] = {
        movies: blacklist.blockedMovies === '*' ? 'ALL' : Object.keys(blacklist.blockedMovies || {}).length,
        tvShows: blacklist.blockedTvShows === '*' ? 'ALL' : Object.keys(blacklist.blockedTvShows || {}).length,
        fetchMethod: blacklist.fetchMethod,
        lastUpdated: blacklist.lastUpdated,
        generatedAt: blacklist.generatedAt
      };
    }

    return stats;
  } catch (error) {
    logger.error('Error getting blacklist stats:', error);
    return { error: error.message };
  }
}
