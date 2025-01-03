import React from 'react';
import { useParams } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import { TaskProvider } from '../contexts/TaskContext';

const KanbanPage = () => {
  const { projectId } = useParams();

  if (!projectId) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <TaskProvider projectId={projectId}>
          <KanbanBoard />
        </TaskProvider>
      </div>
    </div>
  );
};

export default KanbanPage; 