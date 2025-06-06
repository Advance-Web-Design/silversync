import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Only initialize if environment variables are available
if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
  }
}

// Export functions with error handling
export const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase not initialized');
  }
  return apps[0];
};