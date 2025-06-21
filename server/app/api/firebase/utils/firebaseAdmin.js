import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';




let app = null;
let db = null;

/**
 * Initializes Firebase Admin SDK with the provided configuration.  
 * If Firebase is already initialized, it returns the existing app and database instances.
 * @returns {Object} An object containing the Firebase app and database instances.
 * @throws {Error} If there is an error during initialization.
 * @description This function checks if Firebase has already been initialized. If not, it initializes Firebase with the configuration from environment variables. It also handles errors during initialization and logs appropriate messages.
 * */
export const initializeFirebase = () => {
    if (app && db) {
        console.log('Firebase already initialized');
        return { app, db };
    }
    try {
        console.log('Initializing Firebase...');
        const firebaseAdminConfig = {
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        };

        if (getApps().length === 0) {
            app = initializeApp(firebaseAdminConfig);
        } else {
            app = getApp();
        } 
        db = getDatabase(app);
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return null;
    }
    return { app, db };
}

export const getDatabaseReference = () => {
    if (!db) {
        throw new Error('Firebase database not initialized');
    }
    return db;
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

    if (app === null) {
        console.log('Firebase not initialized, attempting to initialize...');
        initializeFirebase();
    }

    return app !== null;
};

