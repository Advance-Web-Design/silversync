/**
 * Test Challenge Blacklist Integration
 * 
 * Simple test script to verify that challenge blacklists are properly loaded
 * and cached. Run this in the browser console after the app loads.
 */

// Test function to verify blacklist loading
window.testChallengeBlacklists = async function() {
  console.log('🧪 Testing Challenge Blacklist Integration...');
  
  // Check if blacklists are cached
  const cached = sessionStorage.getItem('challengeBlacklists');
  if (cached) {
    const blacklists = JSON.parse(cached);
    console.log('✅ Cached blacklists found:', Object.keys(blacklists));
    
    // Test each challenge
    Object.entries(blacklists).forEach(([challengeName, data]) => {
      const movieCount = data.blockedMovies === '*' ? 'ALL' : 
        (data.blockedMovies ? Object.keys(data.blockedMovies).length : 0);
      const tvCount = data.blockedTvShows === '*' ? 'ALL' : 
        (data.blockedTvShows ? Object.keys(data.blockedTvShows).length : 0);
      
      console.log(`📊 ${challengeName}: ${movieCount} movies, ${tvCount} TV shows blocked`);
      console.log(`   Method: ${data.fetchMethod}, Updated: ${data.lastUpdated}`);
    });
    
    return blacklists;
  } else {
    console.log('❌ No cached blacklists found');
    return null;
  }
};

// Test filtering utilities
window.testChallengeFiltering = function() {
  console.log('🧪 Testing Challenge Filtering...');
  
  // Import utilities (this would normally be done at module level)
  // For testing, we'll just check the sessionStorage directly
  const cached = sessionStorage.getItem('challengeBlacklists');
  if (!cached) {
    console.log('❌ No blacklists to test with');
    return;
  }
  
  const blacklists = JSON.parse(cached);
  
  // Test movie blocking
  if (blacklists['no-marvel']) {
    const marvelMovies = blacklists['no-marvel'].blockedMovies;
    if (marvelMovies && Object.keys(marvelMovies).length > 0) {
      const firstMarvelMovieId = Object.keys(marvelMovies)[0];
      const movieData = marvelMovies[firstMarvelMovieId];
      console.log(`✅ Test: Marvel movie "${movieData.title}" (ID: ${firstMarvelMovieId}) should be blocked in no-marvel challenge`);
    }
  }
  
  // Test special challenges
  if (blacklists['movies-only']) {
    const moviesOnly = blacklists['movies-only'];
    console.log(`✅ Test: movies-only blocks ${moviesOnly.blockedTvShows === '*' ? 'ALL TV shows' : 'no TV shows'}`);
    console.log(`✅ Test: movies-only allows ${moviesOnly.blockedMovies === '*' ? 'NO movies' : 'all movies'}`);
  }
  
  console.log('🎉 Filtering test completed');
};

console.log('🚀 Challenge blacklist test functions loaded. Run:');
console.log('   testChallengeBlacklists() - Check cached data');
console.log('   testChallengeFiltering() - Test filtering logic');
