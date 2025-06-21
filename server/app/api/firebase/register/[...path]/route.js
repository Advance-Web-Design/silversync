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

/**
 * POST handler for user registration
 * This function adds a new user to the Firebase database.
 * @param {*} request 
 * @description This function retrieves the username, hashed password, and email from the request body, and calls the `addUser` function to add the user to the database. If successful, it returns the user ID. If there is an error (e.g., username or email already exists), it returns an error message with a 400 status.
 * @returns user ID or error message
 */
export async function POST(request) {
    try {
        const { addUser } = await import('../../utils/firebaseLogic.js');

        const body = await request.json();

        const { username, hashedPassword, email } = body;
        try {
            const userId = await addUser(username, hashedPassword, email);
            return withCors(NextResponse.json({ success: true, userId }));
        } catch (error) {
            // Forward error to the user with a 400 status (or 409 for conflict)
            console.error('Register error:', error.message);
            return withCors(NextResponse.json({ success: false, message: error.message }, { status: 400 }));
        }
    } catch (err) {
        console.error('Error registering user:', err);
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }));
    }
}