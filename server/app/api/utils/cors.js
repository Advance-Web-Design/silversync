// CORS utility for Next.js API routes

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function withCors(response) {
  const corsHeaders = getCorsHeaders();
  
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function createCorsResponse(data, options = {}) {
  const response = new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
      ...options.headers,
    },
  });
  
  return response;
}

// Handle preflight OPTIONS requests
export function handlePreflight() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}
