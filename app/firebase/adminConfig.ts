import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJSON) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please follow the instructions to update your .env.local file.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJSON);
} catch (error: any) {
  throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
}

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully."); 
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
} else {
  console.log("Firebase Admin SDK already initialized."); 
}


const adminAuth = getAuth();
const adminDb = getFirestore();

export { adminAuth, adminDb };