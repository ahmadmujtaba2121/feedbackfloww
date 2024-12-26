import React from 'react';
import PropTypes from 'prop-types';
import { FiClock, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { PROJECT_STATUS } from '../constants';

const StatusIcon = ({ status }) => {
  const getIcon = () => {
    switch (status) {
      case 'PENDING':
        return <FiClock className="text-accent" />;
      case 'IN_REVIEW':
        return <FiRefreshCw className="text-primary" />;
      case 'APPROVED':
        return <FiCheck className="text-green-400" />;
      case 'NEEDS_REVISION':
        return <FiRefreshCw className="text-red-400" />;
      case 'REJECTED':
        return <FiX className="text-red-400" />;
      default:
        return <FiClock className="text-muted-foreground" />;
    }
  };

  return getIcon();
};

StatusIcon.propTypes = {
  status: PropTypes.oneOf(Object.keys(PROJECT_STATUS))
};

export default StatusIcon;
