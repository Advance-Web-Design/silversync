import { NextResponse } from 'next/server';
import { addUser } from '../../utils/firebaseLogic.js';

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




export async function POST(request,{ params }) {
  try {
    const body = await request.json();

    const { username, password, email } = body;
    const userId = await addUser(username, password, email);

    return NextResponse.json({ userId });
  } catch (err) {
    console.error('Error registering user:', err);
    console.log('Error details:',);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}