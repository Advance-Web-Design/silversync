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

export async function POST(request) {
  try {
    // Check if Firebase is available before importing/using firebaseLogic
    if (!isFirebaseAvailable()) {
      return withCors(NextResponse.json(
        { error: 'Firebase service not available' }, 
        { status: 503 }
      ));
    }    // Dynamically import Firebase logic
    const { updateStudioCacheData } = await import('../utils/studioUpdateLogic.js');
    
    const body = await request.json();
    console.log('🔄 Studio cache refresh triggered:', body);
    
    // Return immediate response - update runs in background
    const response = withCors(NextResponse.json({ 
      message: 'Studio cache update triggered',
      timestamp: new Date().toISOString()
    }));
    
    // Trigger background update (non-blocking)
    updateStudioCacheData().catch(error => {
      console.error('❌ Background studio update failed:', error);
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Error triggering studio cache refresh:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Failed to trigger studio cache refresh',
        message: error.message 
      }, 
      { status: 500 }
    ));
  }
}
