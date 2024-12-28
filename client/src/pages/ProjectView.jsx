import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiCalendar, FiList } from 'react-icons/fi';
import TeamSection from '../components/TeamSection';
import ShareButton from '../components/ShareButton';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectView = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          navigate('/dashboard');
          return;
        }

        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        };

        // Check if user has access
        const isMember = projectData.members?.some(
          member => member.email === currentUser.email
        );

        if (!isMember) {
          navigate('/dashboard');
          return;
        }

        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && currentUser) {
      loadProject();
    }
  }, [projectId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const userRole = project.members?.find(
    member => member.email === currentUser.email
  )?.role;

  return (
    <div className="min-h-screen bg-background">
      {/* Project Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-secondary-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/project/${projectId}/calendar`)}
                className="px-4 py-2 bg-background text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center space-x-2"
              >
                <FiCalendar className="w-5 h-5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => navigate(`/project/${projectId}/kanban`)}
                className="px-4 py-2 bg-background text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center space-x-2"
              >
                <FiList className="w-5 h-5" />
                <span>Kanban Board</span>
              </button>
              {userRole === 'OWNER' && <ShareButton projectId={projectId} />}
            </div>
          </div>
        </div>
      </div>

      {/* Project Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Project Canvas Button */}
            <button
              onClick={() => navigate(`/project/${projectId}/canvas`)}
              className="w-full p-6 bg-foreground border border-border rounded-lg hover:bg-muted transition-all text-left mb-6"
            >
              <div className="flex items-center space-x-2 text-primary">
                <span className="font-medium">Open Canvas</span>
              </div>
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Section */}
            <TeamSection members={project.members || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
