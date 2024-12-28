import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite } from '../services/inviteService';
import { auth, db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let mounted = true;
    let retryTimeout;

    const validateAndRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if Firebase is initialized
        if (!db) {
          throw new Error('Database not initialized');
        }

        const { projectData, inviteData } = await validateInvite(inviteId, projectId);

        if (!mounted) return;

        if (inviteData.role === 'editor') {
          navigate(`/project/${projectId}/canvas`);
        } else {
          navigate(`/project/${projectId}`);
        }

        // Update invite status
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
          'invites': arrayUnion({
            ...inviteData,
            used: true,
            usedAt: new Date().toISOString(),
            usedBy: auth.currentUser?.email || 'anonymous'
          })
        });

      } catch (error) {
        console.error('Invite validation error:', error);

        if (!mounted) return;

        if (retryCount < MAX_RETRIES && error.message.includes('not initialized')) {
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(validateAndRedirect, 1000 * (retryCount + 1));
        } else {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    validateAndRedirect();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [projectId, inviteId, navigate, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Validating invite link...</p>
          {retryCount > 0 && (
            <p className="text-gray-400 mt-2">Retrying... ({retryCount}/{MAX_RETRIES})</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite Link</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitePage;  