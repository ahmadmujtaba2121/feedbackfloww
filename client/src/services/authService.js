import { 
  signInWithPopup, 
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const checkInternetConnection = () => {
  return navigator.onLine;
};

const createUserDocument = async (user) => {
  if (!user) return null;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        projects: [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, userData);
      console.log('User document created successfully');
    }
    return userDoc;
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    if (!checkInternetConnection()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    console.log('Starting Google sign-in process...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Sign-in successful:', result.user.email);
    
    await createUserDocument(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in window was closed. Please try again.');
    }
    
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      await createUserDocument(result.user);
      return result.user;
    }
  } catch (error) {
    console.error('Redirect result error:', error);
    throw error;
  }
};

export const handleAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await createUserDocument(user);
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    }
    callback(user);
  });
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};
