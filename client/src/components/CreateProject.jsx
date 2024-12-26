import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createProject } from '../services/userService';
import { FiX, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CreateProject = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'PNG',
    collaborators: []
  });

  const formats = {
    PNG: {
      icon: '🖼️',
      label: 'PNG',
      description: 'High-quality raster images'
    },
    JPG: {
      icon: '📸',
      label: 'JPG',
      description: 'Compressed image format'
    },
    SVG: {
      icon: '⚡',
      label: 'SVG',
      description: 'Vector graphics'
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const projectData = {
        ...formData,
        userId: currentUser.uid,
        owner: currentUser.email,
        status: 'PENDING',
        members: [
          {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: 'OWNER',
            joinedAt: new Date().toISOString()
          }
        ],
        files: [],
        reviews: [],
        tasks: [],
        reviewStatus: 'pending',
        lastReviewedAt: null,
        lastReviewedBy: null,
        reviewHistory: {},
        reviewers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const projectId = await createProject(projectData);
      handleClose();
      navigate(`/project/${projectId}`);
    } catch (err) {
      setError(
        <div className="text-sm">
          <p className="font-medium mb-1">Failed to create project</p>
          <p className="text-secondary-foreground">Currently, we only support PNG, JPG, and SVG files to keep costs manageable as a solo developer project.</p>
          <p className="text-muted-foreground mt-1">Thank you for understanding! 🙏</p>
        </div>
      );
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-foreground rounded-lg w-full max-w-2xl p-6 border border-border relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-secondary-foreground transition-colors"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-secondary-foreground">Create New Project</h2>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-400 bg-red-900/50 rounded-lg border border-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:border-primary h-24 resize-none"
              placeholder="Describe your project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(formats).map(([format, { icon, label }]) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setFormData({ ...formData, format })}
                  className={`p-4 flex flex-col items-center justify-center rounded-lg border ${formData.format === format
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-background hover:border-primary/50'
                    } transition-colors`}
                >
                  <span className="text-2xl mb-2">{icon}</span>
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-muted-foreground hover:text-secondary-foreground transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateProject;
