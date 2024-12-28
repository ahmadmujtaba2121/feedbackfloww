import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { celebrateApproval } from '../components/CelebrationEffects';
import CreateProject from '../components/CreateProject';

const ReviewStatusBadge = ({ status }) => {
  const statusStyles = {
    APPROVED: 'bg-primary/20 text-primary border-primary/50',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/50',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
  };

  const statusText = {
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending Review'
  };

  const normalizedStatus = status?.toUpperCase() || 'PENDING';

  return (
    <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[normalizedStatus]}`}>
      {statusText[normalizedStatus]}
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const fileTypes = project.files?.map(f => f.type?.split('/')[1]?.toUpperCase()) || [];
  const uniqueTypes = [...new Set(fileTypes)];
  const fileCount = project.files?.length || 0;

  const formatDate = (date) => {
    if (!date) return '';
    try {
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const status = project.status || 'PENDING';

  return (
    <Link
      to={`/project/${project.id}`}
      className="block p-6 bg-foreground backdrop-blur-lg border border-border rounded-lg hover:bg-muted transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-secondary-foreground">{project.name}</h3>
        <ReviewStatusBadge status={status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{fileCount} files</span>
          <div className="flex items-center gap-1">
            {uniqueTypes.map(type => (
              <span
                key={type}
                className="px-2 py-0.5 bg-muted text-secondary-foreground rounded text-xs"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {project.lastReviewedAt && (
        <div className="mt-3 text-xs text-muted-foreground">
          Last reviewed {formatDate(project.lastReviewedAt)}
          {project.lastReviewedBy && ` by ${project.lastReviewedBy}`}
        </div>
      )}
    </Link>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentStatusChange, setRecentStatusChange] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser?.email) return;

      try {
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('owner', '==', currentUser.email)
        );

        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Check for recent status changes (within last 5 minutes)
        const recentlyChanged = projectsData.find(project => {
          if (!project.lastReviewedAt) return false;
          const reviewTime = typeof project.lastReviewedAt === 'string'
            ? new Date(project.lastReviewedAt)
            : project.lastReviewedAt.toDate?.() || new Date();
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return reviewTime > fiveMinutesAgo;
        });

        if (recentlyChanged) {
          setRecentStatusChange(recentlyChanged.reviewStatus);
          if (recentlyChanged.reviewStatus === 'APPROVED') {
            celebrateApproval();
          }
          // Clear the status after celebration
          setTimeout(() => setRecentStatusChange(null), 2000);
        }

        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-foreground rounded mb-4"></div>
            <div className="h-4 w-96 bg-foreground rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-foreground rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-secondary-foreground mb-2">My Projects</h1>
              <p className="text-muted-foreground">Manage and organize your design feedback</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/join')}
                className="inline-flex items-center px-4 py-2 bg-background text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
              >
                Join Project
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-medium"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Create Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl text-muted-foreground mb-4">No projects yet</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-medium"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateProject onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

export default Dashboard;
