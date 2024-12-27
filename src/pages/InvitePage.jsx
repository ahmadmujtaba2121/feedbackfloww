import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { validateInvite, acceptInvite } from '../services/inviteService.ts';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowLeft } from 'react-icons/fi';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const InvitePage = () => {
  const { projectId, inviteId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkInvite = async () => {
      try {
        if (!projectId || !inviteId) {
          throw new Error('Invalid invite link');
        }

        // If user is not logged in, redirect to sign in
        if (!currentUser) {
          navigate(`/signin?redirect=/invite/${projectId}/${inviteId}`);
          return;
        }

        // Validate and accept the invite
        const invite = await validateInvite(projectId, inviteId);
        const { redirect } = await acceptInvite(projectId, inviteId, currentUser.email);

        // Show success message with proper role
        toast.success(`You've been added as a ${invite.role || 'viewer'}`);

        // Navigate to the canvas page
        navigate(redirect, { replace: true });
      } catch (err) {
        console.error('Error processing invite:', err);
        setError(err.message || 'Failed to process invite');
      } finally {
        setLoading(false);
      }
    };

    const handleInvite = async () => {
      try {
        const [projectId] = inviteId.split('_');
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }

        const projectData = projectDoc.data();
        if (!projectData.invites.includes(inviteId)) {
          throw new Error('Invalid invite link');
        }

        const memberData = {
          email: currentUser.email,
          role: 'member',
          addedAt: new Date().toISOString(),
          status: 'active'
        };

        await updateDoc(projectRef, {
          members: arrayUnion(memberData),
          invites: projectData.invites.filter(id => id !== inviteId)
        });

        toast.success('You have been added to the project');
        navigate(`/project/${projectId}`);
      } catch (error) {
        console.error('Error handling invite:', error);
        toast.error('Failed to join the project');
        navigate('/');
      }
    };

    if (currentUser) {
      handleInvite();
    } else {
      checkInvite();
    }
  }, [projectId, inviteId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Invite</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default InvitePage;