import { NextResponse } from 'next/server';

// Cache initialization flag to prevent multiple runs
let cacheInitialized = false;

export function middleware(request) {
  // Initialize studio cache on first request (non-blocking)
  if (!cacheInitialized) {
    cacheInitialized = true;
    
    // Import and initialize cache update logic in background
    import('./app/api/firebase/utils/studioUpdateLogic.js')
      .then(({ initializeStudioCacheUpdater }) => {
        initializeStudioCacheUpdater().catch(error => {
          console.error('❌ Studio cache initialization failed:', error);
        });
      })
      .catch(error => {
        console.warn('Studio cache module not available:', error);
      });
  }

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },      });
    }

    // Add CORS headers to API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
