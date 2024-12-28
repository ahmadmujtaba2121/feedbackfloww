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
    console.log('InvitePage mounted with:', {
      projectId,
      inviteId,
      hasCurrentUser: !!currentUser,
      currentUserEmail: currentUser?.email
    });

    const processInvite = async () => {
      try {
        console.log('Starting invite process...');

        if (!projectId || !inviteId) {
          console.error('Missing projectId or inviteId');
          throw new Error('Invalid invite link');
        }

        // If user is not logged in, redirect to sign in
        if (!currentUser) {
          console.log('User not logged in, redirecting to signin...');
          const redirectPath = `/signin?redirect=/invite/${projectId}/${inviteId}`;
          console.log('Redirect path:', redirectPath);
          navigate(redirectPath);
          return;
        }

        console.log('User logged in, accepting invite...');
        // Accept the invite
        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);
        console.log('Invite accepted, redirecting to:', redirect);

        toast.success('Successfully joined the project!');
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    processInvite();

    return () => {
      console.log('InvitePage unmounting');
    };
  }, [projectId, inviteId, currentUser, navigate]);

  console.log('Rendering InvitePage with state:', { loading, error });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">
            {currentUser ? 'Processing invite...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

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