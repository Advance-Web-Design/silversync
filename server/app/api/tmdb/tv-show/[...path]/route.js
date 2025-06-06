import { NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3/tv';

// CORS utility functions for Vercel Functions
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGIN || '*' 
      : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function withCors(response) {
  const corsHeaders = getCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const path = pathSegments.slice(3).join('/'); // Remove 'api', 'tmdb', 'tv-show'
    
    // Extract query parameters
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    const tmdbUrl = `${TMDB_BASE_URL}${path ? '/' + path : ''}?${queryParams.toString()}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('TV API error:', errorData);
      return withCors(NextResponse.json(errorData, { status: response.status }));
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data));
    
  } catch (error) {
    console.error('Error in TV API:', error);
    return withCors(NextResponse.json({ 
      error: 'Failed to fetch TV show data',
      message: error.message 
    }, { status: 500 }));
  }
}
