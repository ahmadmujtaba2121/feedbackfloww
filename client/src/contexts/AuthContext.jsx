import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authTimeout;

    // Set a timeout to prevent infinite loading
    authTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        setInitialized(true);
        console.log('Auth initialization timed out');
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (mounted) {
        setCurrentUser(user);
        setLoading(false);
        setInitialized(true);
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
      }
    }, (error) => {
      console.error('Auth state error:', error);
      if (mounted) {
        setError(error);
        setLoading(false);
        setInitialized(true);
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
      }
    });

    return () => {
      mounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      unsubscribe();
    };
  }, []);

  const signup = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    initialized,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
