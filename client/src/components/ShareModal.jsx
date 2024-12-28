import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCopy, FiCheck, FiX, FiUsers, FiEye } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '../firebase/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

const ShareModal = ({ isOpen, onClose, projectId }) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [accessType, setAccessType] = useState('viewer');
  const [accessCodes, setAccessCodes] = useState({ viewer: '', editor: '' });

  useEffect(() => {
    const fetchProjectCodes = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const data = projectDoc.data();
          setAccessCodes({
            viewer: data.viewerCode || '',
            editor: data.editorCode || ''
          });
        }
      } catch (error) {
        console.error('Error fetching project codes:', error);
      }
    };

    if (isOpen) {
      fetchProjectCodes();
    }
  }, [isOpen, projectId]);

  const generateAccessCode = async (type) => {
    try {
      const newCode = nanoid(8); // Generate 8 character code
      const projectRef = doc(db, 'projects', projectId);

      const updateData = {
        [`${type}Code`]: newCode,
        accessCodes: {
          ...(accessCodes || {}),
          [type]: newCode
        },
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser.email
      };

      await updateDoc(projectRef, updateData);

      setAccessCodes(prev => ({
        ...prev,
        [type]: newCode
      }));

      toast.success(`New ${type} access code generated`);
      setAccessType(type);
    } catch (error) {
      console.error('Error generating access code:', error);
      toast.error('Failed to generate access code');
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Access code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error('Failed to copy access code');
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
                Generate and share access codes for team members. Different codes provide different access levels:
              </p>

              {/* Viewer Access */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiEye className="w-5 h-5 text-primary" />
                    <span className="font-medium">Viewer Access</span>
                  </div>
                  <button
                    onClick={() => generateAccessCode('viewer')}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                  >
                    Generate New Code
                  </button>
                </div>
                {accessCodes.viewer && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-background p-3 rounded-lg border border-border font-mono">
                      {accessCodes.viewer}
                    </div>
                    <button
                      onClick={() => handleCopy(accessCodes.viewer)}
                      className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Access */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiUsers className="w-5 h-5 text-primary" />
                    <span className="font-medium">Editor Access</span>
                  </div>
                  <button
                    onClick={() => generateAccessCode('editor')}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                  >
                    Generate New Code
                  </button>
                </div>
                {accessCodes.editor && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-background p-3 rounded-lg border border-border font-mono">
                      {accessCodes.editor}
                    </div>
                    <button
                      onClick={() => handleCopy(accessCodes.editor)}
                      className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Team members can join by going to /join and entering these codes. Each code grants different permissions.
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