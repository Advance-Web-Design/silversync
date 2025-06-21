import { NextResponse } from 'next/server';
import { initializeFirebase } from '../utils/firebaseAdmin.js';

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

export async function GET(request) {
  try {
    const { db } = initializeFirebase();
    
    // Get challenge parameter from URL search params
    const url = new URL(request.url);
    const challengeId = url.searchParams.get('challenge') || 'all';
    
    // Try to get dedicated leaderboards first (new structure)
    const dedicatedLeaderboardsSnapshot = await db.ref('leaderboards').once('value');
    const dedicatedLeaderboards = dedicatedLeaderboardsSnapshot.val();
    
    // If we have dedicated leaderboards and requesting a specific challenge
    if (dedicatedLeaderboards && challengeId !== 'all' && dedicatedLeaderboards[challengeId]) {
      return withCors(NextResponse.json(dedicatedLeaderboards[challengeId], { status: 200 }));
    }
    
    // If we have all dedicated leaderboards and requesting all
    if (dedicatedLeaderboards && challengeId === 'all') {
      return withCors(NextResponse.json(dedicatedLeaderboards, { status: 200 }));
    }

    // Fallback to building leaderboards from user game history (backward compatibility)
    const usersSnapshot = await db.ref('users').once('value');
    const allUsers = usersSnapshot.val();

    if (!allUsers) {
      return withCors(NextResponse.json([], { status: 200 }));
    }

    let leaderboards = {};
    
    // Process all users to build leaderboards for each challenge
    for (const username in allUsers) {
      const gameHistory = allUsers[username].gamehistory;
      if (!gameHistory) continue;

      for (const mode in gameHistory) {
        // Initialize leaderboard for this challenge if it doesn't exist
        if (!leaderboards[mode]) {
          leaderboards[mode] = [];
        }        // Process each game in this mode
        gameHistory[mode].forEach(entry => {
          const leaderboardEntry = {
            rank: 0, // Will be set after sorting
            username,
            score: entry.score,
            time: entry.timeTaken,
            startingActor1: entry.startingActor1,
            startingActor2: entry.startingActor2,
            pathLength: entry.pathLength,
            fullPath: entry.fullPath || [],
            completedAt: entry.completedAt
          };
          
          leaderboards[mode].push(leaderboardEntry);
        });
      }
    }    // Sort and rank each challenge leaderboard
    for (const mode in leaderboards) {
      // Sort by score (higher is better), then by time (faster is better)
      leaderboards[mode].sort((a, b) => {
        if (a.score === b.score) {
          // If scores are equal, sort by time (convert to numbers for proper comparison)
          const timeA = typeof a.time === 'string' ? parseInt(a.time) : a.time;
          const timeB = typeof b.time === 'string' ? parseInt(b.time) : b.time;
          return timeA - timeB; // Lower time is better
        }
        return b.score - a.score; // Higher score is better
      });

      // Assign ranks and keep only top 10
      leaderboards[mode] = leaderboards[mode]
        .slice(0, 10)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
    }

    // Return specific challenge leaderboard or all leaderboards
    if (challengeId === 'all') {
      return withCors(NextResponse.json(leaderboards, { status: 200 }));
    } else {
      const challengeLeaderboard = leaderboards[challengeId] || [];
      return withCors(NextResponse.json(challengeLeaderboard, { status: 200 }));
    }

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch leaderboard' }, 
      { status: 500 }
    ));
  }
}
