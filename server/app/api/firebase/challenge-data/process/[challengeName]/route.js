import { NextResponse } from 'next/server';
import { initializeFirebase } from '../../../utils/firebaseAdmin.js';
import { getChallengeConfig, NO_FILTER_CHALLENGES, SPECIAL_CHALLENGES } from '../../config/companyMappings.js';
import { generateChallengeBlacklist, validateTMDBConfig } from '../../../../utils/tmdbUtils.js';

// Configure maximum execution time for this endpoint (1 minute - Vercel free plan limit)
export const config = {
  maxDuration: 60
};

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
 * POST /api/firebase/challenge-data/process/[challengeName]
 * Triggers blacklist processing for a specific challenge
 */
export async function POST(request, { params }) {
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
        message: `Challenge ${challengeName} requires no filtering`,
        challenge: challengeName,
        status: 'no-processing-needed'
      }));
    }

    // Handle special challenges
    if (SPECIAL_CHALLENGES[challengeName]) {
      return withCors(NextResponse.json({
        message: `Challenge ${challengeName} uses special filtering rules`,
        challenge: challengeName,
        status: 'no-processing-needed'
      }));
    }

    // Get challenge configuration
    let config;
    try {
      config = getChallengeConfig(challengeName);
    } catch (error) {
      return withCors(NextResponse.json(
        { error: `Unknown challenge: ${challengeName}` },
        { status: 404 }
      ));
    }

    if (!config || !config.companyIds) {
      return withCors(NextResponse.json(
        { error: 'Invalid challenge configuration' },
        { status: 400 }
      ));
    }

    // Validate TMDB configuration
    try {
      validateTMDBConfig();
    } catch (error) {
      return withCors(NextResponse.json(
        { error: 'TMDB configuration error', details: error.message },
        { status: 500 }
      ));
    }

    // Initialize Firebase
    const { db } = initializeFirebase();
    if (!db) {
      return withCors(NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      ));
    }

    // Generate blacklist using the utility function
    const { blockedMovies, blockedTvShows } = await generateChallengeBlacklist(
      challengeName, 
      config.companyIds
    );

    // Store in Firebase
    const challengeRef = db.ref(`challenge-blacklists/${challengeName}`);
    const dataToStore = {
      blockedMovies,
      blockedTvShows,
      lastUpdated: new Date().toISOString(),
      companyIds: config.companyIds,
      generatedAt: new Date().toISOString()
    };

    await challengeRef.set(dataToStore);

    return withCors(NextResponse.json({
      message: 'Blacklist generated successfully',
      challenge: challengeName,
      stats: {
        blockedMovies: Object.keys(blockedMovies).length,
        blockedTvShows: Object.keys(blockedTvShows).length
      },
      lastUpdated: dataToStore.lastUpdated,
      status: 'completed'
    }));

  } catch (error) {
    console.error('Error processing challenge data:', error);
    return withCors(NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    ));
  }
}
