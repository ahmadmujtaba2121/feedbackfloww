import React, { createContext, useContext, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const CommentContext = createContext();

export const useComment = () => {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useComment must be used within a CommentProvider');
  }
  return context;
};

export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState([]);

  const addComment = async (projectId, comment) => {
    try {
      if (!auth.currentUser) throw new Error('Must be logged in to add comments');

      const commentsRef = collection(db, `projects/${projectId}/comments`);
      const newComment = {
        ...comment,
        createdAt: serverTimestamp(),
        createdBy: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email,
          photoURL: auth.currentUser.photoURL
        }
      };

      const docRef = await addDoc(commentsRef, newComment);
      setComments(prev => [...prev, { ...newComment, id: docRef.id }]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  };

  const deleteComment = async (projectId, commentId) => {
    try {
      if (!auth.currentUser) throw new Error('Must be logged in to delete comments');

      const commentRef = doc(db, `projects/${projectId}/comments/${commentId}`);
      await deleteDoc(commentRef);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      throw error;
    }
  };

  const updateComment = async (projectId, commentId, updates) => {
    try {
      if (!auth.currentUser) throw new Error('Must be logged in to update comments');

      const commentRef = doc(db, `projects/${projectId}/comments/${commentId}`);
      await updateDoc(commentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email,
          photoURL: auth.currentUser.photoURL
        }
      });

      setComments(prev => prev.map(comment => 
        comment.id === commentId ? { ...comment, ...updates } : comment
      ));

      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
      throw error;
    }
  };

  const value = {
    comments,
    setComments,
    addComment,
    deleteComment,
    updateComment
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

export default CommentContext; 