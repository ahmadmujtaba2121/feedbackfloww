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
    const handleInvite = async () => {
      try {
        if (!projectId || !inviteId) {
          throw new Error('Invalid invite link');
        }

        if (!currentUser) {
          navigate(`/signin?redirect=/invite/${projectId}/${inviteId}`);
          return;
        }

        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);
        toast.success('Successfully joined the project!');
        navigate(redirect);
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
      } finally {
        setLoading(false);
      }
    };

    handleInvite();
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