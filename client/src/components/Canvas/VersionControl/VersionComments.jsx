import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { toast } from 'react-hot-toast';

const VersionComments = ({ projectId, version, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      if (!projectId || !version) return;

      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const versionComments = data.versionComments?.[version.id] || [];
          setComments(versionComments);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
        setIsLoading(false);
      }
    };

    loadComments();
  }, [projectId, version]);

  const addComment = async () => {
    if (!newComment.trim() || !projectId || !version || !currentUser) return;

    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        toast.error('Project not found');
        return;
      }

      const data = docSnap.data();
      const versionComments = data.versionComments || {};
      const currentComments = versionComments[version.id] || [];

      const newCommentObj = {
        id: `comment-${Date.now()}`,
        text: newComment.trim(),
        author: {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          avatar: currentUser.photoURL
        },
        timestamp: new Date().toISOString()
      };

      const updatedComments = [...currentComments, newCommentObj];
      versionComments[version.id] = updatedComments;

      await updateDoc(docRef, {
        versionComments,
        lastModified: serverTimestamp()
      });

      setComments(updatedComments);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        toast.error('Project not found');
        return;
      }

      const data = docSnap.data();
      const versionComments = data.versionComments || {};
      const currentComments = versionComments[version.id] || [];

      const updatedComments = currentComments.filter(c => c.id !== commentId);
      versionComments[version.id] = updatedComments;

      await updateDoc(docRef, {
        versionComments,
        lastModified: serverTimestamp()
      });

      setComments(updatedComments);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!version) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Comments</h3>
          <p className="text-sm text-slate-400">Version: {version.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <FiX className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-slate-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-slate-400">No comments yet</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {comment.author.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-xs text-white">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">
                    {comment.author.name}
                  </span>
                </div>
                {comment.author.id === currentUser?.uid && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-300 text-sm mb-2">{comment.text}</p>
              <span className="text-xs text-slate-400">
                {formatTimestamp(comment.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addComment();
              }
            }}
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className={`p-2 rounded-lg ${
              newComment.trim()
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionComments; 