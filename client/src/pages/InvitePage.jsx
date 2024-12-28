import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite } from '../services/inviteService';
import { auth, db, isFirebaseInitialized, ensureFirebaseInitialized } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TIMEOUT_DURATION = 10000; // 10 seconds timeout

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  // First effect: Handle auth state with timeout
  useEffect(() => {
    let timeoutId;
    let authUnsubscribe;

    const checkAuth = () => {
      // First ensure Firebase is initialized
      if (!isFirebaseInitialized()) {
        const initialized = ensureFirebaseInitialized();
        if (!initialized) {
          setError('Failed to initialize Firebase');
          setLoading(false);
          return;
        }
      }

      authUnsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
        setAuthChecked(true);
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Set timeout for auth check
      timeoutId = setTimeout(() => {
        setTimeoutOccurred(true);
        setLoading(false);
        if (authUnsubscribe) authUnsubscribe();
      }, TIMEOUT_DURATION);
    };

    checkAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (authUnsubscribe) authUnsubscribe();
    };
  }, []);

  // Second effect: Handle invite validation and navigation
  useEffect(() => {
    if (!authChecked || timeoutOccurred) return;

    let mounted = true;
    let processTimeout;

    const processInvite = async () => {
      try {
        if (!user) {
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`, { replace: true });
          return;
        }

        const { projectData, inviteData } = await validateInvite(inviteId, projectId);

        if (!mounted) return;

        try {
          const projectRef = doc(db, 'projects', projectId);
          await updateDoc(projectRef, {
            invites: arrayUnion({
              ...inviteData,
              used: true,
              usedAt: new Date().toISOString(),
              usedBy: user.email
            })
          });
        } catch (updateError) {
          console.error('Error updating invite status:', updateError);
          // Continue with navigation even if update fails
        }

        // Navigate regardless of update success
        const path = inviteData.role === 'editor'
          ? `/project/${projectId}/canvas`
          : `/project/${projectId}`;

        navigate(path, { replace: true });
      } catch (error) {
        console.error('Invite processing error:', error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    processTimeout = setTimeout(processInvite, 0);

    return () => {
      mounted = false;
      if (processTimeout) clearTimeout(processTimeout);
    };
  }, [projectId, inviteId, navigate, authChecked, user, timeoutOccurred]);

  if (timeoutOccurred) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Connection Timeout</h1>
          <p className="text-gray-400 mb-4">Failed to establish connection. Please try again.</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">
            {!authChecked ? "Initializing..." : "Processing invite..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error Processing Invite</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitePage;  