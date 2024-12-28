import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiShare2, FiCopy, FiCheck, FiX, FiUsers } from 'react-icons/fi';
import { createProjectInvite } from '../services/inviteService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const ShareModal = ({ isOpen, onClose, projectId }) => {
  const { currentUser } = useAuth();
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteType, setInviteType] = useState('view'); // 'view' or 'team'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const invite = await createProjectInvite(projectId, currentUser.email, inviteType);
      setInviteLink(invite.inviteLink);
      toast.success('Invite link generated successfully');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0" style={{ zIndex: 999999 }}>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#080C14]/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#0A1628] rounded-lg shadow-xl overflow-hidden border border-[#1B2B44]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#1B2B44] flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#E5E9F0]">Share Project</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1B2B44] rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-[#94A3B8] hover:text-[#E5E9F0]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <p className="text-[#94A3B8] mb-4">
                  Generate a link to share this project. Choose whether to invite team members or share for viewing.
                </p>

                {/* Invite Type Selection */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setInviteType('view')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${inviteType === 'view'
                      ? 'bg-[#2DD4BF] text-[#0A1628] font-medium'
                      : 'bg-[#1B2B44] text-[#94A3B8] hover:bg-[#2B3B54]'
                      }`}
                  >
                    <FiShare2 className="w-5 h-5" />
                    <span>View Only</span>
                  </button>
                  <button
                    onClick={() => setInviteType('team')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${inviteType === 'team'
                      ? 'bg-[#2DD4BF] text-[#0A1628] font-medium'
                      : 'bg-[#1B2B44] text-[#94A3B8] hover:bg-[#2B3B54]'
                      }`}
                  >
                    <FiUsers className="w-5 h-5" />
                    <span>Team Member</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleGenerateLink}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-[#2DD4BF] text-[#0A1628] rounded-lg hover:bg-[#14B8A6] disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                    >
                      {loading ? (
                        <span>Generating link...</span>
                      ) : (
                        <>
                          <FiShare2 className="w-5 h-5" />
                          <span>Generate {inviteType === 'team' ? 'Team' : 'View'} Invite Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inviteLink && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 bg-[#1B2B44] text-[#E5E9F0] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] border border-[#2B3B54]"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-[#2DD4BF] text-[#0A1628] rounded-lg hover:bg-[#14B8A6] flex items-center space-x-2 font-medium"
                      >
                        {copied ? (
                          <FiCheck className="w-5 h-5" />
                        ) : (
                          <FiCopy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal; 