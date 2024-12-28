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
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  // First effect: Handle auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Second effect: Handle invite validation and navigation
  useEffect(() => {
    if (!authChecked) return; // Wait for auth check to complete

    let mounted = true;

    const processInvite = async () => {
      try {
        setLoading(true);
        setError(null);

        // If not logged in, redirect to sign in
        if (!user) {
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`);
          return;
        }

        // Validate the invite
        const { projectData, inviteData } = await validateInvite(inviteId, projectId);

        if (!mounted) return;

        try {
          // Update invite status
          const projectRef = doc(db, 'projects', projectId);
          await updateDoc(projectRef, {
            invites: arrayUnion({
              ...inviteData,
              used: true,
              usedAt: new Date().toISOString(),
              usedBy: user.email
            })
          });

          // Navigate based on role
          const path = inviteData.role === 'editor'
            ? `/project/${projectId}/canvas`
            : `/project/${projectId}`;

          navigate(path, { replace: true });
        } catch (updateError) {
          console.error('Error updating invite status:', updateError);
          // Still navigate even if update fails
          const path = inviteData.role === 'editor'
            ? `/project/${projectId}/canvas`
            : `/project/${projectId}`;

          navigate(path, { replace: true });
        }
      } catch (error) {
        console.error('Invite processing error:', error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    processInvite();

    return () => {
      mounted = false;
    };
  }, [projectId, inviteId, navigate, authChecked, user]);

  // Show loading state while checking auth
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">
            {!authChecked ? "Checking authentication..." : "Validating invite link..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
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