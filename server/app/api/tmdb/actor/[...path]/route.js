import { NextResponse } from 'next/server';
import { handlePreflight, withCors } from '../../../utils/cors.js';

// TMDB API configurations
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/person';

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(request, { params }) {
  try {
    // AWAIT params before using it (Next.js 15 requirement)
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Copy all query parameters from the original request
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    // Build the complete URL
    const tmdbUrl = `${TMDB_BASE_URL}${path ? '/' + path : ''}?${queryParams.toString()}`;
    
    // Log the request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Person API: ${tmdbUrl}`);
    }
    
    // Use Bearer token for authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    // Forward the request to TMDB
    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers,
      next: { revalidate: 60 } // Cache for 60 seconds
    });
      if (!response.ok) {
      const errorData = await response.json();
      console.error('Person API error:', errorData);
      return withCors(NextResponse.json(errorData, { status: response.status }));
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data));
    
  } catch (error) {
    console.error('Error in person API:', error);
    return withCors(NextResponse.json({ 
      error: 'Failed to fetch person data',
      message: error.message 
    }, { status: 500 }));
  }
}
