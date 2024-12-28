import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCopy, FiCheck, FiX, FiUsers, FiEye } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ShareModal = ({ isOpen, onClose, projectId }) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [accessType, setAccessType] = useState('viewer'); // 'viewer' or 'editor'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      setCopied(true);
      toast.success('Project code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error('Failed to copy project code');
    }
  };

  const updateProjectAccess = async (type) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        accessType: type
      });
      toast.success(`Project access updated to ${type}`);
      setAccessType(type);
    } catch (error) {
      console.error('Error updating project access:', error);
      toast.error('Failed to update project access');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg bg-foreground rounded-lg shadow-xl p-6 border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-primary">Share Project</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-background rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Share this project code with team members. Choose the access level for new members:
              </p>

              {/* Access Type Selection */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => updateProjectAccess('viewer')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center space-x-2 ${accessType === 'viewer'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border hover:bg-muted'
                    }`}
                >
                  <FiEye className="w-5 h-5" />
                  <span>Viewer Access</span>
                </button>
                <button
                  onClick={() => updateProjectAccess('editor')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center space-x-2 ${accessType === 'editor'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border hover:bg-muted'
                    }`}
                >
                  <FiUsers className="w-5 h-5" />
                  <span>Editor Access</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-background p-3 rounded-lg border border-border font-mono">
                    {projectId}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Team members can join by going to /join and entering this code. They will join with {accessType} access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal; 