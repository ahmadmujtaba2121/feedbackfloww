import { initializeApp } from 'firebase/app';
import { getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Firebase configuration
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
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

export {
  app,
  auth,
  firestore,
  storage,
  database,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
