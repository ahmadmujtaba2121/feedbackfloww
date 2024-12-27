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
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`);
          return;
        }

        // First validate the invite
        const validationResult = await validateInvite(inviteId);
        if (!validationResult.isValid) {
          throw new Error('Invalid or expired invite');
        }

        // Check if the project ID matches
        if (validationResult.projectId !== projectId) {
          throw new Error('Invalid project ID');
        }

        // Accept the invite
        const { redirect, type } = await acceptInvite(projectId, inviteId, currentUser.email);
        toast.success(`Successfully joined the project as ${type === 'team' ? 'a team member' : 'a viewer'}!`);
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
        toast.error(err.message || 'Failed to process invite');
      } finally {
        setLoading(false);
      }
    };

    processInvite();
  }, [projectId, inviteId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center gap-4">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/20">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#1B2B44] text-[#E5E9F0] rounded-lg hover:bg-[#2B3B54] transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return null;
};

export default InvitePage;  