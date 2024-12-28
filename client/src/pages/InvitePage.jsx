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

  useEffect(() => {
    const processInvite = async () => {
      if (!projectId || !inviteId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        // If auth is still loading, wait
        if (authLoading) return;

        // If no user, redirect to sign in
        if (!currentUser) {
          const redirectUrl = `/signin?redirect=/invite/${projectId}/${inviteId}`;
          navigate(redirectUrl);
          return;
        }

        // Validate the invite first
        const invite = await validateInvite(projectId, inviteId);

        // If invite is valid, accept it
        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);

        // Show success message
        toast.success(`Successfully joined the project as ${invite.role || 'viewer'}`);

        // Navigate to the project
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
        setLoading(false);
      }
    };

    processInvite();
  }, [projectId, inviteId, currentUser, authLoading, navigate]);

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

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-muted-foreground mt-4">Processing invite...</p>
        </div>
      </div>
    );
  }

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

  return null;
};

export default InvitePage;  