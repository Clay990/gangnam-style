import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Read the secret service account key from the environment variable
const serviceAccountString = process.env.FIREBASE_ADMIN_CONFIG;

if (!serviceAccountString) {
  throw new Error('FIREBASE_ADMIN_CONFIG environment variable is not set.');
}

// Parse the JSON string into an object
let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (error: any) {
  console.error("Failed to parse FIREBASE_ADMIN_CONFIG:", error.message);
  throw new Error('FIREBASE_ADMIN_CONFIG is not a valid JSON string.');
}

// Initialize the Firebase Admin SDK
// We check if it's already initialized to prevent errors during hot-reloading in development
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export the admin auth and firestore instances
const adminAuth = getAuth();
const adminDb = getFirestore();

export { adminAuth, adminDb };

