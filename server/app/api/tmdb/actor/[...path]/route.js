import { NextResponse } from 'next/server';
import axios from 'axios';

// TMDB API configurations
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/person';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_TOKEN = process.env.TMDB_API_TOKEN;

export async function GET(request, { params }) {
  try {
    // Get the path segments and reassemble them
    const path = params.path ? params.path.join('/') : '';
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {};
    
    // Copy all query parameters from the original request
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Add the API key (kept secure on server)
    queryParams.api_key = TMDB_API_KEY;
    
    // Build the complete URL
    const tmdbUrl = `${TMDB_BASE_URL}${path ? '/' + path : ''}`;
    
    // Log the request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Person API: ${tmdbUrl} with params:`, 
        { ...queryParams, api_key: 'API_KEY_HIDDEN' });
    }
      // Forward the request to TMDB using axios
    console.log(`Making request to TMDB: ${tmdbUrl}`);
    console.log(`API Key (first 4 chars): ${TMDB_API_KEY ? TMDB_API_KEY.substring(0, 4) + '...' : 'undefined'}`);
      const response = await axios({
      method: 'get',
      url: tmdbUrl,
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${TMDB_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`TMDB response status: ${response.status}`);
    return NextResponse.json(response.data);
      } catch (error) {
    console.error('Error in person API:', error.message);
    
    if (error.response) {
      console.error('TMDB API error response:', error.response.data);
      console.error('TMDB API error status:', error.response.status);
      
      return NextResponse.json({ 
        error: error.response.data?.status_message || 'Error from TMDB API',
        status_code: error.response.status,
        details: error.response.data
      }, { status: error.response.status });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch person data', 
      message: error.message
    }, { status: 500 });
  }
}
