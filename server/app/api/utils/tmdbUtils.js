/**
 * TMDB API utilities for efficient bulk fetching
 * Used by the challenge data processing system
 */

/**
 * Rate limiting for TMDB API calls
 * TMDB allows 40 requests per 10 seconds
 */
export class TMDBRateLimiter {
  constructor() {
    this.requests = [];
    this.maxRequests = 35; // Leave some buffer
    this.windowMs = 10000; // 10 seconds
  }

  async waitIfNeeded() {
    const now = Date.now();
    // Remove requests older than window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

/**
 * Fetch data from TMDB Discover API with pagination
 */
export async function fetchTMDBDiscover(type, companyIds, page = 1, rateLimiter = null) {
  if (rateLimiter) {
    await rateLimiter.waitIfNeeded();
  }
  
  const baseUrl = 'https://api.themoviedb.org/3/discover';
  const endpoint = type === 'movie' ? 'movie' : 'tv';
  
  const params = new URLSearchParams({
    page: page.toString(),
    with_companies: companyIds.join('|'),
    sort_by: 'popularity.desc',
    'vote_count.gte': '10', // Only include content with at least 10 votes
    include_adult: 'false', // Exclude adult content
  });

  const url = `${baseUrl}/${endpoint}?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Batch process TMDB pages with rate limiting
 * Fetches ALL pages to get complete data
 */
export async function fetchAllPages(type, companyIds, maxPages = null) {  const rateLimiter = new TMDBRateLimiter();
  const results = [];
  
  let page = 1;
  let totalPages = 1;
  
  do {
    console.log(`Fetching ${type} page ${page}/${totalPages || '?'}`);
    
    try {
      const data = await fetchTMDBDiscover(type, companyIds, page, rateLimiter);
      
      if (page === 1) {
        totalPages = maxPages ? Math.min(data.total_pages, maxPages) : data.total_pages;
      }
      
      results.push(...data.results);
      page++;
      
    } catch (error) {
      console.error(`Error fetching ${type} page ${page}:`, error);
      // Continue with next page on error
      page++;
    }
    
  } while (page <= totalPages);
  
  return results;
}

/**
 * Generate blacklist for a specific challenge
 */
export async function generateChallengeBlacklist(challengeName, companyIds) {
  console.log(`Generating blacklist for ${challengeName} with companies: ${companyIds}`);
  
  try {
    // Fetch movies and TV shows in parallel
    const [movies, tvShows] = await Promise.all([
      fetchAllPages('movie', companyIds),
      fetchAllPages('tv', companyIds)
    ]);
    
    // Process results into minimal format
    const blockedMovies = {};
    const blockedTvShows = {};
    
    movies.forEach(movie => {
      blockedMovies[movie.id] = {
        id: movie.id,
        title: movie.title
      };
    });
    
    tvShows.forEach(show => {
      blockedTvShows[show.id] = {
        id: show.id,
        name: show.name
      };
    });
    
    console.log(`Generated blacklist: ${Object.keys(blockedMovies).length} movies, ${Object.keys(blockedTvShows).length} TV shows`);
    
    return { blockedMovies, blockedTvShows };
    
  } catch (error) {
    console.error('Error generating blacklist:', error);
    throw error;
  }
}

/**
 * Validate TMDB API configuration
 */
export function validateTMDBConfig() {
  if (!process.env.TMDB_API_TOKEN) {
    throw new Error('TMDB_API_TOKEN environment variable is required');
  }
  
  return true;
}

/**
 * Test TMDB API connection
 */
export async function testTMDBConnection() {
  try {
    validateTMDBConfig();
    
    const response = await fetch('https://api.themoviedb.org/3/configuration', {
      headers: {
        'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TMDB API test failed: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('TMDB connection test failed:', error);
    throw error;
  }
}
