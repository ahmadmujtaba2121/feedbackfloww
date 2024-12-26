import React, { useState, useEffect } from 'react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TASK_STATUSES, getStatusConfig } from '../utils/taskStatus';
import TimeTracker from './TimeTracker';
import TaskStatusSelector from './TaskStatusSelector';
import { toast } from 'react-hot-toast';
import { FiClock, FiAlertCircle } from 'react-icons/fi';

// AI Summary Generator utility
const generateAISummary = (review) => {
  const statusCount = review.statusHistory?.length || 0;
  const timeSpent = review.timeSpent ? Math.round(review.timeSpent / 3600000) : 0;
  const lastStatus = review.statusHistory?.[statusCount - 1];

  // Calculate deadline status
  let deadlineInfo = '';
  if (review.deadline) {
    const deadline = new Date(review.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) {
      deadlineInfo = '⚠️ OVERDUE';
    } else if (hoursUntilDeadline <= review.notifyBefore) {
      deadlineInfo = `⚡ Due in ${Math.round(hoursUntilDeadline)}h`;
    } else {
      deadlineInfo = `✅ Due ${new Date(review.deadline).toLocaleDateString()}`;
    }
  }

  return {
    summary: `Review ${review.status}: ${review.description.substring(0, 100)}${review.description.length > 100 ? '...' : ''}`,
    metrics: `${statusCount} status updates, ${timeSpent}h spent`,
    deadline: deadlineInfo,
    currentState: `Current state: ${review.status}, last updated ${lastStatus ? new Date(lastStatus.timestamp).toLocaleDateString() : 'never'}`,
    recommendation: `Recommended focus: ${review.deadline && new Date(review.deadline) < new Date() ? 'Address overdue deadline immediately' :
      review.status === 'NEEDS_REVISION' ? 'Address review feedback' :
        review.status === 'IN_REVIEW' ? 'Wait for reviewer feedback' :
          'Continue with current phase'
      }`
  };
};

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
  const { updateTaskStatus, project } = useTask();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentReview, setCurrentReview] = useState(selectedReview);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    setCurrentReview(selectedReview);
    if (selectedReview) {
      setAiSummary(generateAISummary(selectedReview));
    }
  }, [selectedReview]);

  const handleStatusChange = async (newStatus) => {
    if (!isOwner) {
      toast.error('Only project owners can change status');
      return;
    }

    try {
      setIsUpdating(true);
      await updateTaskStatus(currentReview.id, newStatus);
      setLastStatusUpdate({
        status: newStatus,
        timestamp: new Date().toISOString()
      });
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentReview) return null;

  const currentStatus = getStatusConfig(currentReview.status);

  return (
    <div className="h-full flex flex-col bg-slate-800 border-l border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Review Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        {aiSummary && (
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 mt-2">
            <p className="text-sm font-medium text-slate-300">{aiSummary.summary}</p>
            <p className="text-xs text-slate-400">{aiSummary.metrics}</p>
            {aiSummary.deadline && (
              <p className="text-xs font-medium text-slate-300">{aiSummary.deadline}</p>
            )}
            <p className="text-xs text-slate-400">{aiSummary.currentState}</p>
            <p className="text-xs text-blue-400">{aiSummary.recommendation}</p>
          </div>
        )}
        <div className="text-sm text-slate-400">
          Created {new Date(currentReview.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
          <p className="text-white whitespace-pre-wrap">{currentReview.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
          <TaskStatusSelector
            key={`${currentReview.id}-${currentReview.status}-${lastStatusUpdate?.timestamp}`}
            currentStatus={currentReview.status}
            onStatusChange={handleStatusChange}
            disabled={!isOwner}
            showTransitionHistory={true}
            transitionHistory={currentReview.statusHistory || []}
            allowedStatuses={Object.keys(TASK_STATUSES)}
          />
        </div>

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

        {/* Deadline Section */}
        {currentReview.deadline && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Deadline</h3>
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <FiClock className="w-4 h-4" />
                  <span>Due Date</span>
                </div>
                <span className="text-slate-400">
                  {new Date(currentReview.deadline).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>Notification</span>
                </div>
                <span className="text-slate-400">
                  {currentReview.notifyBefore}h before
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPanel; 