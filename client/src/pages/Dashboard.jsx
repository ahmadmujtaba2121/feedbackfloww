import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFolder, FiClock, FiUsers, FiStar } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import CreateProjectModal from '../components/CreateProject';

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState({
    owned: [],
    joined: []
  });
  const [loading, setLoading] = React.useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const renderProjectCard = (project, type) => (
    <div
      key={project.id}
      onClick={() => navigate(`/project/${project.id}`)}
      className="group bg-card hover:bg-accent/5 p-4 rounded-lg border border-input hover:border-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FiFolder className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-primary group-hover:text-primary/90">{project.name}</h3>
            {type === 'owned' && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                Owner
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-2">
            <ReviewStatusBadge status={project.status} />
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {project.description || 'No description'}
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <FiUsers className="w-4 h-4" />
              {project.members?.length || 1} members
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <FiClock className="w-4 h-4" />
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
            {project.lastActive && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <FiStar className="w-4 h-4" />
                Last active {new Date(project.lastActive).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Files Information */}
          {project.files && project.files.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {project.files.length} files
              </span>
              <div className="flex items-center gap-1">
                {[...new Set(project.files.map(f => f.type?.split('/')[1]?.toUpperCase()))].map(type => (
                  <span key={type} className="px-2 py-0.5 bg-accent/50 text-accent-foreground rounded text-xs">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  React.useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser?.email) return;

      try {
        setLoading(true);
        const projectsRef = collection(db, 'projects');

        // Get all projects
        const projectsSnapshot = await getDocs(projectsRef);

        // Filter owned and joined projects
        const allProjects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const ownedProjects = allProjects.filter(project =>
          project.owner === currentUser.email
        );

        const joinedProjects = allProjects.filter(project =>
          project.owner !== currentUser.email &&
          project.members?.some(member =>
            member.email === currentUser.email
          )
        );

        setProjects({
          owned: ownedProjects,
          joined: joinedProjects
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage and organize your design feedback
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/join')}
              className="px-4 py-2 text-sm font-medium bg-card hover:bg-accent text-accent-foreground rounded-lg border border-input transition-colors"
            >
              Join Project
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Your Projects */}
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">Your Projects</h2>
              {projects.owned.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.owned.map(project => renderProjectCard(project, 'owned'))}
                </div>
              ) : (
                <div className="bg-card p-8 rounded-lg border border-input text-center">
                  <p className="text-muted-foreground">You haven't created any projects yet.</p>
                </div>
              )}
            </section>

            {/* Joined Projects */}
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">Joined Projects</h2>
              {projects.joined.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.joined.map(project => renderProjectCard(project, 'joined'))}
                </div>
              ) : (
                <div className="bg-card p-8 rounded-lg border border-input text-center">
                  <p className="text-muted-foreground">You haven't joined any projects yet.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(projectId) => {
            setIsCreateModalOpen(false);
            navigate(`/project/${projectId}`);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
