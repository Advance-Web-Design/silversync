import { NextResponse } from 'next/server';

/**
 * Catch-all handler for TMDB API proxy
 * This handles any TMDB endpoint that doesn't have a specific route
 */

// CORS utility functions (inlined to avoid import issues in serverless)
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGIN || '*' 
      : '*',
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
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const path = pathSegments.slice(2).join('/'); // Remove 'api', 'tmdb'
    
    // Extract query parameters
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    const apiUrl = `https://api.themoviedb.org/3/${path}?${queryParams.toString()}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return withCors(NextResponse.json(errorData, { status: response.status }));
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data));
    
  } catch (error) {
    console.error(`Error in TMDB catch-all route:`, error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch data from TMDB' },
      { status: 500 }
    ));
  }
}

export async function POST(request, { params }) {
  try {
    // AWAIT params before using it (Next.js 15 requirement)
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    
    const body = await request.json();
    
    // Similar logic for POST requests
    // Most TMDB endpoints are GET, but this provides flexibility
    
    const queryParams = new URLSearchParams(body);
    const apiUrl = `https://api.themoviedb.org/3/${path}?${queryParams.toString()}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_API_TOKEN}`
    };
    
    const response = await fetch(apiUrl, {
      method: 'GET', // Most TMDB calls are still GET even when we POST to our API
      headers
    });
      if (!response.ok) {
      const errorData = await response.json();
      return withCors(NextResponse.json(errorData, { status: response.status }));
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data));
    
  } catch (error) {
    console.error('Error in TMDB POST catch-all route:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    ));
  }
}