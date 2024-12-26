import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid package

export default function ProjectView() {
  const { projectId, inviteId } = useParams();
  const location = useLocation();
  const isInviteView = location.pathname.includes('/invite/');

  const generateAndCopyInviteLink = async () => {
    try {
      // Generate a unique inviteId
      const inviteId = uuidv4().slice(0, 20);
      
      // Store the inviteId in the project document
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        // Add or update invites array in the project document
        await updateDoc(projectRef, {
          invites: [...(projectDoc.data().invites || []), inviteId]
        });

        // Create the invite link
        const inviteLink = `${window.location.origin}/invite/${projectId}/${inviteId}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(inviteLink);
        
        // Show success message (you can use your preferred notification system)
        alert('Invite link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Failed to generate invite link');
    }
  };

  // Generate the correct canvas URL based on whether this is an invite view
  const getCanvasUrl = () => {
    if (isInviteView) {
      return `/invite/${projectId}/${inviteId}/canvas`;
    }
    return `/project/${projectId}/canvas`;
  };

  return (
    <div>
      {/* ... other project view content ... */}
      
      <Link
        to={getCanvasUrl()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Open in Canvas
      </Link>

      {/* Only show share button if not in invite view */}
      {!isInviteView && (
        <button
          onClick={generateAndCopyInviteLink}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ml-2"
        >
          Share Project
        </button>
      )}
      
      {/* ... rest of your project view UI ... */}
    </div>
  );
} 