import { NextResponse } from 'next/server';
import { initializeFirebase } from '../../utils/firebaseAdmin.js';
import { CHALLENGE_COMPANY_MAPPINGS, NO_FILTER_CHALLENGES, SPECIAL_CHALLENGES } from '../config/companyMappings.js';

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
 * Check if a challenge needs updating (older than 7 days)
 */
function needsUpdate(lastUpdated) {
  if (!lastUpdated) return true;
  
  const lastUpdateTime = new Date(lastUpdated);
  const now = new Date();
  const daysSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60 * 24);
  
  return daysSinceUpdate > 7;
}

/**
 * POST /api/firebase/challenge-data/cron-check
 * Checks all challenges and triggers updates for stale data
 * This endpoint is called by Vercel Cron or external cron service
 */
export async function POST(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }

    const { db } = initializeFirebase();
    if (!db) {
      return withCors(NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      ));
    }

    const results = {
      checked: [],
      updated: [],
      skipped: [],
      errors: []
    };

    // Get all challenge blacklists from Firebase
    const blacklistsRef = db.ref('challenge-blacklists');
    const snapshot = await blacklistsRef.once('value');
    const existingData = snapshot.val() || {};

    // Check each company-based challenge
    for (const challengeName of Object.keys(CHALLENGE_COMPANY_MAPPINGS)) {
      try {
        results.checked.push(challengeName);
        
        const challengeData = existingData[challengeName];
        const lastUpdated = challengeData?.lastUpdated;
        
        if (needsUpdate(lastUpdated)) {
          console.log(`Updating stale data for challenge: ${challengeName}`);
          
          // Trigger update by calling the process endpoint internally
          const processUrl = new URL(`${request.url.split('/cron-check')[0]}/process/${challengeName}`);
          
          const processResponse = await fetch(processUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (processResponse.ok) {
            results.updated.push(challengeName);
            console.log(`Successfully updated ${challengeName}`);
          } else {
            const errorText = await processResponse.text();
            console.error(`Failed to update ${challengeName}:`, errorText);
            results.errors.push({
              challenge: challengeName,
              error: `Process failed: ${processResponse.status}`,
              details: errorText
            });
          }
        } else {
          console.log(`Challenge ${challengeName} is up to date`);
          results.skipped.push({
            challenge: challengeName,
            reason: 'up-to-date',
            lastUpdated
          });
        }
      } catch (error) {
        console.error(`Error checking challenge ${challengeName}:`, error);
        results.errors.push({
          challenge: challengeName,
          error: error.message
        });
      }
    }

    // Also check for new challenges that don't have data yet
    for (const challengeName of Object.keys(CHALLENGE_COMPANY_MAPPINGS)) {
      if (!existingData[challengeName] && !results.checked.includes(challengeName)) {
        try {
          console.log(`Creating initial data for new challenge: ${challengeName}`);
          
          const processUrl = new URL(`${request.url.split('/cron-check')[0]}/process/${challengeName}`);
          
          const processResponse = await fetch(processUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (processResponse.ok) {
            results.updated.push(challengeName);
            console.log(`Successfully created initial data for ${challengeName}`);
          } else {
            const errorText = await processResponse.text();
            results.errors.push({
              challenge: challengeName,
              error: `Initial creation failed: ${processResponse.status}`,
              details: errorText
            });
          }
        } catch (error) {
          console.error(`Error creating initial data for ${challengeName}:`, error);
          results.errors.push({
            challenge: challengeName,
            error: error.message
          });
        }
      }
    }

    return withCors(NextResponse.json({
      message: 'Cron check completed',
      timestamp: new Date().toISOString(),
      summary: {
        totalChecked: results.checked.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    }));

  } catch (error) {
    console.error('Error in cron check:', error);
    return withCors(NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    ));
  }
}

/**
 * GET /api/firebase/challenge-data/cron-check
 * Returns status of all challenges (for monitoring)
 */
export async function GET(request) {
  try {
    const { db } = initializeFirebase();
    if (!db) {
      return withCors(NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      ));
    }

    const blacklistsRef = db.ref('challenge-blacklists');
    const snapshot = await blacklistsRef.once('value');
    const existingData = snapshot.val() || {};

    const status = {
      challenges: {},
      summary: {
        total: Object.keys(CHALLENGE_COMPANY_MAPPINGS).length,
        ready: 0,
        stale: 0,
        missing: 0
      }
    };

    for (const challengeName of Object.keys(CHALLENGE_COMPANY_MAPPINGS)) {
      const challengeData = existingData[challengeName];
      const lastUpdated = challengeData?.lastUpdated;
      
      let statusInfo;
      if (!challengeData) {
        statusInfo = { status: 'missing', lastUpdated: null };
        status.summary.missing++;
      } else if (needsUpdate(lastUpdated)) {
        statusInfo = { status: 'stale', lastUpdated };
        status.summary.stale++;
      } else {
        statusInfo = { 
          status: 'ready', 
          lastUpdated,
          stats: {
            blockedMovies: Object.keys(challengeData.blockedMovies || {}).length,
            blockedTvShows: Object.keys(challengeData.blockedTvShows || {}).length
          }
        };
        status.summary.ready++;
      }
      
      status.challenges[challengeName] = statusInfo;
    }

    return withCors(NextResponse.json(status));

  } catch (error) {
    console.error('Error getting challenge status:', error);
    return withCors(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
