import React from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { PremiumFeature } from './PremiumFeature';

const ProjectHeader = () => {
    return (
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Projects</h1>

            <div className="flex items-center space-x-4">
                <PremiumFeature feature="create_projects">
                    <button
                        className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>New Project</span>
                    </button>
                </PremiumFeature>

                <PremiumFeature feature="edit_projects">
                    <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <FiEdit2 className="w-5 h-5" />
                    </button>
                </PremiumFeature>

                <PremiumFeature feature="delete_projects">
                    <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <FiTrash2 className="w-5 h-5" />
                    </button>
                </PremiumFeature>
            </div>
        </div>
    );
};

export default ProjectHeader; 