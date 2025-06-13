import { NextResponse } from 'next/server';
import { isFirebaseAvailable } from '../utils/firebaseAdmin.js';

// Set function timeout for longer update process
export const maxDuration = 300; // 5 minutes

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
    }

    // Detect if this is a cron job request
    const userAgent = request.headers.get('user-agent') || '';
    const isCronRequest = userAgent.includes('vercel-cron');
    
    // Parse request body (cron requests have empty body)
    let updateOptions = { 
      force: false, 
      reason: isCronRequest ? 'scheduled_monthly' : 'manual',
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

    console.log(`🕐 Cache refresh triggered - Source: ${isCronRequest ? 'CRON' : 'MANUAL'} at ${new Date().toISOString()}`);

    // Dynamic import for performance
    const { updateStudioCacheData } = await import('../utils/studioUpdateLogic.js');

    // Return immediate response
    const response = withCors(NextResponse.json({ 
      message: 'Studio cache update triggered',
      updateType: updateOptions.reason,
      scheduled: updateOptions.scheduled,
      timestamp: new Date().toISOString(),
      source: isCronRequest ? 'vercel-cron' : 'manual'
    }));

    // Trigger background update
    updateStudioCacheData(updateOptions).then(result => {
      console.log('✅ Studio cache update completed:', result);
    }).catch(error => {
      console.error('❌ Studio cache update failed:', error);
    });

    return response;

  } catch (error) {
    console.error('❌ Error in refresh-studio-cache route:', error);
    
    return withCors(NextResponse.json(
      { 
        error: 'Failed to trigger studio cache refresh',
        message: error.message 
      }, 
      { status: 500 }
    ));
  }
}
