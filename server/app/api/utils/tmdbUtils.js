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
 * Search for content by company name (fallback method)
 */
export async function searchByCompanyName(type, companyName, page = 1, rateLimiter = null) {
  if (rateLimiter) {
    await rateLimiter.waitIfNeeded();
  }
  
  const baseUrl = 'https://api.themoviedb.org/3/search';
  const endpoint = type === 'movie' ? 'movie' : 'tv';
  
  const params = new URLSearchParams({
    page: page.toString(),
    query: companyName,
    include_adult: 'false'
  });

  const url = `${baseUrl}/${endpoint}?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB Search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Filter results to only include items that actually match the company
  const filteredResults = data.results.filter(item => {
    const companies = item.production_companies || [];
    return companies.some(company => 
      company.name.toLowerCase().includes(companyName.toLowerCase()) ||
      companyName.toLowerCase().includes(company.name.toLowerCase())
    );
  });

  return {
    ...data,
    results: filteredResults
  };
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
 * Generate blacklist for a specific challenge using both company IDs and names
 */
export async function generateChallengeBlacklist(challengeName, companyIds, companyNames = []) {
  console.log(`Generating blacklist for ${challengeName} with companies: ${companyIds}`);
  console.log(`Also searching by company names: ${companyNames.slice(0, 3).join(', ')}${companyNames.length > 3 ? '...' : ''}`);
  
  try {
    // Method 1: Fetch by company IDs (primary method - more reliable)
    const [moviesByIds, tvShowsByIds] = await Promise.all([
      fetchAllPages('movie', companyIds),
      fetchAllPages('tv', companyIds)
    ]);
    
    // Method 2: Fetch by company names (fallback method - catches edge cases)
    const [moviesByNames, tvShowsByNames] = await Promise.all([
      fetchByCompanyNames('movie', companyNames),
      fetchByCompanyNames('tv', companyNames)
    ]);
    
    // Combine and deduplicate results
    const allMovies = [...moviesByIds, ...moviesByNames];
    const allTvShows = [...tvShowsByIds, ...tvShowsByNames];
    
    // Process results into minimal format with deduplication
    const blockedMovies = {};
    const blockedTvShows = {};
    
    allMovies.forEach(movie => {
      blockedMovies[movie.id] = {
        id: movie.id,
        title: movie.title
      };
    });
    
    allTvShows.forEach(show => {
      blockedTvShows[show.id] = {
        id: show.id,
        name: show.name
      };
    });
    
    console.log(`Generated blacklist: ${Object.keys(blockedMovies).length} movies (${moviesByIds.length} by IDs + ${moviesByNames.length} by names), ${Object.keys(blockedTvShows).length} TV shows (${tvShowsByIds.length} by IDs + ${tvShowsByNames.length} by names)`);
    
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

/**
 * Fetch content by company names (search-based approach)
 */
export async function fetchByCompanyNames(type, companyNames, maxPages = 5) {
  const rateLimiter = new TMDBRateLimiter();
  const results = [];
  const seenIds = new Set(); // Prevent duplicates
  
  for (const companyName of companyNames) {
    console.log(`Searching ${type} by company name: ${companyName}`);
    
    let page = 1;
    let totalPages = 1;
    
    do {
      try {
        const data = await searchByCompanyName(type, companyName, page, rateLimiter);
        
        if (page === 1) {
          totalPages = Math.min(data.total_pages, maxPages);
        }
        
        // Add unique results
        data.results.forEach(item => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            results.push(item);
          }
        });
        
        page++;
        
      } catch (error) {
        console.error(`Error searching ${type} for company ${companyName}:`, error);
        break; // Move to next company on error
      }
      
    } while (page <= totalPages);
  }
  
  return results;
}
