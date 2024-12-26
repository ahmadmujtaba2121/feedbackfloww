import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export default function ReviewPanel({ projectId }) {
  const { currentUser } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [projectStatus, setProjectStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId || !currentUser) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          setIsOwner(data.owner === currentUser.email);
          setProjectStatus(data.status || 'pending');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, currentUser]);

  const handleStatusUpdate = async (status) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: status,
        updatedAt: new Date().toISOString(),
        lastReviewedBy: currentUser.email
      });
      
      setProjectStatus(status);
      toast.success(`Project ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Status:</span>
        <span className={`px-2 py-1 rounded text-sm ${
          projectStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
          projectStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {projectStatus?.charAt(0).toUpperCase() + projectStatus?.slice(1)}
        </span>
      </div>

      {/* Review Buttons - Show for everyone except owner */}
      {!isOwner && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleStatusUpdate('approved')}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            disabled={projectStatus === 'approved'}
          >
            Approve Project
          </button>
          <button
            onClick={() => handleStatusUpdate('rejected')}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            disabled={projectStatus === 'rejected'}
          >
            Reject Project
          </button>
        </div>
      )}
    </div>
  );
} 