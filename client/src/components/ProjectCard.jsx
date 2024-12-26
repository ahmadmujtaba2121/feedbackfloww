import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUser, FiTrash2 } from 'react-icons/fi';

const ProjectCard = ({ project, onDelete }) => {
    const statusColors = {
        APPROVED: 'bg-green-500/20 text-green-400 border-green-500/50',
        REJECTED: 'bg-red-500/20 text-red-400 border-red-500/50',
        CHANGES_REQUESTED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        PENDING: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    };

    const getStatusBadge = () => {
        const status = project.status || 'PENDING';
        return (
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                {status.replace('_', ' ')}
            </div>
        );
    };

    return (
        <Link
            to={`/project/${project.id}`}
            className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700/50 transition-colors relative group"
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white truncate pr-8">
                    {project.name}
                </h3>
                {getStatusBadge()}
            </div>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                {project.description || 'No description provided'}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
                <div>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</div>
                <div className="flex items-center space-x-1">
                    <FiUser className="w-4 h-4" />
                    <span>{project.owner}</span>
                </div>
            </div>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(project.id);
                    }}
                    className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            )}
        </Link>
    );
};

export default ProjectCard; 