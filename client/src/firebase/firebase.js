import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDT4NPibL9xVBKlJW3G3F_xa39xmH-aW2c",
  authDomain: "feedbackflow-ae91d.firebaseapp.com",
  projectId: "feedbackflow-ae91d",
  storageBucket: "feedbackflow-ae91d.appspot.com",
  messagingSenderId: "314519829180",
  appId: "1:314519829180:web:f5fef6bf87d2098544aeb9",
  measurementId: "G-ZNJZ5F7S6G",
  databaseURL: "https://feedbackflow-ae91d-default-rtdb.firebaseio.com"
};

// Initialize Firebase
let app;
let db;
let auth;
let storage;

const initializeFirebase = async () => {
  try {
    if (!getApps().length) {
      console.log('Initializing new Firebase app...');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('Using existing Firebase app');
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialize Firestore with settings
    const firestoreSettings = {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      cacheSizeBytes: 1048576, // 1MB
      merge: true
    };

    // Test connection by trying to access a document
    try {
      const testRef = doc(db, '_test_connection_', 'test');
      await getDoc(testRef);
      console.log('Firestore connection test successful');
    } catch (testError) {
      console.warn('Firestore connection test warning:', testError);
      // Don't throw error, just log warning
    }

    console.log('Firebase services initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
};

// Initialize Firebase with retries
const initializeWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const success = await initializeFirebase();
    if (success) {
      return true;
    }
    console.log(`Initialization attempt ${i + 1} failed, retrying...`);
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
  }
  return false;
};

// Initialize immediately
initializeWithRetry().then(success => {
  if (!success) {
    console.error('Failed to initialize Firebase after retries');
  }
});

export { app, auth, db, storage };
export default app;
