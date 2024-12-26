import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const SignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        projects: []
      });

      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error(error.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-[#2DD4BF]">Feedback</span>
            <span className="text-[#E5E9F0]">Flow</span>
          </h1>
          <p className="mt-2 text-[#94A3B8]">Create your account</p>
        </div>

        {/* Sign Up Button */}
        <div className="bg-[#0A1628]/95 backdrop-blur-lg rounded-lg shadow-xl p-8 border border-[#1B2B44]">
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg shadow-sm bg-[#1B2B44] text-[#E5E9F0] hover:bg-[#2B3B54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF] transition-all transform hover:scale-105"
          >
            <FcGoogle className="h-6 w-6" />
            <span className="ml-3 text-lg">Continue with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-[#94A3B8]">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
