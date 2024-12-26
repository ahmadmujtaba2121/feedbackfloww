import React from 'react';
import { FiUsers } from 'react-icons/fi';

const ActiveUsers = () => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-2 mb-4">
        <FiUsers className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Active Users</h2>
      </div>
      <div className="flex items-center justify-center py-4">
        <p className="text-lg text-slate-400 font-medium">Coming Soon</p>
      </div>
    </div>
  );
};

export default ActiveUsers; 