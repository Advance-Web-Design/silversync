import { NextResponse } from 'next/server';
import axios from 'axios';

// TMDB API configurations
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/movie';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

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
      console.log(`Movie API: ${tmdbUrl} with params:`, 
        { ...queryParams, api_key: 'API_KEY_HIDDEN' });
    }
    
    // Forward the request to TMDB using axios
    const response = await axios({
      method: 'get',
      url: tmdbUrl,
      params: queryParams
    });
    
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Error in movie API:', error.message);
    
    if (error.response) {
      return NextResponse.json({ 
        error: error.response.data?.status_message || 'Error from TMDB API',
        status_code: error.response.status
      }, { status: error.response.status });
    }
    
    return NextResponse.json({ error: 'Failed to fetch movie data' }, { status: 500 });
  }
}
