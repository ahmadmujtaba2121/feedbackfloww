import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ShareModal = ({ projectId, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      setCopied(true);
      toast.success('Project code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy project code');
    }
  };

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
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Share this project code with team members:
            </p>

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
              Team members can join by going to /join and entering this code
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal; 