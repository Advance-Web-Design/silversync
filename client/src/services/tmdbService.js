/**
 * tmdbService.js
 * 
 * This file provides a service layer for interacting with The Movie Database (TMDB) API.
 * It handles all API communication including fetching movie/TV/actor data, searching,
 * and retrieving connections between entities for the "Connect the Stars" game.
 */
import { callApi, storeInSession, getFromSession } from './apiService';
import {
  CACHE_TTL,
  SIX_HOURS,
  getValidCachedData,
  setCachedData,
  getImageUrl,
  processMovieResults,
  processTvResults,
  processPersonResults,
  filterValidEntities,
  processBatchedPromises
} from '../utils/tmdbUtils';
import { logger } from '../utils/logger';

// ==================== HELPER FUNCTIONS ====================

/**
 * Generic caching wrapper for API calls
 * @param {string} cacheKey - Cache key
 * @param {Function} apiCall - Function that makes the API call
 * @param {Object} options - Cache options
 * @returns {Promise} - Cached or fresh data
 */
const withCache = async (cacheKey, apiCall, options = {}) => {
  const cachedData = getValidCachedData(cacheKey);
  if (cachedData) return cachedData;
  
  const result = await apiCall();
  setCachedData(cacheKey, result, options);
  return result;
};

/**
 * Generic error handler for TMDB API calls
 * @param {Function} apiCall - The API call function
 * @param {*} fallbackValue - Value to return on error
 * @returns {Promise} - Result or fallback
 */
const withErrorHandling = async (apiCall, fallbackValue) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('TMDB API Error:', error);
    return fallbackValue;
  }
};

/**
 * Processes person details and merges guest appearances
 * @param {Object} personDetails - Base person details
 * @param {Array} guestAppearances - Guest appearances array
 * @returns {Object} - Enhanced person details
 */
const processPersonDetailsWithGuests = (personDetails, guestAppearances) => {
  // Ensure tv_credits structure exists
  if (!personDetails.tv_credits) {
    personDetails.tv_credits = { cast: [] };
  }
  if (!personDetails.tv_credits.cast) {
    personDetails.tv_credits.cast = [];
  }

  // Merge guest appearances if any exist
  if (guestAppearances && guestAppearances.length > 0) {
    const existingTvShowIds = new Set(personDetails.tv_credits.cast.map(show => show.id));
    
    guestAppearances.forEach(guestAppearance => {
      if (!existingTvShowIds.has(guestAppearance.id)) {
        personDetails.tv_credits.cast.push({
          ...guestAppearance,
          is_guest_appearance: true
        });
        existingTvShowIds.add(guestAppearance.id);
      } else {
        // Mark existing credit as guest appearance
        const existingCredit = personDetails.tv_credits.cast.find(c => c.id === guestAppearance.id);
        if (existingCredit) {
          existingCredit.is_guest_appearance = true; 
        }
      }
    });
    
    personDetails.guest_appearances_processed = true;
  }
  
  return personDetails;
};

/**
 * Extracts guest stars from aggregate credits
 * @param {Object} aggregateCredits - TV show aggregate credits
 * @returns {Array} - Processed guest stars
 */
const extractGuestStarsFromAggregateCredits = (aggregateCredits) => {
  if (!aggregateCredits?.cast?.length) return [];
  
  const potentialGuestStars = aggregateCredits.cast.filter(actor => {
    if (!actor.roles?.length) return false;
    
    return actor.roles.some(role => {
      const isLowEpisodeCount = role.episode_count < 3;
      const hasGuestIndicator = role.character?.toLowerCase().includes('guest') || 
        role.character?.toLowerCase().includes('special appearance') ||
        role.character?.toLowerCase().includes('cameo');
        
      return isLowEpisodeCount || hasGuestIndicator;
    });
  });
  
  return potentialGuestStars.map(actor => {
    const primaryRole = actor.roles?.[0];
    
    return {
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path,
      character: primaryRole?.character || 'Guest Star',
      credit_id: primaryRole?.credit_id || actor.credit_id,
      gender: actor.gender,
      popularity: actor.popularity,
      known_for_department: actor.known_for_department,
      episode_count: primaryRole?.episode_count || 1,
      episode_name: 'Various',
      episode_number: 1,
      season_number: 1
    };
  });
};

/**
 * Fetches guest stars from episodes when aggregate credits unavailable
 * @param {number} tvId - TV show ID
 * @param {Object} tvDetails - TV show details
 * @param {number} maxSeasonsToFetch - Max seasons to check
 * @param {number} maxEpisodesPerSeason - Max episodes per season
 * @returns {Array} - Guest stars from episodes
 */
const fetchGuestStarsFromEpisodes = async (tvId, tvDetails, maxSeasonsToFetch, maxEpisodesPerSeason) => {
  const seasons = tvDetails.seasons || [];
  
  // Filter valid seasons and limit to requested count
  const validSeasons = seasons
    .filter(season => season.season_number > 0)
    .slice(0, maxSeasonsToFetch);
  
  if (validSeasons.length === 0) {
    return [];
  }
  
  // Fetch all season details in parallel
  const seasonPromises = validSeasons.map(season => 
    getTvShowSeason(tvId, season.season_number)
  );
  
  const seasonDetails = await Promise.all(seasonPromises);
  
  // Prepare episode batch for parallel fetching
  let episodeBatches = [];
  
  seasonDetails.forEach((seasonData, index) => {
    const episodes = seasonData.episodes || [];
    const limitedEpisodes = episodes.slice(0, maxEpisodesPerSeason);
    
    limitedEpisodes.forEach(episode => {
      episodeBatches.push({
        seasonNumber: validSeasons[index].season_number,
        episodeNumber: episode.episode_number,
        episodeName: episode.name
      });
    });
  });
  
  // Process episodes in batches
  const episodeResults = await processBatchedPromises(
    episodeBatches,
    ep => getTvEpisodeDetails(tvId, ep.seasonNumber, ep.episodeNumber)
      .then(details => ({
        details,
        seasonNumber: ep.seasonNumber,
        episodeName: ep.episodeName,
        episodeNumber: ep.episodeNumber
      })),
    { 
      adaptiveSizing: true,
      delayBetweenBatches: 100 
    }
  );
  
  // Extract guest stars from episode results
  let guestStars = [];
  const processedActorIds = new Set();

  episodeResults.forEach(result => {
    const episodeGuestStars = result.details.guest_stars || [];
    
    episodeGuestStars.forEach(actor => {
      if (!processedActorIds.has(actor.id)) {
        processedActorIds.add(actor.id);
        
        guestStars.push({
          ...actor,
          episode_name: result.episodeName,
          episode_number: result.episodeNumber,
          season_number: result.seasonNumber
        });
      }
    });
  });
  
  return guestStars;
};

/**
 * Processes and normalizes search results
 * @param {Array} results - Raw search results
 * @returns {Array} - Processed and filtered results
 */
const processSearchResults = (results) => {
  if (!results || results.length === 0) return [];
  
  // Normalize media types
  let processedResults = results.map(item => {
    if (!item.media_type) {
      if (item.title && !item.name) {
        return { ...item, media_type: 'movie' };
      } else if (item.name && !item.title && item.first_air_date) {
        return { ...item, media_type: 'tv' };
      } else if (item.name && item.profile_path) {
        return { ...item, media_type: 'person' };
      }
    }
    return item;
  });
  
  // Filter valid media types
  processedResults = processedResults.filter(item => 
    ['movie', 'tv', 'person'].includes(item.media_type)
  );
  
  // Sort by popularity and limit results
  return processedResults
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 20);
};

/**
 * Validates search query
 * @param {string} query - Search query to validate
 * @returns {boolean} - Whether query is valid
 */
const validateSearchQuery = (query) => {
  return query && query.trim().length > 0;
};

/**
 * Creates enhanced guest appearance object
 * @param {Object} credit - Original credit object
 * @param {Object} showDetails - Show details from API
 * @returns {Object} - Enhanced guest appearance
 */
const createGuestAppearanceObject = (credit, showDetails) => ({
  id: credit.id,
  name: credit.name || showDetails.name,
  original_name: credit.original_name || showDetails.original_name,
  poster_path: credit.poster_path || showDetails.poster_path,
  backdrop_path: credit.backdrop_path || showDetails.backdrop_path,
  character: credit.character || 'Guest Appearance',
  episode_count: credit.episode_count || 1,
  first_air_date: credit.first_air_date || showDetails.first_air_date,
  popularity: credit.popularity || showDetails.popularity,
  vote_average: credit.vote_average || showDetails.vote_average,
  vote_count: credit.vote_count || showDetails.vote_count,
  credit_id: credit.credit_id,
  is_guest_appearance: true
});

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Fetches a random popular actor from TMDB
 * Used for generating start actors in the game
 * 
 * @returns {Promise<Object>} Actor details including credits
 * @throws {Error} If no popular people are found or other API errors
 */
export const fetchRandomPerson = async () => {
  return withErrorHandling(
    async () => {
      // Get a list of popular people
      const page = Math.floor(Math.random() * 10) + 1; // Random page between 1 and 10
      const popularPeople = await callApi('/person/popular', { page });
      
      if (!popularPeople.results || popularPeople.results.length === 0) {
        throw new Error('No popular people found');
      }
      
      // Select a random person from the results
      const randomIndex = Math.floor(Math.random() * popularPeople.results.length);
      const randomPersonId = popularPeople.results[randomIndex].id;
      
      // Get detailed information for the random person
      return await getPersonDetails(randomPersonId);
    },
    { error: true, message: 'Failed to fetch random person' }
  );
};

/**
 * Finds potential TV show guest appearances for a specific actor
 * This enhances the data available beyond what the standard TMDB API provides
 * 
 * @param {number} personId - The TMDB ID of the actor to search for
 * @returns {Promise<Array>} - List of TV shows where the person may have made guest appearances
 */
export const findPersonGuestAppearances = async (personId) => {
  return withErrorHandling(
    () => withCache(
      `guest-appearances-${personId}`,
      async () => {
        // Fetch all three API endpoints in parallel
        const [person, personCredits, personPopular] = await Promise.all([
          callApi(`/person/${personId}`),
          callApi(`/person/${personId}/tv_credits`),
          callApi(`/person/${personId}/combined_credits`)
        ]);
        
        // Early exit conditions in case the person is not an actor or has no TV credits
        if (!person.known_for_department || person.known_for_department !== 'Acting') {
          return [];
        }
        
        const regularCreditIds = new Set((personCredits.cast || []).map(show => show.id));
        let potentialGuestAppearances = [];
        
        // Pre-filter to reduce unnecessary API calls
        (personPopular.cast || []).forEach(credit => {
          if (credit.media_type === 'tv' && !regularCreditIds.has(credit.id)) {
            potentialGuestAppearances.push(credit);
          }
        });
        
        // Use batch processing with the utility function
        return await processBatchedPromises(
          potentialGuestAppearances,
          credit => callApi(`/tv/${credit.id}`)
            .then(showDetails => createGuestAppearanceObject(credit, showDetails))
            .catch(err => {
              console.error(`Error fetching show details for ${credit.id}:`, err);
              return null;
            }),
          { batchSize: 10 }
        );
      }
    ),
    []
  );
};

/**
 * Get potential TV shows an actor has guest starred in based on a search query
 * 
 * @param {number} actorId - The TMDB ID of the actor
 * @param {string} query - The search query to filter guest appearances
 * @returns {Promise<Array>} - List of TV shows where the actor has guest appearances
 */
export const searchActorGuestAppearances = async (actorId, query) => {
  return withErrorHandling(
    async () => {
      const guestAppearances = await findPersonGuestAppearances(actorId);
      
      // If there's a search query, filter the results
      if (validateSearchQuery(query)) {
        const normalizedQuery = query.trim().toLowerCase();
        return guestAppearances.filter(show => 
          (show.name && show.name.toLowerCase().includes(normalizedQuery)) ||
          (show.original_name && show.original_name.toLowerCase().includes(normalizedQuery))
        );
      }
      
      return guestAppearances;
    },
    []
  );
};

/**
 * Get person details including movie and TV credits
 * 
 * @param {number} personId - The TMDB ID of the person
 * @returns {Promise<Object>} - The person details including credits
 */
export const getPersonDetails = async (personId) => {
  return withErrorHandling(
    () => withCache(
      `person-details-${personId}`,
      async () => {
        // Get person details and guest appearances in parallel
        const [personDetails, guestAppearances] = await Promise.all([
          callApi(`/person/${personId}`, {
            append_to_response: 'movie_credits,tv_credits,images'
          }),
          findPersonGuestAppearances(personId)
        ]);
        
        return processPersonDetailsWithGuests(personDetails, guestAppearances);
      }
    ),
    { 
      id: personId, 
      name: "Error loading details", 
      movie_credits: { cast: [] }, 
      tv_credits: { cast: [] },
      images: { profiles: [] },
      error: true 
    }
  );
};

/**
 * Get movie details including credits
 * 
 * @param {number} movieId - The TMDB ID of the movie
 * @returns {Promise<Object>} - The movie details including credits
 */
export const getMovieDetails = async (movieId) => {
  return withErrorHandling(
    () => withCache(
      `movie-details-${movieId}`,
      () => callApi(`/movie/${movieId}`, {
        append_to_response: 'credits,images,videos,releases'
      })
    ),
    { id: movieId, error: true }
  );
};

/**
 * Get TV show details including credits
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @returns {Promise<Object>} - The TV show details
 */
export const getTvShowDetails = async (tvId) => {
  return withErrorHandling(
    () => withCache(
      `tv-details-${tvId}`,
      () => callApi(`/tv/${tvId}`, {
        append_to_response: 'aggregate_credits,credits,images,videos'
      })
    ),
    { id: tvId, error: true }
  );
};

/**
 * Get TV show season details
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} seasonNumber - The season number to fetch
 * @returns {Promise<Object>} - The season details including episodes
 */
export const getTvShowSeason = async (tvId, seasonNumber) => {
  return withErrorHandling(
    () => withCache(
      `tv-season-${tvId}-${seasonNumber}`,
      () => callApi(`/tv/${tvId}/season/${seasonNumber}`)
    ),
    { 
      id: tvId,
      season_number: seasonNumber,
      episodes: [],
      error: true 
    }
  );
};

/**
 * Get TV episode details
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} seasonNumber - The season number of the episode
 * @param {number} episodeNumber - The episode number to fetch
 * @returns {Promise<Object>} - The episode details including guest stars
 */
export const getTvEpisodeDetails = async (tvId, seasonNumber, episodeNumber) => {
  return withErrorHandling(
    () => withCache(
      `tv-episode-${tvId}-${seasonNumber}-${episodeNumber}`,
      () => callApi(
        `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, 
        { append_to_response: 'credits,images' }
      )
    ),
    { 
      show_id: tvId,
      season_number: seasonNumber, 
      episode_number: episodeNumber,
      guest_stars: [],
      error: true 
    }
  );
};

/**
 * Get all guest stars across a TV show (across all seasons and episodes)
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} maxSeasonsToFetch - The maximum number of seasons to fetch
 * @param {number} maxEpisodesPerSeason - The maximum number of episodes per season to fetch
 * @returns {Promise<Array>} - List of guest stars across the TV show
 */
export const getTvShowGuestStars = async (tvId, maxSeasonsToFetch = 2, maxEpisodesPerSeason = 5) => {
  return withErrorHandling(
    () => withCache(
      `tv-guest-stars-${tvId}-${maxSeasonsToFetch}-${maxEpisodesPerSeason}`,
      async () => {
        // Get TV show details to try aggregate_credits first
        const tvDetails = await getTvShowDetails(tvId);
        
        // Try to use aggregate_credits first (much more efficient)
        if (tvDetails.aggregate_credits?.cast?.length > 0) {
          console.log(`Using aggregate_credits for TV show ${tvId}`);
          
          const guestStars = extractGuestStarsFromAggregateCredits(tvDetails.aggregate_credits);
          
          if (guestStars.length > 0) {
            return guestStars;
          }
        }
        
        // If we couldn't extract from aggregate_credits, fallback to episode-by-episode approach
        console.log(`Falling back to episode fetching for TV show ${tvId}`);
        return await fetchGuestStarsFromEpisodes(tvId, tvDetails, maxSeasonsToFetch, maxEpisodesPerSeason);
      }
    ),
    []
  );
};

/**
 * Check if an actor has appeared in a TV show (including guest appearances)
 * 
 * @param {number} actorId - The TMDB ID of the actor
 * @param {number} tvShowId - The TMDB ID of the TV show
 * @returns {Promise<Object>} - Object indicating if the actor appears and their role
 */
export const checkActorInTvShow = async (actorId, tvShowId) => {
  return withErrorHandling(
    () => withCache(
      `actor-in-show-${actorId}-${tvShowId}`,
      async () => {
        // Fetch both API endpoints in parallel
        const [tvCredits, combinedCredits] = await Promise.all([
          callApi(`/person/${actorId}/tv_credits`),
          callApi(`/person/${actorId}/combined_credits`)
        ]);
        
        // Check regular cast credits
        if (tvCredits.cast?.some(show => show.id === tvShowId)) {
          return { appears: true, role: 'cast' };
        }
        
        // Check guest appearances
        const tvAppearances = combinedCredits.cast ? 
          combinedCredits.cast.filter(c => c.media_type === 'tv') : [];
        
        if (tvAppearances.some(show => show.id === tvShowId)) {
          return { appears: true, role: 'guest' };
        }
        
        return { appears: false };
      }
    ),
    { appears: false, error: true }
  );
};

/**
 * Search for movies, TV shows, and people
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array>} - List of search results across movies, TV shows, and people
 */
export const searchMulti = async (query, maxPages = 1) => {
  const cacheKey = `search-multi-${query.trim()}-pages-${maxPages}`;
  
  return withCache(cacheKey, async () => {
    const allResults = [];
    const startTime = Date.now();
    logger.time(`api-search-${query.slice(0, 10)}`);
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const results = await callApi('/search/multi', {
          query: query.trim(),
          include_adult: false,
          page: page
        });
        
        if (!results.results || results.results.length === 0) {
          logger.debug(`📄 Page ${page}: No more results`);
          break;
        }
        
        logger.debug(`📄 Page ${page}: Found ${results.results.length} results`);
        allResults.push(...results.results);
        
        if (page >= results.total_pages) {
          logger.debug(`📄 Reached last page: ${results.total_pages}`);
          break;
        }
      } catch (error) {
        logger.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`📡 API Search "${query}": ${allResults.length} results from ${maxPages} page(s) in ${duration}ms`);
    logger.timeEnd(`api-search-${query.slice(0, 10)}`);
    
    return processSearchResults(allResults || []);
  });
};

/**
 * Search specifically for people/actors
 * 
 * @param {string} query - The search query
 * @param {number} page - The page number to fetch
 * @returns {Promise<Object>} - The search results including pagination info
 */
export const searchPeople = async (query, page = 1) => {
  if (!validateSearchQuery(query)) {
    return { results: [], page: 1, total_pages: 1 };
  }
  
  return withErrorHandling(
    () => withCache(
      `search-people-${query.trim()}-${page}`,
      async () => {
        const response = await callApi('/search/person', { 
          query: query.trim(),
          include_adult: false,
          page: page
        });
        
        return {
          results: response.results || [],
          page: response.page || 1,
          total_pages: response.total_pages || 1
        };
      }
    ),
    { results: [], page: 1, total_pages: 1 }
  );
};

/**
 * Fetch popular entities (movies, TV shows, actors) for spell checking database
 * 
 * @param {number} moviePages - The number of pages of popular movies to fetch
 * @param {number} tvPages - The number of pages of popular TV shows to fetch
 * @param {number} personPages - The number of pages of popular people to fetch
 * @returns {Promise<Array>} - List of popular entities
 */
export const fetchPopularEntities = async () => {
  try {
    // Define how many pages to fetch for each media type
    const moviePages = 10;
    const tvPages = 10; 
    const personPages = 10;
    
    // Prepare movie requests
    const moviePromises = Array.from({ length: moviePages }, (_, i) => 
      callApi('/movie/popular', { page: i + 1 })
    );
    
    // Prepare TV requests
    const tvPromises = Array.from({ length: tvPages }, (_, i) => 
      callApi('/tv/popular', { page: i + 1 })
    );
    
    // Prepare person requests
    const personPromises = Array.from({ length: personPages }, (_, i) => 
      callApi('/person/popular', { page: i + 1 })
    );
    
    // Execute all requests in parallel by media type
    const [movieResults, tvResults, personResults] = await Promise.all([
      Promise.all(moviePromises),
      Promise.all(tvPromises),
      Promise.all(personPromises)
    ]);
    
    // Process results using utility functions from tmdbUtils
    const movieEntities = processMovieResults(movieResults);
    const tvEntities = processTvResults(tvResults);
    const personEntities = processPersonResults(personResults);
    
    // Combine all entities
    const allEntities = [...movieEntities, ...tvEntities, ...personEntities];
    
    // Filter entities and ensure they have required fields
    const filteredEntities = filterValidEntities(allEntities);
    
    return filteredEntities;
  } catch (error) {
    console.error('Error fetching popular entities:', error);
    return [];
  }
};

// Export the getImageUrl directly from tmdbUtils
export { getImageUrl };

/**
 * Backward compatibility function to maintain existing code
 * Simply returns the direct URL now
 * @param {string} path - The image path
 * @param {string} type - The image type (poster, profile, etc.)
 * @returns {string} - The image URL
 */
export const getImageUrlSync = (path, type = 'poster') => {
  return getImageUrl(path, type);
};

export default {
  fetchRandomPerson,
  getPersonDetails,
  getMovieDetails,
  getTvShowDetails,
  getTvShowSeason,
  getTvEpisodeDetails,
  getTvShowGuestStars,
  findPersonGuestAppearances,
  searchActorGuestAppearances,
  checkActorInTvShow,
  searchMulti,
  searchPeople,
  fetchPopularEntities,
  getImageUrl,
  getImageUrlSync
};