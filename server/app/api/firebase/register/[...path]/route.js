import { NextResponse } from 'next/server';
import { addUser } from '../../utils/firebaseLogic.js';

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
    const body = await request.json();
    const { username, password, email } = body;
    const userId = await addUser(username, password, email);

    return withCors(NextResponse.json({ userId }));
  } catch (err) {
    console.error('Error registering user:', err);
    return withCors(NextResponse.json({ error: err.message }, { status: 500 }));
  }
}