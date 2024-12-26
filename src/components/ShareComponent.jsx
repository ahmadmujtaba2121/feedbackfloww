import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ShareComponent = ({ projectId }) => {
  const { currentUser } = useAuth();
  const [inviteLink, setInviteLink] = useState('');

  const generateInviteLink = async () => {
    try {
      const inviteId = `${projectId}_${Date.now()}`;
      const inviteUrl = `${window.location.origin}/invite/${inviteId}`;
      
      // Save invite link to the project document
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        invites: arrayUnion(inviteId)
      });

      setInviteLink(inviteUrl);
      toast.success('Invite link generated successfully');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    }
  };

  return (
    <div>
      <button onClick={generateInviteLink} className="btn btn-primary">
        Generate Invite Link
      </button>
      {inviteLink && (
        <div>
          <input type="text" value={inviteLink} readOnly className="input input-bordered" />
          <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="btn btn-secondary">
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareComponent;
