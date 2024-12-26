import React from 'react';
import { getStatusConfig, getStatusBadgeClasses } from '../utils/taskStatus.js';

const TaskStatusBadge = ({ status, showIcon = true }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(status)}`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </span>
  );
};

export default TaskStatusBadge; 