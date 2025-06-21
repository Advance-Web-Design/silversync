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
 * POST handler for updating user profile
 * This function verifies the user's credentials and returns the user profile if successful.
 * @param {*} request 
 * @description This function retrieves the username and hashed password from the request body, verifies the user using the `verifyUser` function, and returns the user profile if successful. If verification fails, it returns an error message with a 400 status.
 * @returns user profile or error message
 */
export async function POST(request) {
  try {

    const { verifyUser } = await import('../../utils/firebaseLogic.js');

    const { username, userDetails, hashedPassword } = await request.json();
    try {
      const userProfile = await verifyUser(username, hashedPassword);
        if (!userProfile) {
            throw new Error('User not found or invalid credentials');
        }        else
        {
            // Update user profile with new details
            const { updateUserProfile } = await import('../../utils/firebaseLogic.js');
            await updateUserProfile(username, userDetails, hashedPassword);
            
            // Update the userProfile object with the new details
            if (userDetails.email) {
                userProfile.email = userDetails.email;
            }
            // Note: We don't update password in the userProfile as it's not returned for security
        }

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