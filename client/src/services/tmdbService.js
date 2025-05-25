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

/**
 * Fetches a random popular actor from TMDB
 * Used for generating start actors in the game
 * 
 * @returns {Promise<Object>} Actor details including credits
 * @throws {Error} If no popular people are found or other API errors
 */
export const fetchRandomPerson = async () => {
  try {
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
  } catch (error) {
    console.error('Error fetching random person:', error);
    throw error;
  }
};

/**
 * Finds potential TV show guest appearances for a specific actor
 * This enhances the data available beyond what the standard TMDB API provides
 * 
 * @param {number} personId - The TMDB ID of the actor to search for
 * @returns {Promise<Array>} - List of TV shows where the person may have made guest appearances
 */
export const findPersonGuestAppearances = async (personId) => {
  try {
    // Check cache first
    const cacheKey = `guest-appearances-${personId}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Fetch all three API endpoints in parallel
    const [person, personCredits, personPopular] = await Promise.all([
      callApi(`/person/${personId}`),
      callApi(`/person/${personId}/tv_credits`),
      callApi(`/person/${personId}/combined_credits`)
    ]);
    
    // Early exit conditions in case the person is not an actor or has no TV credits
    if (!person.known_for_department || person.known_for_department !== 'Acting') {
      setCachedData(cacheKey, []);
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
    const guestAppearances = await processBatchedPromises(
      potentialGuestAppearances,
      credit => callApi(`/tv/${credit.id}`)
        .then(showDetails => ({
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
        }))
        .catch(err => {
          console.error(`Error fetching show details for ${credit.id}:`, err);
          return null;
        }),
      { batchSize: 10 }
    );
    
    // Cache the results
    setCachedData(cacheKey, guestAppearances);
    return guestAppearances;
  } catch (error) {
    console.error('Error finding guest appearances:', error);
    return [];
  }
};

/**
 * Get potential TV shows an actor has guest starred in based on a search query
 * 
 * @param {number} actorId - The TMDB ID of the actor
 * @param {string} query - The search query to filter guest appearances
 * @returns {Promise<Array>} - List of TV shows where the actor has guest appearances
 */
export const searchActorGuestAppearances = async (actorId, query) => {
  try {
    const guestAppearances = await findPersonGuestAppearances(actorId);
    
    // If there's a search query, filter the results
    if (query && query.trim()) {
      const normalizedQuery = query.trim().toLowerCase();
      return guestAppearances.filter(show => 
        (show.name && show.name.toLowerCase().includes(normalizedQuery)) ||
        (show.original_name && show.original_name.toLowerCase().includes(normalizedQuery))
      );
    }
    
    return guestAppearances;
  } catch (error) {
    console.error('Error searching guest appearances:', error);
    return [];
  }
};

/**
 * Get person details including movie and TV credits
 * 
 * @param {number} personId - The TMDB ID of the person
 * @returns {Promise<Object>} - The person details including credits
 */
export const getPersonDetails = async (personId) => {
  try {
    // Check cache first
    const cacheKey = `person-details-${personId}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Get person details and guest appearances in parallel
    const [personDetails, guestAppearances] = await Promise.all([
      callApi(`/person/${personId}`, {
        append_to_response: 'movie_credits,tv_credits,images'
      }),
      findPersonGuestAppearances(personId)
    ]);
    
    // Ensure tv_credits and tv_credits.cast exist
    if (!personDetails.tv_credits) {
      personDetails.tv_credits = { cast: [] };
    }
    if (!personDetails.tv_credits.cast) {
      personDetails.tv_credits.cast = [];
    }

    // If we found any guest appearances, merge them into the tv_credits.cast
    if (guestAppearances && guestAppearances.length > 0) {
      const existingTvShowIds = new Set(personDetails.tv_credits.cast.map(show => show.id));
      
      guestAppearances.forEach(guestAppearance => {
        // Only add if it's not already in the main cast credits and ensure it's marked as a guest appearance
        if (!existingTvShowIds.has(guestAppearance.id)) {
          personDetails.tv_credits.cast.push({
            ...guestAppearance,
            is_guest_appearance: true
          });
          existingTvShowIds.add(guestAppearance.id);
        } else {
          // If it's already in tv_credits, mark it as having a guest appearance
          const existingCredit = personDetails.tv_credits.cast.find(c => c.id === guestAppearance.id);
          if (existingCredit) {
            existingCredit.is_guest_appearance = true; 
          }
        }
      });
      
      // Add a property to indicate we've processed guest appearances
      personDetails.guest_appearances_processed = true;
    }
    
    // Cache the results
    setCachedData(cacheKey, personDetails);
    return personDetails;
  } catch (error) {
    console.error('Error getting person details:', error);
    
    // Fall back to standard API call if enhanced version fails
    try {
      const fallbackDetails = await callApi(`/person/${personId}`, {
        append_to_response: 'movie_credits,tv_credits,images'
      });
      
      if (!fallbackDetails.tv_credits) {
        fallbackDetails.tv_credits = { cast: [] };
      }
      if (!fallbackDetails.tv_credits.cast) {
        fallbackDetails.tv_credits.cast = [];
      }
      
      return fallbackDetails;
    } catch (fallbackError) {
      console.error('Fallback person details error:', fallbackError);
      return { 
        id: personId, 
        name: "Error loading details", 
        movie_credits: { cast: [] }, 
        tv_credits: { cast: [] },
        images: { profiles: [] },
        error: true 
      };
    }
  }
};

/**
 * Get movie details including credits
 * 
 * @param {number} movieId - The TMDB ID of the movie
 * @returns {Promise<Object>} - The movie details including credits
 */
export const getMovieDetails = async (movieId) => {
  try {
    // Check cache first
    const cacheKey = `movie-details-${movieId}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Get movie details with credits and images
    const movieDetails = await callApi(`/movie/${movieId}`, {
      append_to_response: 'credits,images,videos,releases'
    });
    
    // Cache the results
    setCachedData(cacheKey, movieDetails);
    return movieDetails;
  } catch (error) {
    console.error('Error getting movie details:', error);
    return { id: movieId, error: true };
  }
};

/**
 * Get TV show details including credits
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @returns {Promise<Object>} - The TV show details
 */
export const getTvShowDetails = async (tvId) => {
  try {
    // Check cache first
    const cacheKey = `tv-details-${tvId}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Get TV show details with aggregate credits (useful for guest stars)
    const tvDetails = await callApi(`/tv/${tvId}`, {
      append_to_response: 'aggregate_credits,credits,images,videos'
    });
    
    // Cache the results
    setCachedData(cacheKey, tvDetails);
    return tvDetails;
  } catch (error) {
    console.error('Error getting TV show details:', error);
    return { id: tvId, error: true };
  }
};

/**
 * Get TV show season details
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} seasonNumber - The season number to fetch
 * @returns {Promise<Object>} - The season details including episodes
 */
export const getTvShowSeason = async (tvId, seasonNumber) => {
  try {
    // Check cache first
    const cacheKey = `tv-season-${tvId}-${seasonNumber}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Get season details
    const seasonDetails = await callApi(`/tv/${tvId}/season/${seasonNumber}`);
    
    // Cache the results
    setCachedData(cacheKey, seasonDetails);
    return seasonDetails;
  } catch (error) {
    console.error(`Error getting TV season ${seasonNumber} for show ${tvId}:`, error);
    return { 
      id: tvId,
      season_number: seasonNumber,
      episodes: [],
      error: true 
    };
  }
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
  try {
    // Check cache first
    const cacheKey = `tv-episode-${tvId}-${seasonNumber}-${episodeNumber}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Get episode details with credits
    const episodeDetails = await callApi(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, 
      { append_to_response: 'credits,images' }
    );
    
    // Cache the results
    setCachedData(cacheKey, episodeDetails);
    return episodeDetails;
  } catch (error) {
    console.error(`Error getting TV episode S${seasonNumber}E${episodeNumber} for show ${tvId}:`, error);
    return { 
      show_id: tvId,
      season_number: seasonNumber, 
      episode_number: episodeNumber,
      guest_stars: [],
      error: true 
    };
  }
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
  try {
    // Check cache first
    const cacheKey = `tv-guest-stars-${tvId}-${maxSeasonsToFetch}-${maxEpisodesPerSeason}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;

    // Get TV show details to try aggregate_credits first
    const tvDetails = await getTvShowDetails(tvId);
    
    // Try to use aggregate_credits first (much more efficient)
    if (tvDetails.aggregate_credits && 
        tvDetails.aggregate_credits.cast && 
        tvDetails.aggregate_credits.cast.length > 0) {
      
      console.log(`Using aggregate_credits for TV show ${tvId}`);
      
      // Find potential guest stars based on episode count and character
      const potentialGuestStars = tvDetails.aggregate_credits.cast.filter(actor => {
        if (!actor.roles || actor.roles.length === 0) return false;
        
        return actor.roles.some(role => {
          // Consider as guest star if less than 3 episodes or character contains guest-related terms
          const isLowEpisodeCount = role.episode_count < 3;
          const hasGuestIndicator = role.character && 
            (role.character.toLowerCase().includes('guest') || 
             role.character.toLowerCase().includes('special appearance') ||
             role.character.toLowerCase().includes('cameo'));
             
          return isLowEpisodeCount || hasGuestIndicator;
        });
      });
      
      if (potentialGuestStars.length > 0) {
        const guestStars = potentialGuestStars.map(actor => {
          // Get the first role (most significant or recent)
          const primaryRole = actor.roles && actor.roles.length > 0 ? actor.roles[0] : null;
          
          return {
            id: actor.id,
            name: actor.name,
            profile_path: actor.profile_path,
            character: primaryRole?.character || 'Guest Star',
            credit_id: primaryRole?.credit_id || actor.credit_id,
            gender: actor.gender,
            popularity: actor.popularity,
            known_for_department: actor.known_for_department,
            // Add episode info from the role when available
            episode_count: primaryRole?.episode_count || 1,
            episode_name: 'Various',
            episode_number: 1,
            season_number: 1
          };
        });
        
        // Cache the results
        setCachedData(cacheKey, guestStars, { source: 'aggregate_credits' });
        return guestStars;
      }
    }
    
    // If we couldn't extract from aggregate_credits, fallback to episode-by-episode approach
    console.log(`Falling back to episode fetching for TV show ${tvId}`);
    
    const seasons = tvDetails.seasons || [];
    
    // Filter valid seasons and limit to requested count
    const validSeasons = seasons
      .filter(season => season.season_number > 0)
      .slice(0, maxSeasonsToFetch);
    
    // If no valid seasons, return empty array
    if (validSeasons.length === 0) {
      const emptyResult = [];
      setCachedData(cacheKey, emptyResult, { source: 'no_seasons' });
      return emptyResult;
    }
    
    // Fetch all season details in parallel
    const seasonPromises = validSeasons.map(season => 
      getTvShowSeason(tvId, season.season_number)
    );
    
    const seasonDetails = await Promise.all(seasonPromises);
    
    // Prepare episode batch for parallel fetching
    let episodeBatches = [];
    
    // Build the episode list to fetch
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
    
    // Use the batched promise utility for efficient fetching
    let guestStars = [];
    const processedActorIds = new Set();

    // Extract guest stars from episode results
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
    
    // Cache the results
    setCachedData(cacheKey, guestStars, { source: 'episode_details' });
    return guestStars;
  } catch (error) {
    console.error('Error fetching guest stars:', error);
    return [];
  }
};

/**
 * Check if an actor has appeared in a TV show (including guest appearances)
 * 
 * @param {number} actorId - The TMDB ID of the actor
 * @param {number} tvShowId - The TMDB ID of the TV show
 * @returns {Promise<Object>} - Object indicating if the actor appears and their role
 */
export const checkActorInTvShow = async (actorId, tvShowId) => {
  try {
    // Check cache first
    const cacheKey = `actor-in-show-${actorId}-${tvShowId}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Fetch both API endpoints in parallel
    const [tvCredits, combinedCredits] = await Promise.all([
      callApi(`/person/${actorId}/tv_credits`),
      callApi(`/person/${actorId}/combined_credits`)
    ]);
    
    // Check regular cast credits
    if (tvCredits.cast && tvCredits.cast.some(show => show.id === tvShowId)) {
      const result = { appears: true, role: 'cast' };
      setCachedData(cacheKey, result);
      return result;
    }
    
    // Check guest appearances
    const tvAppearances = combinedCredits.cast ? 
      combinedCredits.cast.filter(c => c.media_type === 'tv') : [];
    
    if (tvAppearances.some(show => show.id === tvShowId)) {
      const result = { appears: true, role: 'guest' };
      setCachedData(cacheKey, result);
      return result;
    }
    
    // If no appearances found, return false
    const result = { appears: false };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error checking actor in TV show:', error);
    return { appears: false, error: error.message };
  }
};

/**
 * Search for movies, TV shows, and people
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array>} - List of search results across movies, TV shows, and people
 */
export const searchMulti = async (query) => {
  try {
    if (!query || !query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim();
    
    // Check cache first
    const cacheKey = `search-multi-${trimmedQuery}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Search across all types in parallel
    const results = await callApi('/search/multi', {
      query: trimmedQuery,
      include_adult: false,
      page: 1
    });
    
    if (!results.results || results.results.length === 0) {
      return [];
    }
    
    // Process results
    let processedResults = results.results.map(item => {
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
    
    // Filter out results with no media type or unknown media types
    processedResults = processedResults.filter(item => 
      item.media_type === 'movie' || 
      item.media_type === 'tv' || 
      item.media_type === 'person'
    );
    
    // Sort by popularity
    processedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
    // Limit to a reasonable number of results
    const finalResults = processedResults.slice(0, 20);
    
    // Cache the results
    setCachedData(cacheKey, finalResults);
    return finalResults;
  } catch (error) {
    console.error('Error in searchMulti:', error);
    return [];
  }
};

/**
 * Search specifically for people/actors
 * 
 * @param {string} query - The search query
 * @param {number} page - The page number to fetch
 * @returns {Promise<Object>} - The search results including pagination info
 */
export const searchPeople = async (query, page = 1) => {
  try {
    if (!query || !query.trim()) {
      return { results: [], page: 1, total_pages: 1 };
    }
    
    // Check cache first for this specific page
    const cacheKey = `search-people-${query.trim()}-${page}`;
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Search for people
    const response = await callApi('/search/person', { 
      query: query.trim(),
      include_adult: false,
      page: page
    });
    
    const result = {
      results: response.results || [],
      page: response.page || 1,
      total_pages: response.total_pages || 1
    };
    
    // Cache the results
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in searchPeople:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * Fetch popular entities (movies, TV shows, actors) for spell checking database
 * 
 * @param {number} moviePages - The number of pages of popular movies to fetch
 * @param {number} tvPages - The number of pages of popular TV shows to fetch
 * @param {number} personPages - The number of pages of popular people to fetch
 * @returns {Promise<Array>} - List of popular entities
 */
export const fetchPopularEntities = async (moviePages = 3, tvPages = 3, personPages = 3) => {
  try {
    console.log('Fetching popular entities for spell checking database...');
    
    // Check if we have cached entities in session storage
    const cachedEntities = getFromSession('popularEntities');
    const lastFetchTime = getFromSession('popularEntitiesLastFetch');
    
    if (cachedEntities && lastFetchTime && 
        (Date.now() - parseInt(lastFetchTime)) < SIX_HOURS) {
      console.log('Using cached popular entities from session storage');
      return cachedEntities;
    }
    
    // Create arrays of promises for each page request
    const moviePromises = Array.from({ length: moviePages }, (_, i) => 
      callApi('/movie/popular', { page: i + 1 })
    );
    
    const tvPromises = Array.from({ length: tvPages }, (_, i) => 
      callApi('/tv/popular', { page: i + 1 })
    );
    
    const personPromises = Array.from({ length: personPages }, (_, i) => 
      callApi('/person/popular', { page: i + 1 })
    );
    
    // Execute all requests in parallel by media type
    console.log(`Fetching ${moviePages} movie pages, ${tvPages} TV pages, and ${personPages} person pages in parallel`);
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
    
    console.log(`Fetched ${filteredEntities.length} unique entities for spell checking`);
    
    // Store in session storage
    storeInSession('popularEntities', filteredEntities);
    storeInSession('popularEntitiesLastFetch', Date.now().toString());
    
    return filteredEntities;
  } catch (error) {
    console.error('Error fetching popular entities:', error);
    // Try to return cached data even if it's expired in case of error
    const cachedEntities = getFromSession('popularEntities');
    if (cachedEntities) {
      console.log('Falling back to cached entities due to fetch error');
      return cachedEntities;
    }
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