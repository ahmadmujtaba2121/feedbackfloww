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

let app;
let auth;
let db;
let storage;

const initializeFirebase = () => {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Set Firestore settings for better reliability
    db.settings({
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
      cacheSizeBytes: 1048576 // 1MB
    });

    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Export initialized instances
export { app, auth, db, storage };

// Export initialization function for explicit initialization
export const ensureFirebaseInitialized = () => {
  if (!app || !auth || !db || !storage) {
    return initializeFirebase();
  }
  return true;
};

// Export a function to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  return !!(app && auth && db && storage);
};
