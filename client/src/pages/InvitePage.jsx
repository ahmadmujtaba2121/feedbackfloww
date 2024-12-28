import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateInvite, acceptInvite } from '../services/inviteService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowLeft } from 'react-icons/fi';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const processInvite = async () => {
      // Skip if already processed or missing params
      if (processed || !projectId || !inviteId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      // Skip if auth is still loading
      if (authLoading) {
        return;
      }

      try {
        // If no user, redirect to sign in
        if (!currentUser) {
          const currentUrl = `/invite/${projectId}/${inviteId}`;
          const redirectUrl = `/signin?redirect=${encodeURIComponent(currentUrl)}`;
          navigate(redirectUrl);
          return;
        }

        console.log('Processing invite:', { projectId, inviteId, userEmail: currentUser.email });

        // Validate the invite
        const invite = await validateInvite(projectId, inviteId);
        console.log('Invite validated:', invite);

        if (mounted) {
          // Accept the invite
          const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);
          console.log('Invite accepted, redirecting to:', redirect);

          // Show success message
          toast.success('Successfully joined the project!');

          // Mark as processed before navigation
          setProcessed(true);

          // Navigate to the project
          navigate(redirect, { replace: true });
        }
      } catch (err) {
        console.error('Error processing invite:', err);
        if (mounted) {
          setError(err.message || 'Failed to process invite');
          setLoading(false);
        }
      }
    };

    processInvite();

    return () => {
      mounted = false;
    };
  }, [projectId, inviteId, currentUser, authLoading, navigate, processed]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-muted-foreground mt-4">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading state while processing invite
  if (loading && !error && !processed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-muted-foreground mt-4">Processing invite...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-foreground rounded-lg shadow-xl p-6 text-center border border-border">
          <h1 className="text-2xl font-bold text-primary mb-4">Invalid Invite</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Return null while processing is happening
  return null;
};

export default InvitePage;  