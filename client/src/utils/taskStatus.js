import { FiClock, FiUser, FiCheck, FiEye, FiPlayCircle, FiAlertCircle } from 'react-icons/fi';

export const TASK_STATUSES = {
  TODO: {
    label: 'To Do',
    icon: FiClock,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary/50',
    borderColor: 'border-border'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: FiPlayCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    borderColor: 'border-primary/50'
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: FiEye,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    borderColor: 'border-accent/50'
  },
  NEEDS_REVISION: {
    label: 'Needs Revision',
    icon: FiAlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50'
  },
  COMPLETED: {
    label: 'Completed',
    icon: FiCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50'
  },
  APPROVED: {
    label: 'Approved',
    icon: FiCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    borderColor: 'border-primary/50'
  }
};

// Define valid status transitions
export const STATUS_TRANSITIONS = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW', 'TODO'],
  IN_REVIEW: ['COMPLETED', 'NEEDS_REVISION'],
  NEEDS_REVISION: ['IN_PROGRESS', 'IN_REVIEW'],
  COMPLETED: ['APPROVED', 'NEEDS_REVISION'],
  APPROVED: ['COMPLETED', 'NEEDS_REVISION']
};

export const isValidStatusTransition = (currentStatus, newStatus) => {
  // Normalize statuses
  const normalizedCurrentStatus = currentStatus?.toUpperCase().replace(/ /g, '_');
  const normalizedNewStatus = newStatus?.toUpperCase().replace(/ /g, '_');

  // Check if both statuses are valid
  if (!normalizedCurrentStatus || !normalizedNewStatus) {
    return false;
  }

  // Check if the current status exists in our transitions map
  if (!STATUS_TRANSITIONS[normalizedCurrentStatus]) {
    return false;
  }

  // Check if the new status is a valid transition from the current status
  return STATUS_TRANSITIONS[normalizedCurrentStatus].includes(normalizedNewStatus);
};

export const getStatusConfig = (status) => {
  return TASK_STATUSES[status] || TASK_STATUSES.TODO;
};

export const getNextStatus = (currentStatus) => {
  const statusOrder = Object.keys(TASK_STATUSES);
  const currentIndex = statusOrder.indexOf(currentStatus);
  return statusOrder[(currentIndex + 1) % statusOrder.length];
};

export const isValidStatus = (status) => {
  const normalizedStatus = status?.toUpperCase().replace(/ /g, '_');
  return normalizedStatus in TASK_STATUSES;
};

export const getStatusBadgeClasses = (status) => {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.borderColor} ${config.color}`;
}; 