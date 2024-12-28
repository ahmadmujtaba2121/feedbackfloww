import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { validateInvite } from '../services/inviteService';
import { auth, db, isFirebaseInitialized, ensureFirebaseInitialized } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TIMEOUT_DURATION = 15000;

const LoadingScreen = ({ message }) => (
  <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-white mt-4">{message}</p>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry, onHome }) => (
  <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
    <div className="text-center text-white max-w-md px-4">
      <h1 className="text-2xl font-bold mb-4">Error Processing Invite</h1>
      <p className="text-gray-400 mb-4">{error}</p>
      <div className="space-x-4">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onHome}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  </div>
);

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const processInvite = async () => {
      try {
        // Ensure Firebase is initialized
        if (!isFirebaseInitialized()) {
          const initialized = ensureFirebaseInitialized();
          if (!initialized) {
            throw new Error('Failed to initialize Firebase');
          }
        }

        // First validate the invite
        const result = await validateInvite(inviteId, projectId);

        if (!mounted) return;

        // Check current auth state
        const user = auth.currentUser;

        if (user) {
          // User is logged in, update invite and redirect
          try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
              invites: arrayUnion({
                ...result.inviteData,
                used: true,
                usedAt: new Date().toISOString(),
                usedBy: user.email
              })
            });
          } catch (updateError) {
            console.error('Error updating invite status:', updateError);
          }

          // Navigate to appropriate page
          const path = result.inviteData.role === 'editor'
            ? `/project/${projectId}/canvas`
            : `/project/${projectId}`;

          navigate(path, { replace: true });
        } else {
          // User is not logged in, redirect to sign in
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`, { replace: true });
        }
      } catch (error) {
        console.error('Invite processing error:', error);
        if (mounted) {
          setError(error.message || 'Failed to process invite');
          setStatus('error');
        }
      }
    };

    // Set timeout for the entire process
    timeoutId = setTimeout(() => {
      if (mounted) {
        setStatus('timeout');
      }
    }, TIMEOUT_DURATION);

    // Start processing
    processInvite();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId, inviteId, navigate]);

  // Show appropriate UI based on status
  switch (status) {
    case 'loading':
      return <LoadingScreen message="Processing invite..." />;

    case 'timeout':
      return (
        <ErrorScreen
          error="Connection timed out. Please check your internet connection and try again."
          onRetry={() => window.location.reload()}
          onHome={() => navigate('/')}
        />
      );

    case 'error':
      return (
        <ErrorScreen
          error={error}
          onRetry={() => window.location.reload()}
          onHome={() => navigate('/')}
        />
      );

    default:
      return <LoadingScreen message="Processing..." />;
  }
};

export default InvitePage;  