import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardProjectCard({ project }) {
  const getStatusBadge = () => {
    switch (project.status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{project.title}</h3>
        {getStatusBadge()}
      </div>
      <p className="text-gray-600 mb-4">{project.description}</p>
      <div className="flex justify-between items-center">
        <Link
          to={`/project/${project.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          View Details →
        </Link>
        <span className="text-sm text-gray-500">
          Created: {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
} 