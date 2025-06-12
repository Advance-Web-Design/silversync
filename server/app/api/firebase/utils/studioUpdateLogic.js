/**
 * Studio Update Logic
 * 
 * Manages studio cache data updates with rate limiting and background processing.
 * Uses TMDB's company endpoint to capture content under licensed IP umbrellas.
 * 
 * Features:
 * - Rate-limited TMDB API calls (5 items/batch, 1sec delays)
 * - Company-based content aggregation for licensed IPs
 * - Compressed studio items (3.5KB vs 15KB)
 * - Auto-update checks on server start
 * - Background processing when idle
 * - Search index generation
 */

import { getDatabase, ref, set, get } from 'firebase/database';
import { initializeFirebase } from './firebaseLogic.js';

// Company configuration - Using TMDB company IDs for licensed IP umbrellas
const COMPANIES = [
  { id: 420, name: 'Marvel Studios', key: 'marvel', type: 'production' },
  { id: 7505, name: 'Marvel Entertainment', key: 'marvel_entertainment', type: 'production' },
  { id: 2, name: 'Walt Disney Pictures', key: 'disney', type: 'production' },
  { id: 6125, name: 'Walt Disney Animation Studios', key: 'disney_animation', type: 'production' },
  { id: 9993, name: 'DC Entertainment', key: 'dc', type: 'production' },
  { id: 429, name: 'DC Comics', key: 'dc_comics', type: 'production' },
  { id: 1, name: 'Lucasfilm', key: 'lucasfilm', type: 'production' },
  { id: 3, name: 'Pixar Animation Studios', key: 'pixar', type: 'production' },
  { id: 33, name: 'Universal Pictures', key: 'universal', type: 'production' },
  { id: 4, name: 'Paramount Pictures', key: 'paramount', type: 'production' }
];

// Rate limiting configuration
const BATCH_SIZE = 5;
const BATCH_DELAY = 1000; // 1 second between batches
const MAX_ITEMS_PER_COMPANY = 80; // Increased for company-based aggregation
const MAX_PAGES_PER_QUERY = 2; // Fetch multiple pages for better coverage

// Cache control
let lastUpdateCheck = null;
let updateInProgress = false;

/**
 * Get studio cache data from Firebase
 */
export async function getStudioCacheData() {
  try {
    const { db } = initializeFirebase();
    if (!db) {
      throw new Error('Firebase database not available');
    }

    const cacheRef = ref(db, 'studio-cache');
    const snapshot = await get(cacheRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting studio cache data:', error);
    return null;
  }
}

/**
 * Main function to update studio cache data
 */
export async function updateStudioCacheData() {
  if (updateInProgress) {
    console.log('🔄 Studio update already in progress, skipping');
    return false;
  }

  updateInProgress = true;
  console.log('🚀 Starting studio cache update...');
  console.time('studio-cache-update');

  try {
    const { db } = initializeFirebase();
    if (!db) {
      throw new Error('Firebase database not available');
    }    const studioData = {
      version: new Date().toISOString(),
      lastUpdated: Date.now(),
      companies: {},
      searchIndex: {},
      totalCompanies: COMPANIES.length
    };

    let totalItems = 0;
    const searchTerms = new Map();

    // Process each company with rate limiting
    for (const company of COMPANIES) {
      console.log(`🏢 Processing ${company.name} (ID: ${company.id})...`);
      
      try {
        const companyItems = await processCompanyWithRateLimit(company);
        studioData.companies[company.key] = {
          name: company.name,
          id: company.id,
          type: company.type,
          items: companyItems,
          itemCount: companyItems.length,
          lastProcessed: Date.now()
        };

        // Build search index for this company
        companyItems.forEach(item => {
          const terms = extractSearchTerms(item.title || item.name);
          terms.forEach(term => {
            const normalizedTerm = term.toLowerCase();
            if (!searchTerms.has(normalizedTerm)) {
              searchTerms.set(normalizedTerm, []);
            }
            searchTerms.get(normalizedTerm).push(`${company.key}.${item.id}`);
          });
        });

        totalItems += companyItems.length;
        console.log(`✅ ${company.name}: ${companyItems.length} items processed`);
        
      } catch (error) {
        console.error(`❌ Error processing ${company.name}:`, error);
        // Continue with other companies
        studioData.companies[company.key] = {
          name: company.name,
          id: company.id,
          type: company.type,
          items: [],
          itemCount: 0,
          error: error.message,
          lastProcessed: Date.now()
        };
      }
    }

    // Convert search terms map to object
    studioData.searchIndex = Object.fromEntries(searchTerms);    // Save to Firebase
    const cacheRef = ref(db, 'studio-cache');
    await set(cacheRef, studioData);

    console.timeEnd('studio-cache-update');
    console.log(`🎉 Company cache update complete: ${totalItems} items across ${COMPANIES.length} companies, ${searchTerms.size} search terms`);
    
    return true;

  } catch (error) {
    console.error('❌ Studio cache update failed:', error);
    return false;
  } finally {
    updateInProgress = false;
  }
}

/**
 * Process a single company with rate limiting
 */
async function processCompanyWithRateLimit(company) {
  try {
    // Get content from the company using multiple strategies
    const [movies, tvShows, companyDetails] = await Promise.all([
      fetchCompanyMovies(company.id),
      fetchCompanyTvShows(company.id),
      fetchCompanyDetails(company.id)
    ]);

    const allItems = [...movies, ...tvShows];
    
    // Sort by popularity and limit items
    const sortedItems = allItems
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, MAX_ITEMS_PER_COMPANY);
    
    console.log(`📊 ${company.name}: Found ${allItems.length} items, processing top ${sortedItems.length}`);
    
    // Process items in batches with delays
    const processedItems = [];
    
    for (let i = 0; i < sortedItems.length; i += BATCH_SIZE) {
      const batch = sortedItems.slice(i, i + BATCH_SIZE);
      
      // Add delay between batches (except first)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
      
      const batchPromises = batch.map(async (item) => {
        try {
          const details = await fetchItemDetails(item);
          return compressCompanyItem(item, details, company.name);
        } catch (error) {
          console.warn(`Failed to process item ${item.id}:`, error.message);
          return compressCompanyItem(item, null, company.name);
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      processedItems.push(...batchResults.filter(Boolean));
      
      console.log(`📦 Processed batch ${Math.floor(i/BATCH_SIZE) + 1} for ${company.name}: ${batchResults.length} items`);
    }
    
    return processedItems;
    
  } catch (error) {
    console.error(`Error processing company ${company.name}:`, error);
    return [];
  }
}

/**
 * Fetch popular movies for a company
 */
async function fetchCompanyMovies(companyId) {
  try {
    const allMovies = [];
    
    // Fetch multiple pages for better coverage
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        break; // Stop if later pages fail
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        break; // No more results
      }
      
      allMovies.push(...data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      })));
      
      // Add small delay between pages
      if (page < MAX_PAGES_PER_QUERY) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return allMovies;
    
  } catch (error) {
    console.error(`Error fetching movies for company ${companyId}:`, error);
    return [];
  }
}

/**
 * Fetch popular TV shows for a company
 */
async function fetchCompanyTvShows(companyId) {
  try {
    const allShows = [];
    
    // Fetch multiple pages for better coverage
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        break; // Stop if later pages fail
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        break; // No more results
      }
      
      allShows.push(...data.results.map(show => ({
        ...show,
        media_type: 'tv'
      })));
      
      // Add small delay between pages
      if (page < MAX_PAGES_PER_QUERY) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return allShows;
    
  } catch (error) {
    console.error(`Error fetching TV shows for company ${companyId}:`, error);
    return [];
  }
}

/**
 * Fetch company details for additional metadata
 */
async function fetchCompanyDetails(companyId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/company/${companyId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.warn(`Failed to fetch company details for ${companyId}:`, error.message);
    return null;
  }
}

/**
 * Fetch detailed information for an item
 */
async function fetchItemDetails(item) {
  try {
    const endpoint = item.media_type === 'movie' 
      ? `https://api.themoviedb.org/3/movie/${item.id}?append_to_response=credits`
      : `https://api.themoviedb.org/3/tv/${item.id}?append_to_response=credits`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.warn(`Failed to fetch details for ${item.id}:`, error.message);
    return null;
  }
}

/**
 * Compress company item but include ALL cast for proper game connections
 * Note: Size will be larger than 3.5KB due to complete cast data needed for gameplay
 */
function compressCompanyItem(item, details, companyName) {
  const compressed = {
    // Core identification
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    media_type: item.media_type,
    
    // Key metrics
    popularity: item.popularity,
    release_date: item.release_date || item.first_air_date,
    vote_average: item.vote_average,
    
    // Company information
    company: companyName,
    
    // ALL cast data for proper game connections (critical for actor-movie connections)
    cast: extractAllCast(details),
    
    // Additional metadata for licensed IPs
    overview: item.overview ? item.overview.substring(0, 200) + '...' : null,
    genre_ids: item.genre_ids?.slice(0, 3) || [] // Top 3 genres only
  };
  
  return compressed;
}

/**
 * Extract ALL cast members with essential info for game connections
 * Critical: Must include ALL cast for proper actor-movie connections in the game
 */
function extractAllCast(details) {
  if (!details?.credits?.cast) return [];
  
  return details.credits.cast
    // Process ALL cast members - no slicing or limiting
    .map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      order: actor.order,
      profile_path: actor.profile_path // Added for actor images
    }))
    // Sort by order to prioritize main cast but keep ALL actors
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Extract search terms from title (full title + words + abbreviations)
 */
function extractSearchTerms(title) {
  if (!title) return [];
  
  const terms = [title]; // Full title
  
  // Split into words
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  terms.push(...words);
  
  // Create abbreviations for multi-word titles
  if (words.length > 1) {
    const abbreviation = words.map(word => word[0]).join('');
    if (abbreviation.length > 1) {
      terms.push(abbreviation);
    }
  }
    // Special cases for common variations and licensed IPs
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('captain america')) {
    terms.push('cap', 'captain', 'america');
  }
  if (lowerTitle.includes('iron man')) {
    terms.push('ironman', 'iron', 'stark');
  }
  if (lowerTitle.includes('spider-man') || lowerTitle.includes('spiderman')) {
    terms.push('spiderman', 'spider-man', 'spidey', 'spider');
  }
  if (lowerTitle.includes('star wars')) {
    terms.push('starwars', 'jedi', 'sith', 'force');
  }
  if (lowerTitle.includes('avengers')) {
    terms.push('avengers', 'infinity', 'endgame');
  }
  if (lowerTitle.includes('x-men') || lowerTitle.includes('xmen')) {
    terms.push('xmen', 'x-men', 'mutant', 'wolverine');
  }
  if (lowerTitle.includes('batman')) {
    terms.push('batman', 'bruce', 'wayne', 'dark knight');
  }
  if (lowerTitle.includes('superman')) {
    terms.push('superman', 'clark', 'kent', 'man of steel');
  }
  if (lowerTitle.includes('justice league')) {
    terms.push('justice', 'league', 'jl');
  }
  
  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Generate URL-safe key from title
 */
function generateItemKey(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Initialize studio cache updater on server start
 */
export async function initializeStudioCacheUpdater() {
  try {
    console.log('🔍 Checking company cache age...');
    
    const cacheData = await getStudioCacheData();
    
    if (!cacheData || !cacheData.lastUpdated) {
      console.log('📦 No company cache found, triggering initial update...');
      await updateStudioCacheData();
      return;
    }
    
    const lastUpdate = new Date(cacheData.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    console.log(`📅 Company cache age: ${daysSinceUpdate.toFixed(1)} days`);
    console.log(`📊 Current cache: ${Object.keys(cacheData.companies || {}).length} companies`);
    
    if (daysSinceUpdate > 7) {
      console.log('⏰ Company cache is stale (>7 days), triggering background update...');
      // Non-blocking background update
      updateStudioCacheData().catch(error => {
        console.error('Background company update failed:', error);
      });
    } else {
      console.log('✅ Company cache is fresh');
    }
    
  } catch (error) {
    console.error('❌ Error checking company cache age:', error);
  }
}

/**
 * Check if studio cache needs update
 */
export async function checkCacheAge() {
  try {
    const cacheData = await getStudioCacheData();
    
    if (!cacheData || !cacheData.lastUpdated) {
      return { needsUpdate: true, age: 'No cache found' };
    }
    
    const lastUpdate = new Date(cacheData.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    return {
      needsUpdate: daysSinceUpdate > 7,
      age: `${daysSinceUpdate.toFixed(1)} days`,
      lastUpdated: cacheData.lastUpdated,
      version: cacheData.version,
      companies: Object.keys(cacheData.companies || {}).length,
      totalItems: Object.values(cacheData.companies || {})
        .reduce((total, company) => total + (company.itemCount || 0), 0)
    };
    
  } catch (error) {
    console.error('Error checking cache age:', error);
    return { needsUpdate: true, age: 'Error checking cache', error: error.message };
  }
}
