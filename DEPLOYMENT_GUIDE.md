# Deployment Configuration Guide

## Current Deployment Status

### ✅ Server Deployed
- **URL**: https://connect-the-shows-server-eight.vercel.app
- **Status**: Successfully deployed with CORS fix

### ✅ Client Deployed  
- **URL**: https://connect-the-shows-client-git-dev-idshay16s-projects.vercel.app
- **Status**: Successfully deployed with proper styling

## Required Environment Variable Setup

### 1. Server Environment Variables (Vercel Dashboard)

Go to: https://vercel.com/dashboard → connect-the-shows-server → Settings → Environment Variables

Add the following variables:

```
ALLOWED_ORIGIN = https://connect-the-shows-client-git-dev-idshay16s-projects.vercel.app
TMDB_API_KEY = [Your TMDB API Key]
FIREBASE_PROJECT_ID = [Your Firebase Project ID]
FIREBASE_PRIVATE_KEY = [Your Firebase Private Key - include quotes and line breaks]
FIREBASE_CLIENT_EMAIL = [Your Firebase Service Account Email]
```

### 2. Client Environment Variables (Vercel Dashboard)

Go to: https://vercel.com/dashboard → connect-the-shows-client → Settings → Environment Variables

Add the following variable:

```
VITE_BACKEND_URL = https://connect-the-shows-server-eight.vercel.app
```

## After Setting Environment Variables

1. **Trigger Redeployment**: 
   - Go to each project's Vercel dashboard
   - Click "Deployments" tab
   - Click "..." on the latest deployment → "Redeploy"

2. **Test the Application**:
   - Visit: https://connect-the-shows-client-git-dev-idshay16s-projects.vercel.app
   - Try searching for actors/movies
   - Verify API calls work without CORS errors

## Quick Test Commands

Test server endpoint:
```
curl https://connect-the-shows-server-eight.vercel.app/api/tmdb/search?query=tom
```

Test CORS headers:
```
curl -H "Origin: https://connect-the-shows-client-git-dev-idshay16s-projects.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://connect-the-shows-server-eight.vercel.app/api/tmdb/search
```

## File Changes Made

### CORS Fix:
- ✅ Fixed `server/middleware.js` - replaced hardcoded placeholder with `ALLOWED_ORIGIN` env var
- ✅ Server uses environment variable `ALLOWED_ORIGIN` or falls back to `*`

### API Configuration:
- ✅ Client properly configured to use `VITE_BACKEND_URL` environment variable
- ✅ Falls back to correct server URL if env var not set

## Troubleshooting

If you still see CORS errors after setting up environment variables:
1. Verify environment variables are set correctly in Vercel dashboard
2. Redeploy both projects
3. Check browser network tab for actual request/response headers
4. Verify client is making requests to the correct server URL
