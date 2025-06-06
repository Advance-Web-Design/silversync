import { initializeApp, getApps, cert } from 'firebase-admin/app';

let firebaseApp = null;
let initializationAttempted = false;

// Lazy initialization function - only runs when actually needed
const initializeFirebase = () => {
  if (initializationAttempted) {
    return firebaseApp;
  }
  
  initializationAttempted = true;
  
  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }
  
  // Only initialize if all required environment variables are available
  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_CLIENT_EMAIL || 
      !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase environment variables not available');
    return null;
  }
  
  try {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    return firebaseApp;
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
    firebaseApp = null;
    return null;
  }
};

// Export functions with lazy initialization
export const getFirebaseApp = () => {
  const app = initializeFirebase();
  if (!app) {
    throw new Error('Firebase not initialized - check environment variables');
  }
  return app;
};

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
  return initializeFirebase() !== null;
};