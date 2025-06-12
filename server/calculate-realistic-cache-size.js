/**
 * Realistic Cache Size Calculator with ALL Cast Members
 * 
 * Calculates the expected cache size based on:
 * - 10 companies with varying content amounts
 * - ALL cast members per movie/TV show (not limited to 50)
 * - 2 pages per company query
 * - Real-world TMDB cast sizes
 */

const fetch = require('node-fetch');

// TMDB API Token from .env
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZGZkMTY4ZTUyN2ExYzg2YzM3OWU2YmI2YjdjM2E5ZiIsIm5iZiI6MTc0NTEzMzk4OS4wNTMsInN1YiI6IjY4MDRhMWE1NmUxYTc2OWU4MWVlMDg3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Hs2RaAd_2xRcdxTfL0JJkTUhosZFrjLvsUhLaX5rVq8';

// Company configuration - matches server configuration
const COMPANIES = [
  { id: 420, name: 'Marvel Studios', key: 'marvel' },
  { id: 7505, name: 'Marvel Entertainment', key: 'marvel_entertainment' },
  { id: 2, name: 'Walt Disney Pictures', key: 'disney' },
  { id: 6125, name: 'Walt Disney Animation Studios', key: 'disney_animation' },
  { id: 9993, name: 'DC Entertainment', key: 'dc' },
  { id: 429, name: 'DC Comics', key: 'dc_comics' },
  { id: 1, name: 'Lucasfilm', key: 'lucasfilm' },
  { id: 3, name: 'Pixar Animation Studios', key: 'pixar' },
  { id: 33, name: 'Universal Pictures', key: 'universal' },
  { id: 4, name: 'Paramount Pictures', key: 'paramount' }
];

const MAX_ITEMS_PER_COMPANY = 80;
const MAX_PAGES_PER_QUERY = 2;

/**
 * Fetch sample data for a company to estimate sizes
 */
async function analyzeCompany(company) {
  try {
    console.log(`\n🏢 Analyzing ${company.name} (ID: ${company.id})...`);
    
    // Fetch movies and TV shows
    const [movies, tvShows] = await Promise.all([
      fetchCompanyMovies(company.id),
      fetchCompanyTvShows(company.id)
    ]);
    
    const allItems = [...movies, ...tvShows]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, MAX_ITEMS_PER_COMPANY);
    
    console.log(`   📊 Found ${movies.length} movies, ${tvShows.length} TV shows`);
    console.log(`   🎯 Processing top ${allItems.length} items for analysis`);
    
    // Analyze first 5 items for detailed cast information
    const sampleSize = Math.min(5, allItems.length);
    let totalCastMembers = 0;
    let totalItemSize = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const item = allItems[i];
      const details = await fetchItemDetails(item);
      const compressedItem = compressCompanyItem(item, details, company.name);
      
      const castCount = compressedItem.cast ? compressedItem.cast.length : 0;
      const itemSize = JSON.stringify(compressedItem).length;
      
      totalCastMembers += castCount;
      totalItemSize += itemSize;
      
      console.log(`   📺 "${item.title || item.name}" - ${castCount} cast, ${Math.round(itemSize/1024)}KB`);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const avgCastPerItem = Math.round(totalCastMembers / sampleSize);
    const avgSizePerItem = Math.round(totalItemSize / sampleSize);
    const estimatedTotalSize = avgSizePerItem * allItems.length;
    
    return {
      company: company.name,
      totalItems: allItems.length,
      avgCastPerItem,
      avgSizePerItem,
      estimatedTotalSize,
      sampleSize
    };
    
  } catch (error) {
    console.error(`❌ Error analyzing ${company.name}:`, error.message);
    return {
      company: company.name,
      totalItems: 0,
      avgCastPerItem: 0,
      avgSizePerItem: 0,
      estimatedTotalSize: 0,
      error: error.message
    };
  }
}

/**
 * Fetch movies for a company
 */
async function fetchCompanyMovies(companyId) {
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
    
    if (!response.ok) break;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) break;
    
    allMovies.push(...data.results.map(movie => ({
      ...movie,
      media_type: 'movie'
    })));
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allMovies;
}

/**
 * Fetch TV shows for a company
 */
async function fetchCompanyTvShows(companyId) {
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
    
    if (!response.ok) break;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) break;
    
    allShows.push(...data.results.map(show => ({
      ...show,
      media_type: 'tv'
    })));
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allShows;
}

/**
 * Fetch detailed information for an item
 */
async function fetchItemDetails(item) {
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
}

/**
 * Compress company item - matches server logic exactly
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
    
    // ALL cast data for proper game connections
    cast: extractAllCast(details),
    
    // Additional metadata
    overview: item.overview ? item.overview.substring(0, 200) + '...' : null,
    genre_ids: item.genre_ids?.slice(0, 3) || []
  };
  
  return compressed;
}

/**
 * Extract ALL cast members - matches server logic exactly
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
 * Main analysis function
 */
async function calculateRealisticCacheSize() {
  console.log('🚀 Starting Realistic Cache Size Analysis with ALL Cast Members...');
  console.log('📊 Configuration:');
  console.log(`   - ${COMPANIES.length} companies`);
  console.log(`   - Max ${MAX_ITEMS_PER_COMPANY} items per company`);
  console.log(`   - ${MAX_PAGES_PER_QUERY} pages per query`);
  console.log(`   - ALL cast members included (no limit)`);
  
  const results = [];
  let totalItems = 0;
  let totalSize = 0;
  let totalCastMembers = 0;
  
  // Analyze first 3 companies for detailed estimates
  const companiesToAnalyze = COMPANIES.slice(0, 3);
  
  for (const company of companiesToAnalyze) {
    const result = await analyzeCompany(company);
    results.push(result);
    
    totalItems += result.totalItems;
    totalSize += result.estimatedTotalSize;
    totalCastMembers += (result.avgCastPerItem * result.totalItems);
    
    // Add delay between companies
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate averages and extrapolate
  const avgItemsPerCompany = Math.round(totalItems / companiesToAnalyze.length);
  const avgSizePerCompany = Math.round(totalSize / companiesToAnalyze.length);
  const avgCastPerCompany = Math.round(totalCastMembers / companiesToAnalyze.length);
  
  // Extrapolate to all 10 companies
  const estimatedTotalItems = avgItemsPerCompany * COMPANIES.length;
  const estimatedTotalSize = avgSizePerCompany * COMPANIES.length;
  const estimatedTotalCast = avgCastPerCompany * COMPANIES.length;
  
  console.log('\n📈 REALISTIC CACHE SIZE ANALYSIS RESULTS:');
  console.log('=' * 60);
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.company}: Error - ${result.error}`);
    } else {
      console.log(`✅ ${result.company}:`);
      console.log(`   📦 ${result.totalItems} items`);
      console.log(`   👥 Avg ${result.avgCastPerItem} cast per item`);
      console.log(`   📏 Avg ${Math.round(result.avgSizePerItem/1024)}KB per item`);
      console.log(`   💾 Total: ${Math.round(result.estimatedTotalSize/1024/1024*100)/100}MB`);
    }
  });
  
  console.log('\n🎯 EXTRAPOLATED TOTALS (All 10 Companies):');
  console.log(`📦 Total Items: ${estimatedTotalItems}`);
  console.log(`👥 Total Cast Members: ${estimatedTotalCast.toLocaleString()}`);
  console.log(`💾 Total Cache Size: ${Math.round(estimatedTotalSize/1024/1024*100)/100}MB`);
  console.log(`📊 Average per Company: ${Math.round(avgSizePerCompany/1024/1024*100)/100}MB`);
  console.log(`📏 Average per Item: ${Math.round((estimatedTotalSize/estimatedTotalItems)/1024)}KB`);
  
  console.log('\n⚖️ CACHE CAPACITY ANALYSIS:');
  console.log(`🔥 Hot Cache (2MB): Can hold ~${Math.round(2*1024*1024/(estimatedTotalSize/estimatedTotalItems))} items`);
  console.log(`🔥 Warm Cache (5MB): Can hold ~${Math.round(5*1024*1024/(estimatedTotalSize/estimatedTotalItems))} items`);
  console.log(`❄️ Cold Cache (3MB): Can hold ~${Math.round(3*1024*1024/(estimatedTotalSize/estimatedTotalItems))} items`);
  
  const canFitInWarm = estimatedTotalSize <= (5 * 1024 * 1024);
  console.log(`📋 Full dataset fits in Warm Cache: ${canFitInWarm ? '✅ YES' : '❌ NO'}`);
  
  if (!canFitInWarm) {
    console.log(`⚠️ Recommendation: Consider increasing Warm Cache to ${Math.ceil(estimatedTotalSize/1024/1024)}MB`);
  }
  
  console.log('\n✨ Cache size analysis complete!');
}

// Error handling wrapper
async function main() {
  try {
    await calculateRealisticCacheSize();
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = { calculateRealisticCacheSize };
