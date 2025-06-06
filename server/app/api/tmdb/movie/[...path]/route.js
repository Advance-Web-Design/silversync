import { NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3/movie';

// CORS utility functions for Vercel Functions
function getCorsHeaders(request) {
  const origin = request.headers.get('origin');
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://connect-the-shows-client-git-dev-idshay16s-projects.vercel.app',
    /^https:\/\/connect-the-shows-client.*\.vercel\.app$/
  ];

  const isAllowed = allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    }
    return allowedOrigin.test(origin);
  });

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function withCors(response, request) {
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS(request) {
  return withCors(new Response(null, { status: 200 }), request);
}

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const path = pathSegments.slice(3).join('/'); // Remove 'api', 'tmdb', 'movie'
    
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
      console.error('Movie API error:', errorData);
      return withCors(NextResponse.json(errorData, { status: response.status }), request);
    }
    
    const data = await response.json();
    return withCors(NextResponse.json(data), request);
    
  } catch (error) {
    console.error('Error in movie API:', error);
    return withCors(NextResponse.json({ 
      error: 'Failed to fetch movie data',
      message: error.message 
    }, { status: 500 }), request);
  }
}
