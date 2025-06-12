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

    const { verifyUser } = await import('../../utils/firebaseLogic.js');

    const { username, hashedPassword } = await request.json();
    try {
      const userProfile = await verifyUser(username, hashedPassword);

      return withCors(NextResponse.json({ success: true, userProfile }));
    }
    catch (error) {
      // Forward error to the user with a 400 status
      console.error('User Login error:', error.message);
      return withCors(NextResponse.json({ success: false, message: error.message }, { status: 400 }));
    }
  } catch (err) {

    console.error('Error logging in user:', err);
    return withCors(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
  }
}