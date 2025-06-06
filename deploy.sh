#!/bin/bash

# This script is for automated CLI deployment
# Since you're using dashboard deployment, you can skip running this

echo "=== Connect The Shows Deployment Helper ==="
echo ""
echo "You're deploying via Vercel Dashboard, so this script is optional."
echo ""
echo "Manual deployment steps:"
echo "1. Deploy server project first from /server folder"
echo "2. Get the server URL from Vercel dashboard"  
echo "3. Add VITE_BACKEND_URL environment variable to client project"
echo "4. Deploy client project from /client folder"
echo ""
echo "Server environment variables needed:"
echo "- TMDB_API_KEY"
echo "- TMDB_API_TOKEN" 
echo "- FIREBASE_* (all Firebase config vars)"
echo ""
echo "Client environment variables needed:"
echo "- VITE_BACKEND_URL=https://your-server-project.vercel.app/api"
echo ""
echo "If you want to use CLI deployment instead, run:"
echo "chmod +x deploy.sh && ./deploy.sh"

# Uncomment below for actual CLI deployment
# cd server && vercel --prod
# cd ../client && vercel --prod