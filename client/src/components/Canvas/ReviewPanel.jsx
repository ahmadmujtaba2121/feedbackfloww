import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronRight, FiChevronLeft, FiClock, FiDollarSign, FiTag, FiPlay, FiPause, FiUpload, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import TaskStatusSelector from '../TaskStatusSelector';
import { updateTaskStatus } from '../../utils/taskUtils';
import { useAuth } from '../../contexts/AuthContext';
import TimeTracker from '../TimeTracking/TimeTracker';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import WatermarkedImage from '../WatermarkedImage';
import WatermarkedPDF from '../WatermarkedPDF';

const ReviewPanel = ({
  isOpen,
  onClose,
  selectedReview,
  projectId,
  onStatusChange,
  currentUser,
  isOwner,
  isReviewer
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentReview, setCurrentReview] = useState(selectedReview);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const panelWidth = expanded ? 'w-80' : 'w-12';

  // Subscribe to real-time updates for the review
  useEffect(() => {
    if (!projectId || !selectedReview) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const reviews = data.reviews || [];
          const updatedReview = reviews.find(r => r.id === selectedReview.id);
          if (updatedReview) {
            // Only update if there's a real change
            if (JSON.stringify(updatedReview) !== JSON.stringify(currentReview)) {
              setCurrentReview(updatedReview);

              // Check if status has changed
              if (updatedReview.status !== currentReview?.status) {
                const statusUpdate = updatedReview.statusHistory?.[updatedReview.statusHistory.length - 1];
                setLastStatusUpdate(statusUpdate);

                // Only trigger onStatusChange if this is a new status update
                if (statusUpdate && (!lastStatusUpdate || statusUpdate.timestamp !== lastStatusUpdate.timestamp)) {
                  onStatusChange?.({
                    success: true,
                    previousStatus: currentReview?.status,
                    newStatus: updatedReview.status,
                    timestamp: statusUpdate.timestamp,
                    statusUpdate: statusUpdate
                  });
                }
              }
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [projectId, selectedReview?.id, currentReview]);

  // Update currentReview when selectedReview changes
  useEffect(() => {
    if (selectedReview && JSON.stringify(selectedReview) !== JSON.stringify(currentReview)) {
      // Initialize with default values if they don't exist
      const reviewWithDefaults = {
        ...selectedReview,
        timeSpent: selectedReview.timeSpent || 0,
        hourlyRate: selectedReview.hourlyRate || 0,
        timeEntries: selectedReview.timeEntries || [],
        description: selectedReview.description || 'Untitled Task',
        metadata: {
          ...selectedReview.metadata,
          billable: selectedReview.metadata?.billable ?? true
        }
      };
      setCurrentReview(reviewWithDefaults);
      setLastStatusUpdate(selectedReview.statusHistory?.[selectedReview.statusHistory.length - 1]);
    }
  }, [selectedReview]);

  const handleStatusChange = async (newStatus) => {
    if (!currentReview || isUpdating) return;

    setIsUpdating(true);
    try {
      const timestamp = new Date().toISOString();
      const statusUpdate = {
        status: newStatus,
        updatedBy: user?.email || currentUser?.email,
        timestamp: timestamp,
        comment: `Status updated to ${newStatus}`
      };

      const result = await updateTaskStatus({
        projectId,
        taskId: currentReview.id,
        newStatus,
        currentStatus: currentReview.status,
        updatedBy: user?.email || currentUser?.email,
        comment: statusUpdate.comment,
        timestamp: timestamp
      });

      setLastStatusUpdate(statusUpdate);
      onStatusChange?.(result);
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images and PDFs are supported');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ukecpfrg');
      formData.append('folder', `feedbackflow/reviews/${projectId}`);
      formData.append('public_id', `${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}`); // Remove extension from public_id

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dysa2jeyb/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();

      // Create file object
      const fileObject = {
        id: `file-${timestamp}`,
        name: file.name,
        type: file.type,
        url: data.secure_url,
        publicId: data.public_id,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.email,
        size: file.size
      };

      // Update review with new file
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const reviews = projectDoc.data().reviews || [];
      const reviewIndex = reviews.findIndex(r => r.id === currentReview.id);

      if (reviewIndex === -1) {
        throw new Error('Review not found');
      }

      // Ensure previewFiles array exists
      const currentPreviewFiles = reviews[reviewIndex].previewFiles || [];

      const updatedReview = {
        ...reviews[reviewIndex],
        previewFiles: [...currentPreviewFiles, fileObject],
        lastUpdated: new Date().toISOString()
      };

      reviews[reviewIndex] = updatedReview;

      // Update Firestore
      await updateDoc(projectRef, {
        reviews,
        lastModified: serverTimestamp(),
        lastModifiedBy: currentUser.email,
        activityLog: arrayUnion({
          type: 'file_upload',
          user: currentUser.email,
          fileName: file.name,
          timestamp: new Date().toISOString()
        })
      });

      // Update local state
      setCurrentReview(updatedReview);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      const file = currentReview.previewFiles?.find(f => f.id === fileId);
      if (!file) return;

      // Update in Firestore first
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const projectData = projectDoc.data();
      const reviews = projectData.reviews || [];
      const reviewIndex = reviews.findIndex(r => r.id === currentReview.id);

      if (reviewIndex === -1) {
        throw new Error('Review not found');
      }

      // Update the review's previewFiles
      const updatedReviews = [...reviews];
      updatedReviews[reviewIndex] = {
        ...reviews[reviewIndex],
        previewFiles: reviews[reviewIndex].previewFiles?.filter(f => f.id !== fileId) || []
      };

      // Update in Firestore
      await updateDoc(projectRef, {
        reviews: updatedReviews,
        lastModified: serverTimestamp(),
        lastModifiedBy: user?.email || currentUser?.email,
        activityLog: arrayUnion({
          type: 'file_delete',
          user: user?.email || currentUser?.email,
          fileName: file.name,
          timestamp: new Date().toISOString()
        })
      });

      // Update local state
      setCurrentReview(prev => ({
        ...prev,
        previewFiles: prev.previewFiles?.filter(f => f.id !== fileId) || []
      }));

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  if (!currentReview) return null;

  return (
    <AnimatePresence>
      {isOpen && currentReview && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30 }}
          className={`fixed top-0 right-0 h-full ${panelWidth} bg-slate-800 border-l border-slate-700 shadow-xl transition-all duration-300 z-[60]`}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-full p-2 hover:bg-slate-700 transition-colors z-[61]"
          >
            {expanded ? <FiChevronRight /> : <FiChevronLeft />}
          </button>

          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              {expanded && (
                <h2 className="text-lg font-semibold text-slate-200 truncate">
                  Review Details
                </h2>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiX />
              </button>
            </div>

            {/* Content */}
            {expanded && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
                  <div
                    className={`text-slate-300 bg-slate-900/50 rounded-lg p-3 ${showFullDescription ? '' : 'max-h-32 overflow-hidden relative'
                      }`}
                  >
                    {currentReview.description}
                    {!showFullDescription && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    )}
                  </div>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
                  <TaskStatusSelector
                    key={`${currentReview.id}-${currentReview.status}-${lastStatusUpdate?.timestamp}`}
                    currentStatus={currentReview.status}
                    onStatusChange={handleStatusChange}
                    disabled={isUpdating}
                    showTransitionHistory={true}
                    transitionHistory={currentReview.statusHistory || []}
                  />
                </div>

                {/* Time Tracking */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Time Tracking</h3>
                  <TimeTracker
                    key={`${currentReview.id}-${currentReview.hourlyRate}`}
                    projectId={projectId}
                    taskId={currentReview.id}
                    initialRate={currentReview.hourlyRate || 0}
                    isOwner={isOwner}
                    disabled={!isReviewer && !isOwner}
                  />
                </div>

                {/* Time and Billing */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Time & Billing</h3>
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <FiClock className="w-4 h-4" />
                        <span>Time Spent</span>
                      </div>
                      <span className="text-slate-400">
                        {Math.round((currentReview.timeSpent || 0) / 3600000)}h
                      </span>
                    </div>
                    {currentReview.metadata?.billable && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FiDollarSign className="w-4 h-4" />
                          <span>Rate</span>
                        </div>
                        <span className="text-slate-400">
                          ${currentReview.hourlyRate}/hr
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload Section - Only for owners */}
                {isOwner && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">File Upload</h3>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="review-file-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="review-file-upload"
                        className={`w-full px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 cursor-pointer flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        <FiUpload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Upload Preview File'}
                      </label>
                    </div>
                  </div>
                )}

                {/* File Attachments List */}
                {(currentReview.previewFiles?.length > 0 || isOwner) && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">File Attachments</h3>
                    <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
                      {currentReview.previewFiles?.map((file, index) => (
                        <div key={file.id || index} className="flex items-center justify-between py-2 border-t border-slate-700 first:border-t-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-300">{file.name}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner ? (
                              <button
                                onClick={() => handleFileDelete(file.id)}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                                title="Delete file"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePreview(file)}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded"
                                title="Preview file"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!currentReview.previewFiles || currentReview.previewFiles.length === 0) && (
                        <div className="text-center text-sm text-slate-500 py-2">
                          No files attached
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {currentReview.metadata?.tags && currentReview.metadata.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentReview.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300"
                        >
                          <FiTag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Assignment</h3>
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Created by</span>
                      <span className="text-slate-400">{currentReview.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Created</span>
                      <span className="text-slate-400">
                        {new Date(currentReview.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {currentReview.lastUpdated && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Last updated</span>
                        <span className="text-slate-400">
                          {new Date(currentReview.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewPanel; 