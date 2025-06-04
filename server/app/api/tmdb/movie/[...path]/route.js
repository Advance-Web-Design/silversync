import { NextResponse } from 'next/server';

// TMDB API configurations
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/movie';

// CORS utility functions (inlined to avoid import issues in serverless)
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

function withCors(response) {
  const corsHeaders = getCorsHeaders();
  
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

function handlePreflight() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

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
      console.log(`Movie API: ${tmdbUrl}`);
    }
    
    // Use Bearer token for authentication (same as other routes)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    // Forward the request to TMDB using fetch
    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers,
      next: { revalidate: 60 } // Cache for 60 seconds
    });
      if (!response.ok) {
      const errorData = await response.json();
      console.error('Movie API error:', errorData);
      return withCors(NextResponse.json(errorData, { status: response.status }));
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data));
    
  } catch (error) {
    console.error('Error in movie API:', error);
    return withCors(NextResponse.json({ error: 'Failed to fetch movie data' }, { status: 500 }));
  }
}
