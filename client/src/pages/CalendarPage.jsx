import React from 'react';
import { useParams } from 'react-router-dom';
import CalendarView from '../components/Calendar/CalendarView';
import { TaskProvider } from '../contexts/TaskContext';

const CalendarPage = () => {
  const { projectId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-8">
          <TaskProvider projectId={projectId}>
            <CalendarView projectId={projectId} />
          </TaskProvider>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 