import { NextResponse } from 'next/server';

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

/**
 * POST handler for user login
 * This function verifies the user's credentials and returns the user profile if successful.
 * @param {*} request 
 * @description This function retrieves the username and hashed password from the request body, verifies the user using the `verifyUser` function, and returns the user profile if successful. If verification fails, it returns an error message with a 400 status.
 * @returns user profile or error message
 */
export async function POST(request) {
  try {

    const { forgotPassword } = await import('../../utils/firebaseLogic.js');

    const { username, email } = await request.json();
    try {
      const forgotPasswordReply = await forgotPassword(username, email);

      return withCors(NextResponse.json({ success: true, forgotPasswordReply }));
    }
    catch (error) {
      // Forward error to the user with a 400 status
      console.error('User forgot password error:', error.message);
      return withCors(NextResponse.json({ success: false, message: error.message }, { status: 400 }));
    }
  } catch (err) {

    console.error('Error resetting password for user:', err);
    return withCors(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
  }
}