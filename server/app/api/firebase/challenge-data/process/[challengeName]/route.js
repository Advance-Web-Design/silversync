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
    }    // Handle special challenges
    if (SPECIAL_CHALLENGES[challengeName]) {
      // Initialize Firebase
      const { db } = initializeFirebase();
      if (!db) {
        return withCors(NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        ));
      }

      // Store special challenge data
      const challengeRef = db.ref(`challenge-blacklists/${challengeName}`);
      const specialConfig = SPECIAL_CHALLENGES[challengeName];
      const dataToStore = {
        blockedMovies: specialConfig.blockedMovies,
        blockedTvShows: specialConfig.blockedTvShows,
        lastUpdated: new Date().toISOString(),
        fetchMethod: 'special',
        generatedAt: new Date().toISOString(),
        stats: {
          totalMovies: specialConfig.blockedMovies === '*' ? 'ALL' : 0,
          totalTvShows: specialConfig.blockedTvShows === '*' ? 'ALL' : 0
        }
      };

      await challengeRef.set(dataToStore);

      return withCors(NextResponse.json({
        message: `Special challenge ${challengeName} data stored successfully`,
        challenge: challengeName,
        fetchMethod: 'special',
        stats: dataToStore.stats,
        lastUpdated: dataToStore.lastUpdated,
        status: 'completed'
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
    }    // Generate blacklist using both company IDs and names
    const { blockedMovies, blockedTvShows } = await generateChallengeBlacklist(
      challengeName, 
      config.companyIds,
      config.companyNames || []
    );    // Store in Firebase with tracking information
    const challengeRef = db.ref(`challenge-blacklists/${challengeName}`);
    const dataToStore = {
      blockedMovies,
      blockedTvShows,
      lastUpdated: new Date().toISOString(),
      companyIds: config.companyIds,
      companyNames: config.companyNames || [],
      generatedAt: new Date().toISOString(),
      fetchMethod: 'hybrid', // Both company IDs and names
      stats: {
        totalMovies: Object.keys(blockedMovies).length,
        totalTvShows: Object.keys(blockedTvShows).length
      }
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
