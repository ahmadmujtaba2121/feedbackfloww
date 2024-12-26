import React, { useState } from 'react';
import { FiMessageCircle, FiX, FiCheck, FiClock, FiUpload, FiTrash2, FiEye } from 'react-icons/fi';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { id: 'design', label: 'Design', color: 'bg-violet-500' },
  { id: 'content', label: 'Content', color: 'bg-blue-500' },
  { id: 'layout', label: 'Layout', color: 'bg-green-500' },
  { id: 'general', label: 'General', color: 'bg-yellow-500' }
];

const ReviewPin = ({ position, projectId, onClose }) => {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images and PDFs are supported');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${projectId}/reviews/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const fileData = {
        id: `file-${timestamp}`,
        name: file.name,
        type: file.type,
        url,
        storagePath: fileName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.email
      };

      setUploadedFiles(prev => [...prev, fileData]);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      const reviewItem = {
        id: `review-${Date.now()}`,
        position,
        comment: comment.trim(),
        category,
        priority,
        status: 'open',
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
        isTask: false,
        previewFiles: uploadedFiles
      };

      await updateDoc(projectRef, {
        reviews: arrayUnion(reviewItem)
      });

      toast.success('Review added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!comment.trim()) {
      toast.error('Please add a description');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      const task = {
        id: `task-${Date.now()}`,
        position,
        description: comment.trim(),
        category,
        priority,
        status: 'todo',
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
        isTask: true,
        previewFiles: uploadedFiles
      };

      await updateDoc(projectRef, {
        tasks: arrayUnion(task)
      });

      toast.success('Task created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  if (!isExpanded) {
    return (
      <button
        className="absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsExpanded(true)}
      >
        <FiMessageCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="absolute z-50 w-80 bg-slate-800 rounded-lg shadow-lg border border-slate-700"
      style={{ left: position.x + 20, top: position.y }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-medium">Add Review</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Category
          </label>
          <div className="flex space-x-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${category === cat.id
                    ? cat.color + ' text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } transition-colors`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Priority
          </label>
          <div className="flex space-x-2">
            {['high', 'medium', 'low'].map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${priority === p
                    ? p === 'high'
                      ? 'bg-red-500 text-white'
                      : p === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } transition-colors`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the changes needed..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            rows={3}
          />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Attachments
          </label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-lg">
              <div className="flex items-center gap-2 text-slate-300">
                <FiUpload className="w-4 h-4" />
                <span>Upload Preview File</span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pin-file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="pin-file-upload"
                className={`px-3 py-1.5 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">{file.name}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                        title="Remove file"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Review
          </button>
          <button
            onClick={handleCreateTask}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPin; 