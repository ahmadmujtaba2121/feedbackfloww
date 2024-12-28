import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const processInvite = async () => {
      // Prevent multiple processing attempts
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        console.log('Starting invite processing...', { projectId, inviteId });

        // Wait for Firebase to initialize
        let retryCount = 0;
        while (!isFirebaseInitialized() && retryCount < 3) {
          console.log('Waiting for Firebase initialization...', { retryCount });
          await new Promise(resolve => setTimeout(resolve, 1000));
          ensureFirebaseInitialized();
          retryCount++;
        }

        if (!isFirebaseInitialized()) {
          throw new Error('Firebase failed to initialize');
        }

        console.log('Firebase initialized, validating invite...');

        // Validate the invite
        const result = await validateInvite(inviteId, projectId);
        console.log('Invite validation result:', result);

        if (!mounted) {
          console.log('Component unmounted, stopping processing');
          return;
        }

        // Get current user synchronously
        const user = auth.currentUser;
        console.log('Current auth state:', { user: user?.email });

        if (user) {
          console.log('User is logged in, updating invite status...');
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
            console.log('Invite status updated successfully');
          } catch (updateError) {
            console.error('Error updating invite status:', updateError);
            // Continue with navigation even if update fails
          }

          const path = result.inviteData.role === 'editor'
            ? `/project/${projectId}/canvas`
            : `/project/${projectId}`;

          console.log('Navigating to:', path);
          navigate(path, { replace: true });
        } else {
          console.log('User not logged in, redirecting to sign in...');
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`, { replace: true });
        }
      } catch (error) {
        console.error('Invite processing error:', error);
        if (mounted) {
          setError(error.message || 'Failed to process invite');
          setStatus('error');
        }
      } finally {
        if (mounted) {
          setIsProcessing(false);
        }
      }
    };

    // Set timeout for the entire process
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('Process timed out');
        setStatus('timeout');
      }
    }, TIMEOUT_DURATION);

    // Start processing only if not already processing
    if (!isProcessing) {
      processInvite();
    }

    return () => {
      console.log('Cleaning up invite processing...');
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId, inviteId, navigate, isProcessing]);

  // Show appropriate UI based on status
  switch (status) {
    case 'loading':
      return <LoadingScreen message={isProcessing ? "Processing invite..." : "Initializing..."} />;

    case 'timeout':
      return (
        <ErrorScreen
          error="Connection timed out. Please check your internet connection and try again."
          onRetry={() => {
            setStatus('loading');
            setIsProcessing(false);
            window.location.reload();
          }}
          onHome={() => navigate('/')}
        />
      );

    case 'error':
      return (
        <ErrorScreen
          error={error}
          onRetry={() => {
            setStatus('loading');
            setIsProcessing(false);
            window.location.reload();
          }}
          onHome={() => navigate('/')}
        />
      );

    default:
      return <LoadingScreen message="Processing..." />;
  }
};

export default InvitePage;  