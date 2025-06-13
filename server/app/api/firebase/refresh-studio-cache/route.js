import { NextResponse } from 'next/server';
import { isFirebaseAvailable } from '../utils/firebaseAdmin.js';

// Set function timeout for 1-minute update process
export const maxDuration = 59;

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
    // Check if Firebase is available before importing/using firebaseLogic
    if (!isFirebaseAvailable()) {
      return withCors(NextResponse.json(
        { error: 'Firebase service not available' }, 
        { status: 503 }
      ));
    }    // Detect if this is a cron job request
    const userAgent = request.headers.get('user-agent') || '';
    const isCronRequest = userAgent.includes('vercel-cron');
    
    // Calculate current week info
    const now = new Date();
    const weekOfMonth = getWeekOfMonth(now);
    const weekNames = [
      'Week 1 - Marvel/Disney', 
      'Week 2 - DC/Warner', 
      'Week 3 - Universal/Paramount', 
      'Week 4 - Sony/Fox',
      'Week 5 - Streaming/Indie'
    ];
    const currentWeekName = weekNames[weekOfMonth] || `Week ${weekOfMonth + 1}`;    
    let updateOptions = { 
      force: false, 
      reason: isCronRequest ? 'scheduled_weekly_backend' : 'manual',
      scheduled: isCronRequest
    };
    
    try {
      const body = await request.json();
      updateOptions = { 
        ...updateOptions,
        force: body.force || false,
        reason: body.reason || updateOptions.reason
      };
    } catch {
      // Empty body is fine (cron requests have no body)
    }

    console.log(`🕐 Weekly backend cache refresh triggered - Source: ${isCronRequest ? 'CRON' : 'MANUAL'} - ${currentWeekName} at ${new Date().toISOString()}`);

    const { updateStudioCacheData } = await import('../utils/studioUpdateLogic.js');    const response = withCors(NextResponse.json({ 
      message: 'Weekly backend studio cache update triggered',
      updateType: updateOptions.reason,
      scheduled: updateOptions.scheduled,
      week: weekOfMonth + 1,
      weekName: currentWeekName,
      backendOnly: true,
      monthlyProgress: `${weekOfMonth + 1}/5`,
      timestamp: new Date().toISOString(),
      source: isCronRequest ? 'vercel-cron' : 'manual'
    }));// Backend-only update (no client interaction)
    updateStudioCacheData(updateOptions).then(result => {
      console.log(`✅ ${logPrefix} Weekly backend cache update completed (${currentWeekName}):`, result);
    }).catch(error => {
      console.error(`❌ ${logPrefix} Weekly backend cache update failed (${currentWeekName}):`, error);
    });

    return response;

  } catch (error) {
    console.error('❌ Error in weekly backend refresh route:', error);
    
    return withCors(NextResponse.json(
      { 
        error: 'Failed to trigger weekly backend studio cache refresh',
        message: error.message 
      }, 
      { status: 500 }
    ));
  }
}

function getWeekOfMonth(date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstSunday = new Date(firstDayOfMonth);
  firstSunday.setDate(firstSunday.getDate() + (7 - firstSunday.getDay()) % 7);
  
  if (date < firstSunday) return 0;
  
  const daysSinceFirstSunday = Math.floor((date - firstSunday) / (24 * 60 * 60 * 1000));
  return Math.min(Math.floor(daysSinceFirstSunday / 7), 3);
}