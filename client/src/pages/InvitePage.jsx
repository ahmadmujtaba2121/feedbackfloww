import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite } from '../services/inviteService';
import { auth, db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let mounted = true;
    let retryTimeout;

    const validateAndRedirect = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        // Wait for auth state to be determined
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });

        // Check if Firebase is initialized
        if (!db) {
          throw new Error('Database not initialized');
        }

        const { projectData, inviteData } = await validateInvite(inviteId, projectId);

        if (!mounted) return;

        // If user is not logged in, redirect to sign in
        if (!auth.currentUser) {
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`);
          return;
        }

        // Update invite status first
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
          'invites': arrayUnion({
            ...inviteData,
            used: true,
            usedAt: new Date().toISOString(),
            usedBy: auth.currentUser?.email || 'anonymous'
          })
        });

        // Then navigate based on role
        if (inviteData.role === 'editor') {
          navigate(`/project/${projectId}/canvas`, { replace: true });
        } else {
          navigate(`/project/${projectId}`, { replace: true });
        }

      } catch (error) {
        console.error('Invite validation error:', error);

        if (!mounted) return;

        if (retryCount < MAX_RETRIES &&
          (error.message.includes('not initialized') ||
            error.message.includes('database connection'))) {
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(validateAndRedirect, 1500 * (retryCount + 1));
        } else {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    validateAndRedirect();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [projectId, inviteId, navigate, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Validating invite link...</p>
          {retryCount > 0 && (
            <p className="text-gray-400 mt-2">
              Initializing... ({retryCount}/{MAX_RETRIES})
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite Link</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitePage;  