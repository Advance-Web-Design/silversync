// Test the exact API calls the application makes
async function testActorFetch() {
  try {
    console.log('Testing fetchRandomPerson workflow...');
    
    // Step 1: Get popular people (this is what fetchRandomPerson does first)
    console.log('Step 1: Getting popular people...');
    const page = Math.floor(Math.random() * 10) + 1;
    const popularResponse = await fetch(`http://localhost:3000/api/tmdb/person/popular?page=${page}`);
    console.log('Popular people response status:', popularResponse.status);
    
    if (!popularResponse.ok) {
      const errorText = await popularResponse.text();
      console.error('Popular people error:', errorText);
      return;
    }
    
    const popularData = await popularResponse.json();
    console.log('Popular people success, total results:', popularData.total_results);
    
    if (!popularData.results || popularData.results.length === 0) {
      console.error('No popular people found in results');
      return;
    }
    
    // Step 2: Get a random person from the results
    const randomIndex = Math.floor(Math.random() * popularData.results.length);
    const randomPersonId = popularData.results[randomIndex].id;
    console.log('Selected random person ID:', randomPersonId, 'Name:', popularData.results[randomIndex].name);
    
    // Step 3: Get person details (this is what getPersonDetails does)
    console.log('Step 3: Getting person details...');
    const detailsResponse = await fetch(`http://localhost:3000/api/tmdb/person/${randomPersonId}?append_to_response=movie_credits,tv_credits,images`);
    console.log('Person details response status:', detailsResponse.status);
    
    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Person details error:', errorText);
      return;
    }
    
    const personDetails = await detailsResponse.json();
    console.log('Person details success for:', personDetails.name);
    console.log('Movie credits count:', personDetails.movie_credits?.cast?.length || 0);
    console.log('TV credits count:', personDetails.tv_credits?.cast?.length || 0);
    
    console.log('✅ Full fetchRandomPerson workflow completed successfully!');
    
  } catch (error) {
    console.error('❌ Network or parsing error:', error);
  }
}

testActorFetch();
