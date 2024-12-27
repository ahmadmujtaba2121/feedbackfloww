import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

const initializeFirebase = () => {
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

    // Set Firestore settings
    const settings = {
      experimentalForceLongPolling: true, // This may help with connection issues
      merge: true
    };

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

// Initialize Firebase
const isInitialized = initializeFirebase();

if (!isInitialized) {
  console.error('Failed to initialize Firebase, retrying...');
  // Retry initialization
  setTimeout(initializeFirebase, 1000);
}

export { app, auth, db, storage };
export default app;
