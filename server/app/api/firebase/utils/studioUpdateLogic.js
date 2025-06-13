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

// Single set of imports - no duplicates
import { getDatabase, ref, set, get } from 'firebase/database';

// Define companies split into 5 weekly quarters (optimized for 55-second limit)
const WEEKLY_QUARTERS = [
  // Week 1 - Marvel, Marvel, Marvel, Universal (4 companies, ~44.9s)
  { id: 420, name: 'Marvel Studios', key: 'marvel_studios', type: 'production' },
  { id: 13252, name: 'Marvel Comics', key: 'marvel_comics', type: 'production' },
  { id: 7505, name: 'Marvel Entertainment', key: 'marvel_entertainment', type: 'production' },
  { id: 33, name: 'Universal Pictures', key: 'universal_pictures', type: 'production' },
];

const WEEKLY_QUARTERS_2 = [
  // Week 2 - Walt, Walt, Pixar, 20th (4 companies, ~44.9s)
  { id: 2, name: 'Walt Disney Pictures', key: 'walt_disney_pictures', type: 'production' },
  { id: 6125, name: 'Walt Disney Animation Studios', key: 'walt_disney_animation_studios', type: 'production' },
  { id: 3, name: 'Pixar Animation Studios', key: 'pixar_animation_studios', type: 'production' },
  { id: 25, name: '20th Century Fox', key: '20th_century_fox', type: 'production' },
];

const WEEKLY_QUARTERS_3 = [
  // Week 3 - DC, DC, Lucasfilm, Paramount (4 companies, ~44.9s)
  { id: 429, name: 'DC Comics', key: 'dc_comics', type: 'production' },
  { id: 9993, name: 'DC Entertainment', key: 'dc_entertainment', type: 'production' },
  { id: 1, name: 'Lucasfilm', key: 'lucasfilm', type: 'production' },
  { id: 4, name: 'Paramount Pictures', key: 'paramount_pictures', type: 'production' },
];

const WEEKLY_QUARTERS_4 = [
  // Week 4 - Columbia, Sony, CBS, Lionsgate (4 companies, ~44.9s)
  { id: 5, name: 'Columbia Pictures', key: 'columbia_pictures', type: 'production' },
  { id: 11073, name: 'Sony Pictures Television', key: 'sony_pictures_television', type: 'production' },
  { id: 1081, name: 'CBS Studios', key: 'cbs_studios', type: 'production' },
  { id: 1632, name: 'Lionsgate', key: 'lionsgate', type: 'production' },
];

const WEEKLY_QUARTERS_5 = [
  // Week 5 - Extended Rotation (4 companies, ~44.9s)
  { id: 38679, name: 'Marvel Television', key: 'marvel_television', type: 'production' },
  { id: 670, name: 'Walt Disney Television', key: 'walt_disney_television', type: 'production' },
  { id: 3475, name: 'Disney Television Animation', key: 'disney_television_animation', type: 'production' },
  { id: 3614, name: 'Columbia Pictures Television', key: 'columbia_pictures_television', type: 'production' },
];

const ALL_QUARTERS = [WEEKLY_QUARTERS, WEEKLY_QUARTERS_2, WEEKLY_QUARTERS_3, WEEKLY_QUARTERS_4, WEEKLY_QUARTERS_5];

const WEEKLY_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOTAL_WEEKS = 5; // Updated to 5-week rotation

// Initialize Firebase once at module level
let firebaseInitialized = false;
let db = null;

async function initializeFirebase() {
  if (firebaseInitialized && db) return { db };
  
  try {
    const { initializeFirebase: initFB } = await import('./firebaseLogic.js');
    const result = initFB();
    db = result.db;
    firebaseInitialized = true;
    return result;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Compress studio item for storage (matches client-side compression)
 */
function compressStudioItem(item, details = null) {
  if (!item) return null;
  
  // Extract primary company name from production companies or use existing company field
  const primaryCompany = item.production_companies?.[0]?.name || item.company || item.studio;
  
  return {
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    media_type: item.media_type,
    popularity: item.popularity,
    release_date: item.release_date || item.first_air_date,
    vote_average: item.vote_average,
    studio: primaryCompany, // For frontend compatibility
    company: primaryCompany, // For frontend compatibility
    cast: item.cast || (details?.credits?.cast ? details.credits.cast.slice(0, 50).map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      order: actor.order,
      profile_path: actor.profile_path
    })) : []),
    overview: item.overview ? item.overview.substring(0, 200) + '...' : null,
    genre_ids: item.genre_ids?.slice(0, 3) || []
  };
}

/**
 * Extract search terms from title/text
 */
function extractSearchTerms(text) {
  if (!text) return [];
  
  const terms = [text.toLowerCase()]; // Full text
  
  // Split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  terms.push(...words);
    return [...new Set(terms)]; // Remove duplicates
}

function getWeekOfMonth() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstSunday = new Date(firstDayOfMonth);
  firstSunday.setDate(firstDayOfMonth.getDate() + (7 - firstDayOfMonth.getDay()) % 7);
  
  if (now < firstSunday) return 0;
  
  const daysSinceFirstSunday = Math.floor((now - firstSunday) / (24 * 60 * 60 * 1000));
  return Math.min(Math.floor(daysSinceFirstSunday / 7), 4); // Updated to support 5 weeks (0-4)
}

/**
 * Get studio cache data from Firebase in the format expected by frontend
 */
export async function getStudioCacheData() {
  try {
    const { db } = initializeFirebase();
    if (!db) {
      throw new Error('Firebase database not available');
    }

    // Fetch both cache and search index
    const [studioCacheSnapshot, searchIndexSnapshot, metadataSnapshot] = await Promise.all([
      get(ref(db, 'studio-cache')),
      get(ref(db, 'search-index')),
      get(ref(db, 'update-metadata'))
    ]);
    
    // Return in the format expected by frontend: { "studio-cache": {...}, "search-index": {...} }
    const result = {
      'studio-cache': studioCacheSnapshot.exists() ? studioCacheSnapshot.val() : {},
      'search-index': searchIndexSnapshot.exists() ? searchIndexSnapshot.val() : {}
    };
    
    // Add metadata if available
    if (metadataSnapshot.exists()) {
      result.metadata = metadataSnapshot.val();
    }
    
    return result;
  } catch (error) {
    console.error('Error getting studio cache data:', error);
    return null;
  }
}

/**
 * Main function to update studio cache data
 */
export async function updateStudioCacheData(options = {}) {
  const { reason = 'weekly_rotation', scheduled = false } = options;
  
  console.log(`🔄 Weekly studio cache update triggered - Reason: ${reason}`);
  
  try {
    // Determine which quarter to update this week
    const weekOfMonth = getWeekOfMonth();
    const companiesToUpdate = ALL_QUARTERS[weekOfMonth];
    
    if (!companiesToUpdate) {
      throw new Error(`Invalid week: ${weekOfMonth + 1}. Must be between 1 and ${ALL_QUARTERS.length}`);
    }
    
    console.log(`📅 [WEEK ${weekOfMonth + 1}] Updating ${companiesToUpdate.length} companies:`);
    companiesToUpdate.forEach(company => {
      console.log(`   - ${company.name} (ID: ${company.id})`);
    });
      // Check if this week's data needs updating
    const currentCache = await getStudioCacheData();
    if (!needsWeeklyUpdate(currentCache, weekOfMonth)) {
      console.log(`📅 Week ${weekOfMonth + 1} data is still fresh, skipping update`);
      return { 
        skipped: true, 
        reason: 'Week data is still fresh',
        week: weekOfMonth + 1,
        companies: companiesToUpdate.map(c => c.name),
        nextUpdateDue: getNextWeekUpdate()
      };
    }

    // Perform the weekly update
    const startTime = Date.now();
    const weekData = await fetchWeekCompaniesData(companiesToUpdate);
    
    // Update the aggregated cache and search index in Firebase
    await updateStudioCache(weekData);
      // Update metadata for tracking
    const updatedMetadata = {
      weeks: {
        ...(currentCache?.metadata?.weeks || {}),
        [weekOfMonth]: {
          lastUpdated: new Date().toISOString(),
          companies: companiesToUpdate.map(c => c.key),
          companyNames: companiesToUpdate.map(c => c.name),
          itemCount: Object.keys(weekData.cacheEntries).length,
          updateDuration: Date.now() - startTime,
          weekOfMonth: weekOfMonth + 1
        }
      },
      lastUpdated: new Date().toISOString(),
      updateReason: reason,
      version: `v${Date.now()}-w${weekOfMonth + 1}`,      updateCycle: {
        currentWeek: weekOfMonth + 1,
        totalWeeks: 5,
        monthlyProgress: `${weekOfMonth + 1}/5`,
        nextWeekCompanies: ALL_QUARTERS[(weekOfMonth + 1) % 5].map(c => c.name)
      }
    };
    
    await updateMetadata(updatedMetadata);
      const result = {
      updated: true,
      week: weekOfMonth + 1,
      companies: companiesToUpdate.map(c => c.name),
      duration: Date.now() - startTime,
      itemCount: Object.keys(weekData.cacheEntries).length,
      reason,
      scheduled,
      nextWeekUpdate: getNextWeekUpdate(),
      totalCachedItems: Object.keys(weekData.cacheEntries).length,
      monthlyProgress: `${weekOfMonth + 1}/5 weeks completed`
    };
    
    console.log(`✅ Weekly update completed:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Weekly studio cache update failed:', error);
    throw error;
  }
}

function needsWeeklyUpdate(cacheData, weekIndex) {
  if (!cacheData?.metadata?.weeks?.[weekIndex]?.lastUpdated) {
    return true;
  }
  
  const lastUpdate = new Date(cacheData.metadata.weeks[weekIndex].lastUpdated);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  return timeSinceUpdate > WEEKLY_UPDATE_INTERVAL;
}

function getNextWeekUpdate() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(2, 0, 0, 0);
  return nextSunday.toISOString();
}

async function fetchWeekCompaniesData(companies) {
  const allCacheEntries = {};
  const allSearchTerms = {};
  
  console.log(`📡 Fetching data for ${companies.length} companies...`);
  
  for (const company of companies) {
    try {
      const startTime = Date.now();
      const data = await fetchCompanyDataFromTMDB(company);
      console.log(`✅ Fetched ${company.name} in ${Date.now() - startTime}ms`);
      
      // Aggregate cache entries
      Object.assign(allCacheEntries, data.cacheEntries);
      
      // Merge search terms
      Object.entries(data.searchTerms).forEach(([term, cacheKeys]) => {
        if (!allSearchTerms[term]) allSearchTerms[term] = [];
        allSearchTerms[term].push(...cacheKeys);
        allSearchTerms[term] = [...new Set(allSearchTerms[term])]; // Remove duplicates
      });
      
    } catch (error) {
      console.warn(`❌ Failed to fetch ${company.name}:`, error);
    }
  }
  
  return { 
    cacheEntries: allCacheEntries,
    searchTerms: allSearchTerms
  };
}

/**
 * Fetch company data from TMDB - Movies, TV shows, and Cast
 */
async function fetchCompanyDataFromTMDB(company) {
  console.log(`📡 Fetching TMDB data for ${company.name} (ID: ${company.id})`);
  
  try {
    // Fetch movies and TV shows with rate limiting
    await rateLimitedDelay();
    const [moviesData, tvData] = await Promise.all([
      fetchMoviesForCompany(company.id),
      fetchTVShowsForCompany(company.id)
    ]);
    
    // Process and create cache-ready items
    const cacheEntries = {};
    const searchTerms = {};
    const cacheKeys = [];
      // Process movies with rate limiting
    for (const movie of moviesData.results?.slice(0, 20) || []) { // Limit to top 20
      await rateLimitedDelay();
      const enhancedMovie = await enhanceWithFullDetails(movie, 'movie');
      const cacheKey = `${company.key}-item-${movie.id}`; // Simplified key format
      
      // Create cache-ready entry
      cacheEntries[cacheKey] = createCacheReadyItem(enhancedMovie, cacheKey, company);
      cacheKeys.push(cacheKey);
      
      // Build search index
      addToSearchIndex(searchTerms, enhancedMovie, cacheKey);
    }
    
    // Process TV shows with rate limiting
    for (const show of tvData.results?.slice(0, 20) || []) { // Limit to top 20
      await rateLimitedDelay();
      const enhancedShow = await enhanceWithFullDetails(show, 'tv');
      const cacheKey = `${company.key}-item-${show.id}`; // Simplified key format
      
      // Create cache-ready entry
      cacheEntries[cacheKey] = createCacheReadyItem(enhancedShow, cacheKey, company);
      cacheKeys.push(cacheKey);
      
      // Build search index
      addToSearchIndex(searchTerms, enhancedShow, cacheKey);
    }
      return {
      cacheEntries,    // Ready to store directly in Firebase
      searchTerms     // Ready to merge into search index
    };
    
  } catch (error) {
    console.error(`Failed to fetch data for ${company.name}:`, error);
    throw error;
  }
}

function createCacheReadyItem(item, cacheKey, company) {
  // Compress data exactly as client expects
  const compressed = compressStudioItem(item);
  
  // Extract all production companies from TMDB response
  const productionCompanies = item.production_companies || [];
  const allCompanies = productionCompanies.map(pc => ({
    id: pc.id,
    name: pc.name,
    logo_path: pc.logo_path,
    origin_country: pc.origin_country
  }));
  
  // Ensure the discovery company is included if not already present
  const discoveryCompanyExists = allCompanies.some(pc => pc.name === company.name);
  if (!discoveryCompanyExists) {
    allCompanies.unshift({
      id: company.id,
      name: company.name,
      logo_path: null,
      origin_country: null
    });
  }
  
  return {
    // Core cache data
    ...compressed,
    
    // Enhanced company information
    production_companies: allCompanies,
    primary_company: company.name, // Keep track of discovery company
      // Cache metadata (only what's actually used)
    cache_tier: "warm", // Used by frontend cache system
    
    // Game metadata (for connections)  
    media_type: item.media_type
  };
}

function addToSearchIndex(searchTerms, item, cacheKey) {
  const terms = extractSearchTerms(item.title);
  const overview = item.overview || '';
  const castNames = (item.credits?.cast || []).slice(0, 10).map(actor => actor.name);
  
  // Extract production company names for search indexing
  const productionCompanyNames = (item.production_companies || []).map(pc => pc.name);
  
  // Add all searchable terms including production companies
  [...terms, 
   ...extractSearchTerms(overview), 
   ...castNames.flatMap(extractSearchTerms),
   ...productionCompanyNames.flatMap(extractSearchTerms)]
    .forEach(term => {
      if (!searchTerms[term]) searchTerms[term] = [];
      if (!searchTerms[term].includes(cacheKey)) {
        searchTerms[term].push(cacheKey);
      }
    });
}

// ==================== TMDB API FUNCTIONS ====================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchMoviesForCompany(companyId) {
  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&page=1`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchTVShowsForCompany(companyId) {
  const response = await fetch(
    `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&page=1`
  );
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  return response.json();
}

async function enhanceWithFullDetails(item, mediaType) {
  const detailsResponse = await fetch(
    `${TMDB_BASE_URL}/${mediaType}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords`
  );
  
  if (!detailsResponse.ok) {
    console.warn(`Failed to fetch details for ${mediaType} ${item.id}`);
    return { ...item, media_type: mediaType };
  }
  
  const details = await detailsResponse.json();
  
  return {
    ...item,
    ...details,
    media_type: mediaType,
    credits: details.credits || { cast: [] }
  };
}

// Add small delay to respect rate limits
async function rateLimitedDelay() {
  await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
}

// ==================== MAIN UPDATE LOGIC ====================

async function updateStudioCache(weekData) {
  const { db } = await initializeFirebase();
  
  if (!db) {
    throw new Error('Firebase database not available');
  }
  
  // Get current complete cache data
  const currentStudioCache = await get(ref(db, 'studio-cache'));
  const currentSearchIndex = await get(ref(db, 'search-index'));
  
  // Merge new week data with existing data
  const updatedStudioCache = {
    ...(currentStudioCache.exists() ? currentStudioCache.val() : {}),
    ...weekData.cacheEntries
  };
  
  const updatedSearchIndex = { ...(currentSearchIndex.exists() ? currentSearchIndex.val() : {}) };
  
  // Merge search terms
  Object.entries(weekData.searchTerms).forEach(([term, cacheKeys]) => {
    if (!updatedSearchIndex[term]) updatedSearchIndex[term] = [];
    updatedSearchIndex[term] = [...new Set([...updatedSearchIndex[term], ...cacheKeys])];
  });
  
  // Write the complete aggregated objects back to Firebase
  await Promise.all([
    set(ref(db, 'studio-cache'), updatedStudioCache),
    set(ref(db, 'search-index'), updatedSearchIndex)
  ]);
  
  console.log(`📦 Updated cache with ${Object.keys(weekData.cacheEntries).length} new items`);
  console.log(`🔍 Updated search index with ${Object.keys(weekData.searchTerms).length} new terms`);
}

async function updateMetadata(metadata) {
  const { db } = await initializeFirebase();
  
  if (!db) {
    throw new Error('Firebase database not available');
  }
  
  // Update system metadata
  await set(ref(db, 'update-metadata'), metadata);
}

// Remove force option from initialization
export async function initializeStudioCacheUpdater() {
  console.log('🔄 Initializing studio cache updater...');
  
  const weekOfMonth = getWeekOfMonth();
  const currentCache = await getStudioCacheData();
  
  if (needsWeeklyUpdate(currentCache, weekOfMonth)) {
    console.log(`📅 Week ${weekOfMonth + 1} cache is stale, triggering background update...`);
    updateStudioCacheData({ 
      reason: 'startup_weekly_check',
      scheduled: true 
    }).catch(error => {
      console.error('❌ Background weekly update failed:', error);
    });
  } else {
    console.log(`✅ Week ${weekOfMonth + 1} cache is fresh`);
  }
}

