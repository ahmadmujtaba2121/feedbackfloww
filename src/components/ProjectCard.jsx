import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Celebration from './Celebration';

export default function ProjectCard({ project, isOwner }) {
  const [status, setStatus] = useState(project.status || 'pending');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState(null);
  const [lastReviewedBy, setLastReviewedBy] = useState(project.lastReviewedBy);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'projects', project.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const newStatus = data.status;
          const newReviewer = data.lastReviewedBy;

          if (newStatus && newStatus !== status) {
            setStatus(newStatus);
            setLastReviewedBy(newReviewer);
            
            if (isOwner && (newStatus === 'approved' || newStatus === 'rejected')) {
              setCelebrationType(newStatus === 'approved' ? 'approve' : 'reject');
              setShowCelebration(true);
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [project.id, status, isOwner]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
        <p className="text-gray-600 mb-4">{project.description}</p>
        
        <div className="flex flex-col gap-2">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
          
          {lastReviewedBy && (
            <p className="text-sm text-gray-500">
              Last reviewed by: {lastReviewedBy}
            </p>
          )}
        </div>
      </div>

      {showCelebration && (
        <Celebration
          type={celebrationType}
          message={
            celebrationType === 'approve'
              ? 'Your project has been approved! 🎉'
              : 'Your project has been rejected.'
          }
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
} 