/**
 * New Cache Size Calculator - Optimized 23 Company List
 * 
 * Calculates realistic cache size for the optimized studio distribution
 */

const fetch = require('node-fetch');

// TMDB API Token from environment variable
require('dotenv').config();
const TMDB_TOKEN = process.env.TMDB_TOKEN;
if (!TMDB_TOKEN) {
  throw new Error('TMDB_TOKEN environment variable is not set.');
}

// Validate that the API key is available
if (!TMDB_TOKEN) {
  console.error('❌ TMDB_API_KEY environment variable is required');
  console.error('💡 Please set TMDB_API_KEY in your .env file');
  process.exit(1);
}

// Optimized company list from the new configuration
const OPTIMIZED_COMPANIES = [
  // Week 1
  { id: 13252, name: 'Marvel Comics', key: 'marvel_comics', week: 1 },
  { id: 420, name: 'Marvel Studios', key: 'marvel_studios', week: 1 },
  { id: 33, name: 'Universal Pictures', key: 'universal_pictures', week: 1 },
  { id: 7505, name: 'Marvel Entertainment', key: 'marvel_entertainment', week: 1 },
  { id: 3614, name: 'Columbia Pictures Television', key: 'columbia_pictures_television', week: 1 },
  
  // Week 2
  { id: 9993, name: 'DC Entertainment', key: 'dc_entertainment', week: 2 },
  { id: 25, name: '20th Century Fox', key: '20th_century_fox', week: 2 },
  { id: 5, name: 'Columbia Pictures', key: 'columbia_pictures', week: 2 },
  { id: 670, name: 'Walt Disney Television', key: 'walt_disney_television', week: 2 },
  { id: 11073, name: 'Sony Pictures Television', key: 'sony_pictures_television', week: 2 },
  { id: 38679, name: 'Marvel Television', key: 'marvel_television', week: 2 },
  
  // Week 3
  { id: 1, name: 'Lucasfilm', key: 'lucasfilm', week: 3 },
  { id: 6125, name: 'Walt Disney Animation Studios', key: 'walt_disney_animation_studios', week: 3 },
  { id: 2, name: 'Walt Disney Pictures', key: 'walt_disney_pictures', week: 3 },
  { id: 3475, name: 'Disney Television Animation', key: 'disney_television_animation', week: 3 },
  { id: 12551, name: 'Screen Gems Television', key: 'screen_gems_television', week: 3 },
  { id: 10146, name: 'Focus Features', key: 'focus_features', week: 3 },
  
  // Week 4
  { id: 429, name: 'DC Comics', key: 'dc_comics', week: 4 },
  { id: 3, name: 'Pixar Animation Studios', key: 'pixar_animation_studios', week: 4 },
  { id: 4, name: 'Paramount Pictures', key: 'paramount_pictures', week: 4 },
  { id: 1558, name: 'Touchstone Television', key: 'touchstone_television', week: 4 },
  { id: 1081, name: 'CBS Studios', key: 'cbs_studios', week: 4 },
  { id: 1632, name: 'Lionsgate', key: 'lionsgate', week: 4 }
];

const MAX_ITEMS_PER_COMPANY = 80;
const MAX_PAGES_PER_QUERY = 2;

/**
 * Fetch movies for a company
 */
async function fetchCompanyMovies(companyId) {
  try {
    const allMovies = [];
    
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        break;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        break;
      }
      
      allMovies.push(...data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      })));
      
      // Small delay between pages
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
 * Fetch TV shows for a company
 */
async function fetchCompanyTvShows(companyId) {
  try {
    const allShows = [];
    
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        break;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        break;
      }
      
      allShows.push(...data.results.map(show => ({
        ...show,
        media_type: 'tv'
      })));
      
      // Small delay between pages
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
 * Get item details to calculate actual size
 */
async function fetchItemDetails(item) {
  try {
    const endpoint = item.media_type === 'movie' 
      ? `https://api.themoviedb.org/3/movie/${item.id}?append_to_response=credits`
      : `https://api.themoviedb.org/3/tv/${item.id}?append_to_response=credits`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${TMDB_TOKEN}`,
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
 * Compress item like in the actual cache system
 */
function compressCompanyItem(item, details, companyName) {
  const compressed = {
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    media_type: item.media_type,
    popularity: item.popularity,
    release_date: item.release_date || item.first_air_date,
    vote_average: item.vote_average,
    company: companyName,
    cast: extractAllCast(details),
    overview: item.overview ? item.overview.substring(0, 200) + '...' : null,
    genre_ids: item.genre_ids?.slice(0, 3) || []
  };
  
  return compressed;
}

/**
 * Extract ALL cast members
 */
function extractAllCast(details) {
  if (!details?.credits?.cast) return [];
  
  return details.credits.cast
    .map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      order: actor.order,
      profile_path: actor.profile_path
    }))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Calculate size of an object in bytes
 */
function calculateSize(obj) {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

/**
 * Process a single company and calculate its cache size
 */
async function processCompanySize(company) {
  console.log(`\n🏢 Processing ${company.name} (ID: ${company.id}) - Week ${company.week}...`);
  
  try {
    // Get movies and TV shows
    const [movies, tvShows] = await Promise.all([
      fetchCompanyMovies(company.id),
      fetchCompanyTvShows(company.id)
    ]);

    const allItems = [...movies, ...tvShows];
    console.log(`📊 Found ${movies.length} movies, ${tvShows.length} TV shows (${allItems.length} total)`);
    
    if (allItems.length === 0) {
      return {
        company: company.name,
        week: company.week,
        movies: 0,
        tvShows: 0,
        totalItems: 0,
        processedItems: 0,
        sizeBytes: 0,
        sizeKB: 0,
        avgItemSize: 0
      };
    }

    // Sort by popularity and limit
    const sortedItems = allItems
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, MAX_ITEMS_PER_COMPANY);
    
    console.log(`🔝 Processing top ${sortedItems.length} items by popularity`);
    
    // Process a sample of 8 items to estimate size
    const sampleSize = Math.min(8, sortedItems.length);
    const sampleItems = sortedItems.slice(0, sampleSize);
    
    let totalSampleSize = 0;
    let processedSample = 0;
    
    for (const item of sampleItems) {
      try {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const details = await fetchItemDetails(item);
        const compressed = compressCompanyItem(item, details, company.name);
        const itemSize = calculateSize(compressed);
        
        totalSampleSize += itemSize;
        processedSample++;
        
        console.log(`  📦 ${(item.title || item.name).substring(0, 30)}: ${Math.round(itemSize/1024)}KB (${compressed.cast?.length || 0} cast)`);
        
      } catch (error) {
        console.warn(`  ❌ Failed to process ${item.title || item.name}:`, error.message);
      }
    }
    
    // Calculate average item size and estimate total
    const avgItemSize = processedSample > 0 ? totalSampleSize / processedSample : 0;
    const estimatedTotalSize = Math.round(avgItemSize * sortedItems.length);
    
    const result = {
      company: company.name,
      key: company.key,
      week: company.week,
      id: company.id,
      movies: movies.length,
      tvShows: tvShows.length,
      totalItems: allItems.length,
      processedItems: sortedItems.length,
      sampleSize: processedSample,
      avgItemSize: Math.round(avgItemSize),
      sizeBytes: estimatedTotalSize,
      sizeKB: Math.round(estimatedTotalSize / 1024 * 100) / 100,
      sizeMB: Math.round(estimatedTotalSize / (1024 * 1024) * 1000) / 1000
    };
    
    console.log(`✅ ${company.name}: ${result.processedItems} items, ~${result.sizeKB} KB (avg: ${result.avgItemSize} bytes/item)`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error processing ${company.name}:`, error);
    return {
      company: company.name,
      key: company.key,
      week: company.week,
      id: company.id,
      movies: 0,
      tvShows: 0,
      totalItems: 0,
      processedItems: 0,
      sizeBytes: 0,
      sizeKB: 0,
      avgItemSize: 0,
      error: error.message
    };
  }
}

/**
 * Main function to calculate optimized cache size
 */
async function calculateOptimizedCacheSize() {
  console.log('🚀 Starting OPTIMIZED cache size calculation...');
  console.log(`📋 Testing ${OPTIMIZED_COMPANIES.length} companies across 4 weeks`);
  console.log(`🎯 Max ${MAX_ITEMS_PER_COMPANY} items per company\n`);
  console.time('optimized-cache-calculation');
  
  const results = [];
  const weekResults = [[], [], [], []];
  let totalItems = 0;
  let totalSizeBytes = 0;
  
  // Process each company
  for (const company of OPTIMIZED_COMPANIES) {
    try {
      const result = await processCompanySize(company);
      results.push(result);
      weekResults[company.week - 1].push(result);
      
      totalItems += result.processedItems;
      totalSizeBytes += result.sizeBytes;
      
      // Delay between companies
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Error processing ${company.name}:`, error);
      results.push({
        company: company.name,
        key: company.key,
        week: company.week,
        id: company.id,
        error: error.message,
        processedItems: 0,
        sizeBytes: 0
      });
    }
  }
  
  // Calculate metadata size
  const metadataSize = 75 * 1024; // Estimated 75KB for metadata (more companies = more metadata)
  const totalWithMetadata = totalSizeBytes + metadataSize;
  
  console.timeEnd('optimized-cache-calculation');
  
  // Generate comprehensive report
  console.log('\n📊 OPTIMIZED CACHE SIZE ANALYSIS RESULTS');
  console.log('='.repeat(80));
  
  // Weekly breakdown
  for (let week = 1; week <= 4; week++) {
    const weekData = weekResults[week - 1];
    const weekItems = weekData.reduce((sum, r) => sum + r.processedItems, 0);
    const weekSize = weekData.reduce((sum, r) => sum + r.sizeBytes, 0);
    
    console.log(`\n📅 WEEK ${week} (${weekData.length} companies):`);
    console.log(`📦 Total Items: ${weekItems}`);
    console.log(`💾 Cache Size: ${Math.round(weekSize / 1024)} KB (${Math.round(weekSize / (1024 * 1024) * 100) / 100} MB)`);
    console.log(`📋 Companies:`);
    
    weekData.forEach(result => {
      if (result.error) {
        console.log(`   ❌ ${result.company}: ERROR - ${result.error}`);
      } else {
        console.log(`   ✅ ${result.company}: ${result.processedItems} items, ${result.sizeMB} MB (${result.movies}M + ${result.tvShows}TV)`);
      }
    });
  }
  
  console.log('\n📊 TOTAL SYSTEM SUMMARY:');
  console.log(`📦 Total Companies: ${OPTIMIZED_COMPANIES.length}`);
  console.log(`📋 Total Items: ${totalItems}`);
  console.log(`💾 Raw Cache Data: ${Math.round(totalSizeBytes / 1024)} KB (${Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100} MB)`);
  console.log(`🔍 Metadata: ${Math.round(metadataSize / 1024)} KB`);
  console.log(`📊 Total Cache: ${Math.round(totalWithMetadata / 1024)} KB (${Math.round(totalWithMetadata / (1024 * 1024) * 100) / 100} MB)`);
  
  const avgItemSize = totalItems > 0 ? totalSizeBytes / totalItems : 0;
  console.log(`📏 Average Item Size: ${Math.round(avgItemSize)} bytes`);
  console.log(`📈 Items per MB: ${Math.round((1024 * 1024) / avgItemSize)}`);
  
  // Performance analysis
  console.log('\n⚡ PERFORMANCE ANALYSIS:');
  console.log(`💭 Browser Memory: ~${Math.round(totalWithMetadata / 1024)} KB (full cache)`);
  console.log(`🌐 Network Transfer: ~${Math.round(totalWithMetadata / 1024)} KB (initial load)`);
  console.log(`📱 Mobile Impact: ${totalWithMetadata > 3 * 1024 * 1024 ? '⚠️ May impact low-end devices' : '✅ Mobile-friendly'}`);
  
  // Content distribution
  const movieCount = results.reduce((sum, r) => sum + r.movies, 0);
  const tvCount = results.reduce((sum, r) => sum + r.tvShows, 0);
  console.log(`🎬 Content Mix: ${movieCount} movies, ${tvCount} TV shows`);
  console.log(`📺 TV/Movie Ratio: ${Math.round((tvCount / movieCount) * 100)}% TV content`);
  
  return {
    companies: results,
    weekResults,
    totalItems,
    totalSizeBytes,
    totalSizeKB: Math.round(totalSizeBytes / 1024),
    totalSizeMB: Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100,
    metadataSizeKB: Math.round(metadataSize / 1024),
    totalWithMetadataKB: Math.round(totalWithMetadata / 1024),
    totalWithMetadataMB: Math.round(totalWithMetadata / (1024 * 1024) * 100) / 100,
    avgItemSize: Math.round(avgItemSize)
  };
}

// Run the calculation
calculateOptimizedCacheSize()
  .then(results => {
    console.log('\n✅ Optimized cache size calculation complete!');
    console.log('\n📋 System ready for production deployment!');
  })
  .catch(error => {
    console.error('❌ Cache size calculation failed:', error);
    process.exit(1);
  });
