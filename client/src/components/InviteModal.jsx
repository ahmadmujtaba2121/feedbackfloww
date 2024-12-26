import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiMail, FiX, FiPlus } from 'react-icons/fi';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const InviteModal = ({ isOpen, onClose, projectId }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                [`editors.${email}`]: {
                    role: 'editor',
                    invitedAt: new Date().toISOString()
                }
            });

            toast.success('Team member invited successfully');
            setEmail('');
            onClose();
        } catch (error) {
            console.error('Error inviting team member:', error);
            toast.error('Failed to invite team member');
        } finally {
            setLoading(false);
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
                        <h3 className="text-lg font-medium text-[#E5E9F0]">Invite Team Member</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-[#1B2B44] rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-[#94A3B8] hover:text-[#E5E9F0]" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleInvite} className="px-6 py-4">
                        <div className="space-y-6">
                            <div>
                                <p className="text-[#94A3B8] mb-4">
                                    Enter the email address of the person you want to invite to collaborate on this project.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMail className="h-5 w-5 text-[#94A3B8]" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter email address"
                                                className="block w-full pl-10 bg-[#1B2B44] text-[#E5E9F0] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] border border-[#2B3B54] placeholder-[#94A3B8]"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || !email.trim()}
                                            className="px-4 py-2 bg-[#2DD4BF] text-[#0A1628] rounded-lg hover:bg-[#14B8A6] disabled:opacity-50 flex items-center space-x-2 font-medium"
                                        >
                                            {loading ? (
                                                <span>Inviting...</span>
                                            ) : (
                                                <>
                                                    <FiPlus className="w-5 h-5" />
                                                    <span>Invite</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default InviteModal; 