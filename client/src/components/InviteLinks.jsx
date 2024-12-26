import React, { useState, useEffect } from 'react';
import { FiLink, FiTrash2, FiEdit2, FiEye } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { deleteProjectInvite } from '../services/inviteService.ts';
import { toast } from 'react-hot-toast';

const InviteLinks = ({ projectId }) => {
  const { currentUser } = useAuth();
  const [editorLinks, setEditorLinks] = useState([]);
  const [viewerLinks, setViewerLinks] = useState([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadInviteLinks = async () => {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const data = projectSnap.data();
        setIsOwner(data.owner === currentUser?.email);
        setEditorLinks(data.editorLinks?.filter(link => !link.used) || []);
        setViewerLinks(data.viewerLinks?.filter(link => !link.used) || []);
      }
    };
    loadInviteLinks();
  }, [projectId, currentUser]);

  const handleDeleteInvite = async (inviteId) => {
    try {
      await deleteProjectInvite(projectId, inviteId);
      setEditorLinks(prev => prev.filter(invite => invite.id !== inviteId));
      setViewerLinks(prev => prev.filter(invite => invite.id !== inviteId));
      toast.success('Invite link deleted successfully');
    } catch (error) {
      console.error('Error deleting invite link:', error);
      toast.error('Failed to delete invite link');
    }
  };

  if (!isOwner || (editorLinks.length === 0 && viewerLinks.length === 0)) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-2 mb-6">
        <FiLink className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Active Invite Links</h2>
      </div>

      <div className="space-y-6">
        {editorLinks.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FiEdit2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-emerald-400">Editor Access Links</h3>
            </div>
            <div className="space-y-3">
              {editorLinks.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white font-medium">Full Access</span>
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full font-medium">
                        Can Edit & Upload
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title="Delete invite link"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewerLinks.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FiEye className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-medium text-blue-400">View Only Links</h3>
            </div>
            <div className="space-y-3">
              {viewerLinks.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white font-medium">Limited Access</span>
                      <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full font-medium">
                        View Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title="Delete invite link"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteLinks; 