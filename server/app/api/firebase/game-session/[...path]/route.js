import { NextResponse } from 'next/server';
import { isFirebaseAvailable } from '../../utils/firebaseAdmin.js';

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
    }

    // Dynamically import firebaseLogic only when Firebase is available
    const { recordGameSession } = await import('../../utils/firebaseLogic.js');
    
    const sessionData = await request.json();
    const gameId = await recordGameSession(sessionData);
    return withCors(NextResponse.json({ gameId }));
  } catch (err) {
    console.error('Error recording game session:', err);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }));
  }
}