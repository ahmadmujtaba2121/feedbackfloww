import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateInvite, acceptInvite } from '../services/inviteService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteProcessed, setInviteProcessed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const processInvite = async () => {
      // Don't process if already done or if auth is still loading
      if (inviteProcessed || authLoading) return;

      try {
        console.log('Processing invite:', {
          projectId,
          inviteId,
          hasUser: !!currentUser,
          userEmail: currentUser?.email
        });

        if (!projectId || !inviteId) {
          throw new Error('Invalid invite link');
        }

        if (!currentUser) {
          console.log('No user, redirecting to signin');
          const redirectPath = `/signin?redirect=/invite/${projectId}/${inviteId}`;
          navigate(redirectPath);
          return;
        }

        // Accept the invite
        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);

        if (mounted) {
          setInviteProcessed(true);
          toast.success('Successfully joined the project!');
          navigate(redirect, { replace: true });
        }
      } catch (err) {
        console.error('Invite error:', err);
        if (mounted) {
          setError(err.message || 'Failed to process invite');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    processInvite();

    return () => {
      mounted = false;
    };
  }, [projectId, inviteId, currentUser, authLoading, navigate, inviteProcessed]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while processing invite
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Processing invite...</p>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  return null;
};

export default InvitePage;  