import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { TASK_STATUSES } from '../utils/taskStatus';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const TaskStatusSelector = ({ 
  currentStatus, 
  onStatusChange,
  disabled = false,
  showTransitionHistory = false,
  transitionHistory = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

  const normalizedStatus = localStatus?.toUpperCase().replace(/ /g, '_');
  const currentConfig = TASK_STATUSES[normalizedStatus] || TASK_STATUSES.TODO;

  const validTransitions = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_REVIEW', 'TODO'],
    IN_REVIEW: ['COMPLETED', 'NEEDS_REVISION'],
    NEEDS_REVISION: ['IN_PROGRESS', 'IN_REVIEW'],
    COMPLETED: ['APPROVED', 'NEEDS_REVISION'],
    APPROVED: ['COMPLETED', 'NEEDS_REVISION']
  };

  const availableStatuses = validTransitions[normalizedStatus] || [];

  const handleStatusChange = async (newStatus) => {
    if (disabled) return;
    
    const normalizedNewStatus = newStatus.toUpperCase().replace(/ /g, '_');
    
    if (!availableStatuses.includes(normalizedNewStatus)) {
      toast.error(`Cannot change status from ${currentConfig.label} to ${TASK_STATUSES[normalizedNewStatus].label}`);
      return;
    }

    try {
      setLocalStatus(normalizedNewStatus);
      await onStatusChange(normalizedNewStatus);
      setIsOpen(false);
    } catch (error) {
      setLocalStatus(currentStatus);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="relative z-50">
      {/* Current Status Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border ${
          currentConfig.borderColor
        } ${currentConfig.bgColor} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'
        } transition-colors duration-200`}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2.5">
          <currentConfig.icon className={`w-4.5 h-4.5 ${currentConfig.color}`} />
          <span className={`${currentConfig.color} font-medium`}>{currentConfig.label}</span>
        </div>
        {!disabled && (
          <FiChevronDown 
            className={`w-4 h-4 ${currentConfig.color} transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </button>

      {/* Status Options Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              {availableStatuses.map((status) => {
                const config = TASK_STATUSES[status];
                if (!config) return null;
                
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === normalizedStatus}
                    className={`w-full flex items-center px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors ${
                      config.color
                    } ${status === normalizedStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <config.icon className="w-4.5 h-4.5 mr-2.5" />
                    <span className="font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status History */}
      {showTransitionHistory && transitionHistory?.length > 0 && (
        <div className="mt-4 space-y-2 bg-slate-800/30 rounded-lg p-3">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Status History</h4>
          <div className="space-y-2">
            {transitionHistory.map((transition, index) => {
              const normalizedTransitionStatus = transition.status?.toUpperCase().replace(/ /g, '_');
              const config = TASK_STATUSES[normalizedTransitionStatus] || TASK_STATUSES.TODO;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs bg-slate-800/50 rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor}`}>
                      <config.icon className="w-3.5 h-3.5 mr-1.5" />
                      <span className={config.color}>{config.label}</span>
                    </div>
                    <span className="text-slate-400">by {transition.updatedBy}</span>
                  </div>
                  <span className="text-slate-400 ml-2">
                    {formatDistanceToNow(new Date(transition.timestamp), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusSelector; 