/**
 * tmdbService.js
 * 
 * This file provides a service layer for interacting with The Movie Database (TMDB) API.
 * It handles all API communication including fetching movie/TV/actor data, searching,
 * and retrieving connections between entities for the "Connect the Stars" game.
 * 
 * Features:
 * - Request caching to minimize API calls
 * - Error handling and fallbacks
 * - Enhanced data processing (e.g., finding guest appearances)
 * - Image URL processing
 */
const API_KEY = 'bdfd168e527a1c86c379e6bb6b7c3a9f';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZGZkMTY4ZTUyN2ExYzg2YzM3OWU2YmI2YjdjM2E5ZiIsIm5iZiI6MTc0NTEzMzk4OS4wNTMsInN1YiI6IjY4MDRhMWE1NmUxYTc2OWU4MWVlMDg3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Hs2RaAd_2xRcdxTfL0JJkTUhosZFrjLvsUhLaX5rVq8';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Track API requests to avoid duplicates in short periods
const requestCache = new Map();
const CACHE_TTL = 60000; // Cache entries for 1 minute

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Accept': 'application/json'
};

/**
 * Helper function to handle API calls with request caching
 * 
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} params - Query parameters to include in the request
 * @returns {Promise<Object>} - The JSON response from the API
 * @throws {Error} - If the API call fails
 */
const apiCall = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Add API key to parameters
  url.searchParams.append('api_key', API_KEY);
  
  // Add other parameters
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
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    const data = await response.json();
    
    // Cache the response
    requestCache.set(cacheKey, {
      timestamp: now,
      data
    });
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

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
    const popularPeople = await apiCall('/person/popular', { page });
    
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
    if (requestCache.has(cacheKey)) {
      const cachedData = requestCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return cachedData.data;
      }
    }
    
    // Search for the person to get their known shows
    const person = await apiCall(`/person/${personId}`);
    
    // If no known for department, likely not an actor
    if (!person.known_for_department || person.known_for_department !== 'Acting') {
      return [];
    }
    
    // Get person's TV credits for comparison
    const personCredits = await apiCall(`/person/${personId}/tv_credits`);
    const regularCreditIds = new Set((personCredits.cast || []).map(show => show.id));
    
    // Use person popular to get potential guest appearances
    const personPopular = await apiCall(`/person/${personId}/combined_credits`);
    let guestAppearances = [];
    
    // Check each TV show credit
    const promises = [];
    for (const credit of (personPopular.cast || [])) {
      // Only process TV shows
      if (credit.media_type !== 'tv') continue;
      
      // Skip if it's already in regular credits
      if (regularCreditIds.has(credit.id)) continue;
      
      // This might be a guest appearance - collect promises to resolve in parallel
      promises.push(
        apiCall(`/tv/${credit.id}`).then(showDetails => {
          // Create a guest appearance entry similar to regular TV credits format
          return {
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
          };
        }).catch(err => {
          console.error(`Error fetching show details for ${credit.id}:`, err);
          return null; // Return null for failed requests
        })
      );
      
      // Limit to 5 requests at a time to avoid overloading the API
      if (promises.length >= 5) {
        const results = await Promise.all(promises);
        guestAppearances = [...guestAppearances, ...results.filter(Boolean)];
        promises.length = 0; // Clear the array
      }
    }
    
    // Process any remaining promises
    if (promises.length > 0) {
      const results = await Promise.all(promises);
      guestAppearances = [...guestAppearances, ...results.filter(Boolean)];
    }
    
    // Cache the results
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      data: guestAppearances
    });
    
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
 * Get person details including movie and TV credits - now with guest appearances
 * 
 * @param {number} personId - The TMDB ID of the person
 * @returns {Promise<Object>} - The person details including credits and guest appearances
 */
export const getPersonDetails = async (personId) => {
  try {
    // Get the standard person details first
    const personDetails = await apiCall(`/person/${personId}`, {
      append_to_response: 'movie_credits,tv_credits,images'
    });
    
    // Now try to find guest appearances
    const guestAppearances = await findPersonGuestAppearances(personId);
    
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
        // Only add if it's not already in the main cast credits
        // and ensure it's marked as a guest appearance
        if (!existingTvShowIds.has(guestAppearance.id)) {
          personDetails.tv_credits.cast.push({
            ...guestAppearance, // Spread guest appearance details
            is_guest_appearance: true // Explicitly mark as guest appearance
          });
          existingTvShowIds.add(guestAppearance.id); // Add to set to prevent re-adding
        } else {
          // If it IS already in tv_credits (e.g. a recurring role that's also listed as guest),
          // find it and ensure it's marked as having a guest appearance aspect.
          const existingCredit = personDetails.tv_credits.cast.find(c => c.id === guestAppearance.id);
          if (existingCredit) {
            existingCredit.is_guest_appearance = true; 
          }
        }
      });
      
      // Add a property to indicate we've processed guest appearances
      personDetails.guest_appearances_processed = true;
      // It might be useful to still have the raw guest appearances if needed for specific display
      // personDetails.raw_guest_appearances = guestAppearances; 
    }
    
    return personDetails;
  } catch (error) {
    console.error('Error getting person details with guest appearances:', error);
    // Fall back to the standard API call if our enhanced version fails
    // This fallback should also ideally try to initialize tv_credits if null
    try {
      const fallbackDetails = await apiCall(`/person/${personId}`, {
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
      console.error('Error in fallback getPersonDetails:', fallbackError);
      // If even fallback fails, return a minimal structure or throw
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
  return apiCall(`/movie/${movieId}`, {
    append_to_response: 'credits'
  });
};

/**
 * Get TV show details including credits
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @returns {Promise<Object>} - The TV show details including credits
 */
export const getTvShowDetails = async (tvId) => {
  return apiCall(`/tv/${tvId}`, {
    append_to_response: 'credits,aggregate_credits'
  });
};

/**
 * Get TV show season details (including episodes)
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} seasonNumber - The season number to fetch
 * @returns {Promise<Object>} - The season details including episodes
 */
export const getTvShowSeason = async (tvId, seasonNumber) => {
  return apiCall(`/tv/${tvId}/season/${seasonNumber}`);
};

/**
 * Get TV episode details (including guest stars)
 * 
 * @param {number} tvId - The TMDB ID of the TV show
 * @param {number} seasonNumber - The season number of the episode
 * @param {number} episodeNumber - The episode number to fetch
 * @returns {Promise<Object>} - The episode details including guest stars
 */
export const getTvEpisodeDetails = async (tvId, seasonNumber, episodeNumber) => {
  return apiCall(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    append_to_response: 'credits'
  });
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
    // First get the TV show details to get the number of seasons
    const tvDetails = await getTvShowDetails(tvId);
    const seasons = tvDetails.seasons || [];
    
    // Limit to the first few seasons to avoid too many requests
    const limitedSeasons = seasons.slice(0, maxSeasonsToFetch);
    
    let guestStars = [];
    const processedActorIds = new Set(); // To avoid duplicates
    
    // Fetch guest stars from each season's episodes
    for (const season of limitedSeasons) {
      // Skip specials (season_number 0)
      if (season.season_number === 0) continue;
      
      const seasonDetails = await getTvShowSeason(tvId, season.season_number);
      const episodes = seasonDetails.episodes || [];
      
      // Limit episodes per season to avoid too many requests
      const limitedEpisodes = episodes.slice(0, maxEpisodesPerSeason);
      
      for (const episode of limitedEpisodes) {
        const episodeDetails = await getTvEpisodeDetails(
          tvId, 
          season.season_number, 
          episode.episode_number
        );
        
        const episodeGuestStars = episodeDetails.guest_stars || [];
        
        episodeGuestStars.forEach(actor => {
          // Avoid duplicates
          if (!processedActorIds.has(actor.id)) {
            processedActorIds.add(actor.id);
            
            guestStars.push({
              ...actor,
              episode_name: episode.name,
              episode_number: episode.episode_number,
              season_number: season.season_number
            });
          }
        });
      }
    }
    
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
    // Get actor's TV credits
    const tvCredits = await apiCall(`/person/${actorId}/tv_credits`);
    
    // Check regular cast credits
    if (tvCredits.cast && tvCredits.cast.some(show => show.id === tvShowId)) {
      return { appears: true, role: 'cast' };
    }
    
    // Check guest appearances through combined credits (more thorough)
    const combinedCredits = await apiCall(`/person/${actorId}/combined_credits`);
    const tvAppearances = combinedCredits.cast ? combinedCredits.cast.filter(c => c.media_type === 'tv') : [];
    
    if (tvAppearances.some(show => show.id === tvShowId)) {
      return { appears: true, role: 'guest' };
    }
    
    // If neither found, they haven't appeared in the show
    return { appears: false };
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
    let results = [];
    
    // Try to search in all categories at once first
    const multiResults = await apiCall('/search/multi', { 
      query: trimmedQuery, 
      include_adult: false,
      language: 'en-US'
    });
    
    results = multiResults.results || [];
    
    // Always fetch more specific results to ensure better coverage
    const [tvResults, movieResults, peopleResults] = await Promise.all([
      apiCall('/search/tv', { 
        query: trimmedQuery,
        include_adult: false,
        language: 'en-US'
      }),
      apiCall('/search/movie', { 
        query: trimmedQuery,
        include_adult: false,
        language: 'en-US'
      }),
      apiCall('/search/person', { 
        query: trimmedQuery,
        include_adult: false,
        language: 'en-US'
      })
    ]);
    
    // Track existing IDs to avoid duplicates
    const existingIds = new Map();
    results.forEach(item => {
      if (item.id && item.media_type) {
        existingIds.set(`${item.media_type}-${item.id}`, true);
      }
    });
    
    // Add TV results with media_type
    if (tvResults.results && tvResults.results.length > 0) {
      tvResults.results.forEach(show => {
        if (!existingIds.has(`tv-${show.id}`)) {
          results.push({
            ...show,
            media_type: 'tv'
          });
          existingIds.set(`tv-${show.id}`, true);
        }
      });
    }
    
    // Add movie results with media_type
    if (movieResults.results && movieResults.results.length > 0) {
      movieResults.results.forEach(movie => {
        if (!existingIds.has(`movie-${movie.id}`)) {
          results.push({
            ...movie,
            media_type: 'movie'
          });
          existingIds.set(`movie-${movie.id}`, true);
        }
      });
    }
    
    // Add people results with media_type
    if (peopleResults.results && peopleResults.results.length > 0) {
      peopleResults.results.forEach(person => {
        if (!existingIds.has(`person-${person.id}`)) {
          results.push({
            ...person,
            media_type: 'person'
          });
          existingIds.set(`person-${person.id}`, true);
        }
      });
    }
    
    // Clean up results to ensure all have the right properties
    results = results.map(item => {
      // Fix missing media_type
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
    results = results.filter(item => 
      item.media_type === 'movie' || 
      item.media_type === 'tv' || 
      item.media_type === 'person'
    );
    
    // Sort by popularity
    results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
    // Limit to a reasonable number of results
    return results.slice(0, 20);
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
    const response = await apiCall('/search/person', { 
      query: query.trim(),
      include_adult: false,
      page: page
    });
    
    return {
      results: response.results || [],
      page: response.page || 1,
      total_pages: response.total_pages || 1
    };
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
    let allEntities = [];
    
    // Check if we have cached entities in session storage
    const cachedEntities = sessionStorage.getItem('popularEntities');
    const lastFetchTime = sessionStorage.getItem('popularEntitiesLastFetch');
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    
    if (cachedEntities && lastFetchTime && 
        (Date.now() - parseInt(lastFetchTime)) < SIX_HOURS) {
      console.log('Using cached popular entities from session storage');
      return JSON.parse(cachedEntities);
    }
    
    // Fetch popular movies
    for (let page = 1; page <= moviePages; page++) {
      const popularMovies = await apiCall('/movie/popular', { page });
      const movieEntities = popularMovies.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        name: movie.title, // Duplicate as name for consistency in search
        original_title: movie.original_title,
        poster_path: movie.poster_path,
        media_type: 'movie',
        popularity: movie.popularity,
        release_date: movie.release_date
      }));
      allEntities = [...allEntities, ...movieEntities];
    }
    
    // Fetch popular TV shows
    for (let page = 1; page <= tvPages; page++) {
      const popularTv = await apiCall('/tv/popular', { page });
      const tvEntities = popularTv.results.map(show => ({
        id: show.id,
        name: show.name,
        title: show.name, // Duplicate as title for consistency in search
        original_name: show.original_name,
        poster_path: show.poster_path,
        media_type: 'tv',
        popularity: show.popularity,
        first_air_date: show.first_air_date
      }));
      allEntities = [...allEntities, ...tvEntities];
    }
    
    // Fetch popular people
    for (let page = 1; page <= personPages; page++) {
      const popularPeople = await apiCall('/person/popular', { page });
      const personEntities = popularPeople.results.map(person => ({
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        media_type: 'person',
        popularity: person.popularity,
        known_for_department: person.known_for_department,
        known_for: person.known_for
      }));
      allEntities = [...allEntities, ...personEntities];
    }
    
    // Filter entities and ensure they have required fields
    const filteredEntities = allEntities.filter(entity => (
      entity && entity.id && 
      ((entity.media_type === 'person' && entity.profile_path) || 
       (entity.media_type !== 'person' && entity.poster_path))
    ));
    
    console.log(`Fetched ${filteredEntities.length} unique entities for spell checking`);
    
    // Store in session storage
    sessionStorage.setItem('popularEntities', JSON.stringify(filteredEntities));
    sessionStorage.setItem('popularEntitiesLastFetch', Date.now().toString());
    
    return filteredEntities;
  } catch (error) {
    console.error('Error fetching popular entities:', error);
    return [];
  }
};

const IMAGE_SIZES = {
  poster: 'w500',   // For movie/TV posters
  profile: 'w185',  // For person profiles
  backdrop: 'w780', // For backdrops
  small: 'w92',     // For small thumbnails
  medium: 'w185',   // For medium thumbnails
  large: 'w500'     // For large images
};

/**
 * Gets the full image URL for TMDB images
 * According to TMDB docs, images don't need authentication headers
 * @param {string} path - The image path
 * @param {string} type - The image type (poster, profile, etc.)
 * @returns {string} - The image URL
 */
export const getImageUrl = (path, type = 'poster') => {
  if (!path) return "https://via.placeholder.com/500x750?text=No+Image";
  
  // Select the appropriate size based on image type
  const size = IMAGE_SIZES[type] || 'w500';
  
  // Simply return the direct URL - no fetch needed
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

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