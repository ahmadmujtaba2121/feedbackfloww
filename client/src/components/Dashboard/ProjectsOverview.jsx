import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFolder, FiClock, FiUsers, FiStar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const ProjectsOverview = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState({
        owned: [],
        joined: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const ownedQuery = query(
                    collection(db, 'projects'),
                    where('owner', '==', currentUser?.email),
                    orderBy('createdAt', 'desc')
                );

                const joinedQuery = query(
                    collection(db, 'projects'),
                    where('members', 'array-contains', currentUser?.email),
                    orderBy('createdAt', 'desc')
                );

                const [ownedSnapshot, joinedSnapshot] = await Promise.all([
                    getDocs(ownedQuery),
                    getDocs(joinedQuery)
                ]);

                const ownedProjects = ownedSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const joinedProjects = joinedSnapshot.docs
                    .filter(doc => doc.data().owner !== currentUser?.email)
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

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

        if (currentUser?.email) {
            fetchProjects();
        }
    }, [currentUser]);

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const renderProjectCard = (project, type) => (
        <div
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all group"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <FiFolder className="w-5 h-5 text-primary" />
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        {type === 'owned' && (
                            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                                Owner
                            </span>
                        )}
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
                </div>
                {type === 'owned' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add edit functionality
                            }}
                            className="p-2 hover:bg-primary/10 rounded-full"
                            title="Edit Project"
                        >
                            <FiEdit2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add delete functionality
                            }}
                            className="p-2 hover:bg-destructive/10 rounded-full"
                            title="Delete Project"
                        >
                            <FiTrash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Owned Projects */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
                    <button
                        onClick={() => navigate('/create-project')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
                {projects.owned.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.owned.map(project => renderProjectCard(project, 'owned'))}
                    </div>
                ) : (
                    <div className="bg-card p-8 rounded-lg border border-border text-center">
                        <p className="text-muted-foreground">You haven't created any projects yet.</p>
                    </div>
                )}
            </section>

            {/* Joined Projects */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Joined Projects</h2>
                {projects.joined.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.joined.map(project => renderProjectCard(project, 'joined'))}
                    </div>
                ) : (
                    <div className="bg-card p-8 rounded-lg border border-border text-center">
                        <p className="text-muted-foreground">You haven't joined any projects yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProjectsOverview; 