import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateInvite, acceptInvite } from '../services/inviteService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validatingInvite, setValidatingInvite] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);

  // First, validate the invite without requiring authentication
  useEffect(() => {
    const validateInviteOnly = async () => {
      try {
        if (!projectId || !inviteId) {
          throw new Error('Invalid invite link');
        }

        // Clean the inviteId in case it has any extra text
        const cleanInviteId = inviteId.split('activity')[0]; // Remove any trailing text

        // First validate the invite
        const validationResult = await validateInvite(cleanInviteId, projectId);
        if (!validationResult.isValid) {
          throw new Error('Invalid or expired invite');
        }

        setInviteValid(true);
      } catch (err) {
        console.error('Error validating invite:', err);
        setError(err.message || 'Failed to validate invite');
      } finally {
        setValidatingInvite(false);
      }
    };

    validateInviteOnly();
  }, [projectId, inviteId]);

  // Then, handle the authentication and acceptance flow
  useEffect(() => {
    const processInvite = async () => {
      try {
        if (!inviteValid) return;

        const cleanInviteId = inviteId.split('activity')[0];

        // If user is not logged in, redirect to sign in
        if (!currentUser) {
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${cleanInviteId}`);
          navigate(`/signin?redirect=${returnUrl}`);
          return;
        }

        // Accept the invite
        const { redirect, type } = await acceptInvite(projectId, cleanInviteId, currentUser.email);
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
  }, [projectId, inviteId, currentUser, navigate, inviteValid]);

  if (validatingInvite || loading) {
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

  if (inviteValid && !currentUser) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center gap-4">
        <div className="bg-blue-500/10 text-blue-400 p-4 rounded-lg border border-blue-500/20">
          Please sign in to accept the invitation
        </div>
        <button
          onClick={() => {
            const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId.split('activity')[0]}`);
            navigate(`/signin?redirect=${returnUrl}`);
          }}
          className="px-4 py-2 bg-[#1B2B44] text-[#E5E9F0] rounded-lg hover:bg-[#2B3B54] transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return null;
};

export default InvitePage;  