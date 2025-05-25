import { NextResponse } from 'next/server';

/**
 * Catch-all handler for TMDB API proxy
 * This handles any TMDB endpoint that doesn't have a specific route
 */
export async function GET(request, { params }) {
  try {
    // Get the path from the URL segments
    const path = params.path.join('/');
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Copy existing query parameters
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    // Use Bearer token for authentication (recommended by TMDB)
    const apiUrl = `https://api.themoviedb.org/3/${path}?${queryParams.toString()}`;
    
    // Set up headers for TMDB request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    // Make the request to TMDB API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`Error in TMDB catch-all route (${params.path?.join('/')}):`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from TMDB' }, 
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  // Handle POST requests if needed
  try {
    const body = await request.json();
    const path = params.path.join('/');
    
    // Similar logic for POST requests
    // Most TMDB endpoints are GET, but this provides flexibility
    
    const queryParams = new URLSearchParams(body);
    queryParams.append('api_key', process.env.TMDB_API_KEY);
    
    const apiUrl = `https://api.themoviedb.org/3/${path}?${queryParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET', // Most TMDB calls are still GET even when we POST to our API
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
      }
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in TMDB POST catch-all route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}