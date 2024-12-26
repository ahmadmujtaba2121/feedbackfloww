import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { isValidStatusTransition, TASK_STATUSES } from './taskStatus.js';
import { toast } from 'react-hot-toast';

export const updateTaskStatus = async ({
  projectId,
  taskId,
  newStatus,
  currentStatus,
  updatedBy,
  comment,
  timestamp
}) => {
  if (!projectId || !taskId || !newStatus || !updatedBy) {
    throw new Error('Missing required parameters for status update');
  }

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const data = projectDoc.data();
    const reviews = data.reviews || [];
    const reviewIndex = reviews.findIndex(r => r.id === taskId);
    
    if (reviewIndex === -1) {
      throw new Error('Review not found');
    }

    // Get current status history
    const currentHistory = reviews[reviewIndex].statusHistory || [];
    
    // Check if this is a duplicate update
    const isDuplicate = currentHistory.some(update => 
      update.status === newStatus && 
      update.updatedBy === updatedBy && 
      update.timestamp === timestamp
    );

    if (isDuplicate) {
      return {
        success: true,
        previousStatus: currentStatus,
        newStatus,
        timestamp,
        statusUpdate: currentHistory[currentHistory.length - 1]
      };
    }

    // Create new status update
    const statusUpdate = {
      status: newStatus,
      updatedBy,
      timestamp: timestamp || new Date().toISOString(),
      comment
    };

    // Update the review with new status and history
    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex] = {
      ...reviews[reviewIndex],
      status: newStatus,
      lastStatusUpdate: timestamp || new Date().toISOString(),
      lastUpdatedBy: updatedBy,
      statusHistory: [...currentHistory, statusUpdate]
    };

    // Update the document
    await updateDoc(projectRef, {
      reviews: updatedReviews
    });

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus,
      timestamp: statusUpdate.timestamp,
      statusUpdate
    };
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const getTaskNotificationMessage = (task, statusUpdate) => {
  const statusConfig = TASK_STATUSES[statusUpdate.status];
  const baseMessage = `Task "${task.description}" status changed to ${statusConfig.label}`;
  
  switch (statusUpdate.status) {
    case 'PENDING_REVIEW':
      return `${baseMessage}. Please review the changes.`;
    case 'PENDING_CHANGES':
      return `${baseMessage}. Changes have been requested.`;
    case 'COMPLETED':
      return `${baseMessage}. All work has been completed.`;
    case 'BLOCKED':
      return `${baseMessage}. Task is blocked and needs attention.`;
    case 'BILLABLE':
      return `${baseMessage}. Task is ready for invoicing.`;
    default:
      return baseMessage;
  }
};

export const shouldNotifyStatusChange = (oldStatus, newStatus) => {
  const notifiableTransitions = {
    'TODO': ['IN_PROGRESS'],
    'IN_PROGRESS': ['PENDING_REVIEW', 'BLOCKED'],
    'PENDING_REVIEW': ['COMPLETED', 'PENDING_CHANGES'],
    'PENDING_CHANGES': ['IN_PROGRESS'],
    'BLOCKED': ['IN_PROGRESS'],
    'COMPLETED': ['BILLABLE']
  };

  return notifiableTransitions[oldStatus]?.includes(newStatus) || false;
};

export const createTaskReminder = async (projectId, taskId, reminderType, dueDate) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    
    const reminder = {
      type: reminderType,
      timestamp: dueDate.toISOString(),
      sent: false
    };

    await updateDoc(projectRef, {
      [`tasks.${taskId}.reminders`]: arrayUnion(reminder)
    });

    return reminder;
  } catch (error) {
    console.error('Error creating task reminder:', error);
    throw error;
  }
};

export const calculateTaskProgress = (task) => {
  if (!task.statusHistory || task.statusHistory.length === 0) {
    return 0;
  }

  const statusWeights = {
    'TODO': 0,
    'IN_PROGRESS': 0.3,
    'PENDING_REVIEW': 0.7,
    'PENDING_CHANGES': 0.5,
    'ON_HOLD': 0.3,
    'COMPLETED': 1,
    'CANCELLED': 0,
    'BLOCKED': 0.3,
    'BILLABLE': 1
  };

  return statusWeights[task.status] || 0;
};

export const getTaskDuration = (task) => {
  if (!task.statusHistory || task.statusHistory.length < 2) {
    return 0;
  }

  const workingStatuses = ['IN_PROGRESS', 'PENDING_REVIEW', 'PENDING_CHANGES'];
  let totalDuration = 0;
  let lastWorkingTime = null;

  task.statusHistory.forEach((update, index) => {
    if (workingStatuses.includes(update.status)) {
      if (!lastWorkingTime) {
        lastWorkingTime = new Date(update.timestamp);
      }
    } else if (lastWorkingTime) {
      totalDuration += new Date(update.timestamp) - lastWorkingTime;
      lastWorkingTime = null;
    }
  });

  // If still in a working status, count up to now
  if (lastWorkingTime && workingStatuses.includes(task.status)) {
    totalDuration += new Date() - lastWorkingTime;
  }

  return totalDuration;
}; 