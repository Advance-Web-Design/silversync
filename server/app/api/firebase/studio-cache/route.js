import { NextResponse } from 'next/server';
import { isFirebaseAvailable } from '../utils/firebaseAdmin.js';

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
    // Check if Firebase is available before importing/using firebaseLogic
    if (!isFirebaseAvailable()) {
      return withCors(NextResponse.json(
        { error: 'Firebase service not available' }, 
        { status: 503 }
      ));
    }    
    // Dynamically import Firebase logic
    const { getStudioCacheData } = await import('../utils/studioUpdateLogic.js');
    
    console.log('📡 Studio cache data requested');
    
    const studioData = await getStudioCacheData();
    
    if (!studioData) {
      return withCors(NextResponse.json(
        { 
          error: 'Studio cache data not available',
          message: 'Cache may be initializing or needs update'
        }, 
        { status: 404 }
      ));
    }
      console.log(`✅ Returning studio cache data: version ${studioData.metadata?.version || 'unknown'}`);
    
    return withCors(NextResponse.json(studioData));
    
  } catch (error) {
    console.error('❌ Error retrieving studio cache:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Failed to retrieve studio cache',
        message: error.message 
      }, 
      { status: 500 }
    ));
  }
}