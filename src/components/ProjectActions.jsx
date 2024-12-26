import React from 'react';
import { updateProjectStatus } from '../utils/projectUtils';

export default function ProjectActions({ projectId }) {
  const handleStatusUpdate = async (status) => {
    await updateProjectStatus(projectId, status);
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleStatusUpdate('approved')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Approve
      </button>
      <button
        onClick={() => handleStatusUpdate('rejected')}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Reject
      </button>
    </div>
  );
} 