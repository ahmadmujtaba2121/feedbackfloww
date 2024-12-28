import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite } from '../services/inviteService';
import { auth, db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkInvite = async () => {
      try {
        // Simple validation
        const { projectData, inviteData } = await validateInvite(inviteId, projectId);

        // Check auth
        if (!auth.currentUser) {
          const returnUrl = encodeURIComponent(`/invite/${projectId}/${inviteId}`);
          navigate(`/signin?redirect=${returnUrl}`);
          return;
        }

        // Update invite status
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
          invites: arrayUnion({
            ...inviteData,
            used: true,
            usedAt: new Date().toISOString(),
            usedBy: auth.currentUser.email
          })
        });

        // Navigate based on role
        const path = inviteData.role === 'editor'
          ? `/project/${projectId}/canvas`
          : `/project/${projectId}`;

        navigate(path);
      } catch (err) {
        setError(err.message);
      }
    };

    checkInvite();
  }, [projectId, inviteId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
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

  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-white mt-4">Processing invite...</p>
      </div>
    </div>
  );
};

export default InvitePage;  