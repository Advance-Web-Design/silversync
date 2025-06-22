import { NextResponse } from 'next/server';
import { initializeFirebase } from '../../utils/firebaseAdmin.js';
import { getChallengeConfig, NO_FILTER_CHALLENGES, SPECIAL_CHALLENGES } from '../config/companyMappings.js';

// CORS utility functions
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
 * GET /api/firebase/challenge-data/[challengeName]
 * Serves blacklist data for a specific challenge
 */
export async function GET(request, { params }) {
  try {
    const challengeName = params.challengeName;
    
    // Validate challenge name
    if (!challengeName || typeof challengeName !== 'string') {
      return withCors(NextResponse.json(
        { error: 'Invalid challenge name' },
        { status: 400 }
      ));
    }

    // Handle no-filter challenges
    if (NO_FILTER_CHALLENGES.includes(challengeName)) {
      return withCors(NextResponse.json({
        challenge: challengeName,
        blockedMovies: {},
        blockedTvShows: {},
        lastUpdated: new Date().toISOString(),
        type: 'no-filter'
      }));
    }

    // Handle special challenges (movies-only, tv-only)
    if (SPECIAL_CHALLENGES[challengeName]) {
      const config = SPECIAL_CHALLENGES[challengeName];
      return withCors(NextResponse.json({
        challenge: challengeName,
        blockedMovies: config.blockedMovies === '*' ? '*' : {},
        blockedTvShows: config.blockedTvShows === '*' ? '*' : {},
        lastUpdated: new Date().toISOString(),
        type: 'special'
      }));
    }

    // Validate challenge exists in company mappings
    try {
      getChallengeConfig(challengeName);
    } catch (error) {
      return withCors(NextResponse.json(
        { error: `Unknown challenge: ${challengeName}` },
        { status: 404 }
      ));
    }

    // Get blacklist from Firebase
    const { db } = initializeFirebase();
    if (!db) {
      return withCors(NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      ));
    }

    const challengeRef = db.ref(`challenge-blacklists/${challengeName}`);
    const snapshot = await challengeRef.once('value');
    const data = snapshot.val();

    if (!data) {
      // No data exists yet - return empty blacklists
      return withCors(NextResponse.json({
        challenge: challengeName,
        blockedMovies: {},
        blockedTvShows: {},
        lastUpdated: null,
        type: 'company-filtered',
        status: 'pending-generation'
      }));
    }

    // Return existing data
    return withCors(NextResponse.json({
      challenge: challengeName,
      blockedMovies: data.blockedMovies || {},
      blockedTvShows: data.blockedTvShows || {},
      lastUpdated: data.lastUpdated,
      type: 'company-filtered',
      status: 'ready'
    }));

  } catch (error) {
    console.error('Error fetching challenge data:', error);
    return withCors(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
