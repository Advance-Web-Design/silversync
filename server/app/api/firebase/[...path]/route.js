

// this file is just to see if the API calls are correct, do not uncomment unless it's for test purposes






// import { NextResponse } from 'next/server';
// import { handlePreflight, withCors } from '../../utils/cors.js';

// /**
//  * Catch-all handler for Firebase API proxy
//  * This handles any Firebase endpoint that doesn't have a specific route
//  */

// // Handle preflight OPTIONS requests
// export async function OPTIONS() {
//     return handlePreflight();
// }

// export async function GET(request, { params }) {

//     console.log('Request URL:', request.url);
//     console.log('Request Headers:', request.headers);
//     try {
//         // AWAIT params before using it (Next.js 15 requirement)
//         const resolvedParams = await params;
//         const path = resolvedParams.path.join('/');

//         // Extract query parameters
//         const { searchParams } = new URL(request.url);
//         const queryParams = new URLSearchParams();
//         searchParams.forEach((value, key) => {
//             queryParams.append(key, value);

//         });

//         // Construct your Firebase API URL here
//         // Example: Replace with your actual Firebase endpoint and authentication as needed
//         //const FIREBASE_BASE_URL = process.env.FIREBASE_API_BASE_URL || 'https://your-firebase-project.firebaseio.com';
//         const FIREBASE_BASE_URL = process.env.FIREBASE_DATABASE_URL
        
//         const apiUrl = `${FIREBASE_BASE_URL}/${path}.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

//         // Set up headers if needed (add auth if required)
//         const headers = {
//             'Content-Type': 'application/json'
//             // Add Authorization or other headers if your Firebase rules require it
//         };

//         const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             return withCors(NextResponse.json(errorData, { status: response.status }));
//         }

//         const data = await response.json();
//         return withCors(NextResponse.json(data));
//     } catch (error) {
//         console.error(`Error in Firebase catch-all route:`, error);
//         return withCors(NextResponse.json(
//             { error: 'Failed to fetch data from Firebase' },
//             { status: 500 }
//         ));
//     }
// }

// export async function POST(request, { params }) {
//     try {
//         const resolvedParams = await params;
//         const path = resolvedParams.path.join('/');

//         const body = await request.json();

//         // Construct your Firebase API URL here
//         //const FIREBASE_BASE_URL = process.env.FIREBASE_API_BASE_URL || 'https://your-firebase-project.firebaseio.com';
//         const FIREBASE_BASE_URL = process.env.FIREBASE_DATABASE_URL

        
//         const apiUrl = `${FIREBASE_BASE_URL}/${path}.json`;

//         const headers = {
//             'Content-Type': 'application/json'
//             // Add Authorization or other headers if your Firebase rules require it
//         };

//         const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify(body)
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             return withCors(NextResponse.json(errorData, { status: response.status }));
//         }

//         const data = await response.json();
//         return withCors(NextResponse.json(data));
//     } catch (error) {
//         console.error('Error in Firebase POST catch-all route:', error);
//         return withCors(NextResponse.json(
//             { error: 'Failed to process request' },
//             { status: 500 }
//         ));
//     }
// }

