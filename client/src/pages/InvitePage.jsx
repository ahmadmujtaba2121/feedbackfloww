import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateInvite, acceptInvite } from '../services/inviteService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processInvite = async () => {
      try {
        if (!projectId || !inviteId) {
          throw new Error('Invalid invite link');
        }

        // If user is not logged in, redirect to sign in
        if (!currentUser) {
          navigate(`/signin?redirect=/invite/${projectId}/${inviteId}`);
          return;
        }

        // First validate the invite
        const invite = await validateInvite(projectId, inviteId);

        if (!invite) {
          throw new Error('Invalid or expired invite link');
        }

        // Accept the invite and get redirect URL
        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);

        // Show success message with proper role
        toast.success(`Successfully joined the project as ${invite.role || 'viewer'}!`);

        // Navigate to the project
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
      } finally {
        setLoading(false);
      }
    };

    processInvite();
  }, [projectId, inviteId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  return null;
};

export default InvitePage; 