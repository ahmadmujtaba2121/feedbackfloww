import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiClock, FiPlus, FiFilter, FiCode } from 'react-icons/fi';
import TaskStatusBadge from '../TaskStatusBadge';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';

const ReviewList = ({
  reviews = [],
  onSelectReview,
  selectedReview,
  projectId,
  currentUser,
  isReviewer,
  isOwner,
  onAddReview,
  layers,
  setLayers
}) => {
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    description: '',
    category: 'design',
    priority: 'medium',
    deadline: '',
    notifyBefore: 24 // hours before deadline
  });
  const [filter, setFilter] = useState('all');

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.description.trim()) return;

    // Only reviewers (not owners) can add reviews
    if (!isReviewer || isOwner) {
      toast.error('Only reviewers can add reviews');
      return;
    }

    try {
      const reviewData = {
        id: `review-${Date.now()}`,
        description: newReview.description,
        category: newReview.category,
        priority: newReview.priority,
        status: 'TODO',
        createdBy: currentUser?.email,
        createdAt: new Date().toISOString(),
        assignedTo: currentUser?.email,
        deadline: newReview.deadline,
        notifyBefore: newReview.notifyBefore,
        metadata: {
          clientVisible: true,
          tags: []
        },
        statusHistory: [{
          status: 'TODO',
          timestamp: new Date().toISOString(),
          updatedBy: currentUser?.email,
          comment: 'Review created'
        }]
      };

      await onAddReview(reviewData);
      setNewReview({
        description: '',
        category: 'design',
        priority: 'medium',
        deadline: '',
        notifyBefore: 24
      });
      setIsAddingReview(false);
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  const handleAddCodeBlock = () => {
    // Create a dedicated CodeBlock layer if it doesn't exist
    let codeBlockLayer = layers.find(layer => layer.type === 'codeblock');
    let updatedLayers = [...layers];

    if (!codeBlockLayer) {
      codeBlockLayer = {
        id: `codeblock-layer-${Date.now()}`,
        name: 'Code Blocks',
        type: 'codeblock',
        visible: true,
        locked: false,
        content: []
      };
      updatedLayers.push(codeBlockLayer);
    }

    // Create a new code block in the center of the canvas
    const newCodeBlock = {
      id: `code-${Date.now()}-${Math.random()}`,
      type: 'code',
      position: { x: 1920 / 2, y: 1080 / 2 }, // Center of canvas
      content: '// Start coding here',
      language: 'javascript',
      size: { width: 400, height: 300 }
    };

    // Add the new code block to the layer
    const finalLayers = updatedLayers.map(layer => {
      if (layer.type === 'codeblock') {
        return {
          ...layer,
          content: [...(layer.content || []), newCodeBlock]
        };
      }
      return layer;
    });

    setLayers(finalLayers);
    toast.success('Code block added');
  };

  // Ensure reviews is an array and filter it
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const filteredReviews = filter === 'all'
    ? safeReviews
    : safeReviews.filter(review => {
      if (filter === 'mine') return review.createdBy === currentUser?.email;
      if (filter === 'assigned') return review.assignedTo === currentUser?.email;
      return review.status === filter;
    });

  return (
    <div className="absolute top-4 left-4 z-50 w-64">
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-200">Reviews</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCodeBlock}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                title="Add Code Block"
              >
                <FiCode className="w-4 h-4" />
              </button>
              {isReviewer && !isOwner && (
                <button
                  onClick={() => setIsAddingReview(!isAddingReview)}
                  className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                  title="Add review"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-2 py-1 text-xs bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Reviews</option>
              <option value="mine">Created by Me</option>
              <option value="assigned">Assigned to Me</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredReviews.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              {filter === 'all'
                ? 'No reviews yet'
                : 'No reviews match the selected filter'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredReviews.map((review) => (
                <motion.button
                  key={review.id}
                  onClick={() => onSelectReview(review)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${selectedReview?.id === review.id
                    ? 'bg-violet-500/20 hover:bg-violet-500/30'
                    : 'hover:bg-slate-700/50'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiMessageCircle className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-200 truncate">
                          {review.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TaskStatusBadge status={review.status} />
                        <span className="text-xs text-slate-400">
                          {review.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-slate-400">
                      <span>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500">
                        {review.createdBy === currentUser?.email ? 'You' : review.createdBy}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewList; 