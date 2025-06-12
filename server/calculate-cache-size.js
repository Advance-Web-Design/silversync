/**
 * Cache Size Calculator
 * 
 * Tests actual TMDB data availability for each company and calculates realistic cache size
 */

// Read environment variables from .env file and parent directory
const fs = require('fs');
const path = require('path');

// Simple .env reader
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local')
  ];
  
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        console.log(`Loading environment from: ${envPath}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            if (value) {
              process.env[key.trim()] = value;
            }
          }
        });
        break;
      }
    } catch (error) {
      console.warn(`Could not load ${envPath}:`, error.message);
    }
  }
}

loadEnv();

// TMDB API Token from .env file
const TMDB_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZGZkMTY4ZTUyN2ExYzg2YzM3OWU2YmI2YjdjM2E5ZiIsIm5iZiI6MTc0NTEzMzk4OS4wNTMsInN1YiI6IjY4MDRhMWE1NmUxYTc2OWU4MWVlMDg3NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Hs2RaAd_2xRcdxTfL0JJkTUhosZFrjLvsUhLaX5rVq8';

// Check for API token
if (!TMDB_API_TOKEN) {
  console.error('❌ TMDB API token not found!');
  console.log('Please set TMDB_API_TOKEN in your environment or .env file');
  console.log('You can get one from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}

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

const MAX_PAGES_PER_QUERY = 2;
const MAX_ITEMS_PER_COMPANY = 80;

/**
 * Fetch movies for a company
 */
async function fetchCompanyMovies(companyId) {
  try {
    const allMovies = [];
    
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_TOKEN}`,
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
    
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_TOKEN}`,
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
      : `https://api.themoviedb.org/3/tv/${item.id}?append_to_response=credits`;    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_TOKEN}`,
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
    cast: extractTopCast(details),
    overview: item.overview ? item.overview.substring(0, 200) + '...' : null,
    genre_ids: item.genre_ids?.slice(0, 3) || []
  };
  
  return compressed;
}

/**
 * Extract top 50 cast members
 */
function extractTopCast(details) {
  if (!details?.credits?.cast) return [];
  
  return details.credits.cast
    .slice(0, 50)
    .map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      order: actor.order
    }));
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
  console.log(`\n🏢 Processing ${company.name} (ID: ${company.id})...`);
  
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
    
    // Process a sample of 10 items to estimate size
    const sampleSize = Math.min(10, sortedItems.length);
    const sampleItems = sortedItems.slice(0, sampleSize);
    
    let totalSampleSize = 0;
    let processedSample = 0;
    
    for (const item of sampleItems) {
      try {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const details = await fetchItemDetails(item);
        const compressed = compressCompanyItem(item, details, company.name);
        const itemSize = calculateSize(compressed);
        
        totalSampleSize += itemSize;
        processedSample++;
        
        console.log(`  📦 ${item.title || item.name}: ${itemSize} bytes`);
        
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
 * Main function to calculate total cache size
 */
async function calculateTotalCacheSize() {
  console.log('🚀 Starting cache size calculation...');
  console.log(`📋 Testing ${COMPANIES.length} companies with max ${MAX_ITEMS_PER_COMPANY} items each`);
  console.time('cache-size-calculation');
  
  const results = [];
  let totalItems = 0;
  let totalSizeBytes = 0;
  
  // Process each company
  for (const company of COMPANIES) {
    try {
      const result = await processCompanySize(company);
      results.push(result);
      
      totalItems += result.processedItems;
      totalSizeBytes += result.sizeBytes;
      
    } catch (error) {
      console.error(`Error processing ${company.name}:`, error);
      results.push({
        company: company.name,
        key: company.key,
        id: company.id,
        error: error.message,
        processedItems: 0,
        sizeBytes: 0
      });
    }
  }
  
  // Calculate metadata size (search index, company info, etc.)
  const metadataSize = 50 * 1024; // Estimated 50KB for metadata
  const totalWithMetadata = totalSizeBytes + metadataSize;
  
  console.timeEnd('cache-size-calculation');
  
  // Generate summary report
  console.log('\n📊 CACHE SIZE ANALYSIS RESULTS');
  console.log('='.repeat(80));
  
  console.log('\nPER-COMPANY BREAKDOWN:');
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.company}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${result.company}: ${result.processedItems} items, ${result.sizeMB} MB (${result.movies}M + ${result.tvShows}TV)`);
    }
  });
  
  console.log('\nSIZE SUMMARY:');
  console.log(`📦 Total Items: ${totalItems}`);
  console.log(`💾 Cache Data: ${Math.round(totalSizeBytes / 1024)} KB (${Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100} MB)`);
  console.log(`🔍 Metadata: ${Math.round(metadataSize / 1024)} KB`);
  console.log(`📊 Total Cache: ${Math.round(totalWithMetadata / 1024)} KB (${Math.round(totalWithMetadata / (1024 * 1024) * 100) / 100} MB)`);
  
  const avgItemSize = totalItems > 0 ? totalSizeBytes / totalItems : 0;
  console.log(`📏 Average Item Size: ${Math.round(avgItemSize)} bytes`);
  
  // Calculate tier distributions
  const hotTierSize = Math.min(totalWithMetadata, 2 * 1024 * 1024); // 2MB max
  const warmTierSize = Math.min(totalWithMetadata - hotTierSize, 5 * 1024 * 1024); // 5MB max
  const coldTierSize = totalWithMetadata - hotTierSize - warmTierSize;
  
  console.log('\nTIER DISTRIBUTION:');
  console.log(`🔥 Hot Tier: ${Math.round(hotTierSize / 1024)} KB`);
  console.log(`🌡️  Warm Tier: ${Math.round(warmTierSize / 1024)} KB`);
  console.log(`❄️  Cold Tier: ${Math.round(coldTierSize / 1024)} KB`);
  
  // Memory usage estimates
  console.log('\nMEMORY IMPACT:');
  console.log(`💭 Browser Memory: ~${Math.round(hotTierSize / 1024)} KB (Hot tier only)`);
  console.log(`💾 SessionStorage: ~${Math.round(coldTierSize / 1024)} KB (Cold tier)`);
  console.log(`🌐 Network Transfer: ~${Math.round(totalWithMetadata / 1024)} KB (Full cache)`);
  
  return {
    companies: results,
    totalItems,
    totalSizeBytes,
    totalSizeKB: Math.round(totalSizeBytes / 1024),
    totalSizeMB: Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100,
    metadataSizeKB: Math.round(metadataSize / 1024),
    totalWithMetadataKB: Math.round(totalWithMetadata / 1024),
    totalWithMetadataMB: Math.round(totalWithMetadata / (1024 * 1024) * 100) / 100,
    avgItemSize: Math.round(avgItemSize),
    hotTierKB: Math.round(hotTierSize / 1024),
    warmTierKB: Math.round(warmTierSize / 1024),
    coldTierKB: Math.round(coldTierSize / 1024)
  };
}

// Run the calculation
calculateTotalCacheSize()
  .then(results => {
    console.log('\n✅ Cache size calculation complete!');
    console.log('\n📋 Results saved for implementation planning');
  })
  .catch(error => {
    console.error('❌ Cache size calculation failed:', error);
    process.exit(1);
  });
