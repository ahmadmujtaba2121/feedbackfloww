import React, { useState, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { FiFileText, FiUsers, FiActivity, FiMessageSquare, FiX } from 'react-icons/fi';
import AIChat from '../components/AI/AIChat';
import { toast } from 'react-hot-toast';

const InsightCard = ({ title, icon: Icon, content, onClick, disabled }) => {
    const { currentTheme } = useTheme();

    return (
        <div
            onClick={!disabled ? onClick : undefined}
            className={`bg-foreground/95 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-border transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
                }`}
        >
            <div className="flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-secondary-foreground">{title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{content}</p>
        </div>
    );
};

const AIPage = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectFiles, setProjectFiles] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [showChat, setShowChat] = useState(false);
    const { currentUser } = useAuth();
    const { currentTheme } = useTheme();
    const {
        analyzeProjectFiles,
        getActiveUsersInsight,
        analyzeFileChanges,
        isLoading
    } = useAI();

    // Load user's projects
    useEffect(() => {
        if (!currentUser?.email) {
            console.log('No user email found');
            return;
        }

        const loadProjects = async () => {
            try {
                console.log('Loading projects for user:', currentUser.email);

                // Get all projects from Firestore
                const projectsRef = collection(db, 'projects');
                const [ownerSnap, teamSnap] = await Promise.all([
                    getDocs(query(projectsRef, where('owner', '==', currentUser.email))),
                    getDocs(query(projectsRef, where('team', 'array-contains', currentUser.email)))
                ]);

                // Combine and deduplicate projects
                const projectMap = new Map();

                // Process projects where user is owner
                for (const doc of ownerSnap.docs) {
                    if (!projectMap.has(doc.id)) {
                        const data = doc.data();
                        projectMap.set(doc.id, {
                            id: doc.id,
                            ...data,
                            role: 'owner',
                            lastModified: data.lastModified?.toDate() || new Date()
                        });
                    }
                }

                // Process projects where user is team member
                for (const doc of teamSnap.docs) {
                    if (!projectMap.has(doc.id)) {
                        const data = doc.data();
                        projectMap.set(doc.id, {
                            id: doc.id,
                            ...data,
                            role: 'member',
                            lastModified: data.lastModified?.toDate() || new Date()
                        });
                    }
                }

                const projectData = Array.from(projectMap.values())
                    .sort((a, b) => b.lastModified - a.lastModified);

                console.log('Found projects:', projectData);
                setProjects(projectData);

                // Auto-select first project if none selected
                if (!selectedProject && projectData.length > 0) {
                    handleProjectSelect(projectData[0]);
                }
            } catch (error) {
                console.error('Error loading projects:', error);
                toast.error('Failed to load your projects');
            }
        };

        loadProjects();

        // Set up real-time listener for project updates
        const projectsRef = collection(db, 'projects');
        const unsubscribe = onSnapshot(
            query(projectsRef,
                where('owner', '==', currentUser.email)
            ),
            (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'modified') {
                        const updatedProject = {
                            id: change.doc.id,
                            ...change.doc.data(),
                            lastModified: change.doc.data().lastModified?.toDate() || new Date()
                        };

                        // Update projects list
                        setProjects(prev => {
                            const newProjects = prev.filter(p => p.id !== updatedProject.id);
                            return [...newProjects, updatedProject]
                                .sort((a, b) => b.lastModified - a.lastModified);
                        });

                        // Update selected project if it's the current one
                        if (selectedProject?.id === updatedProject.id) {
                            handleProjectSelect(updatedProject);
                        }
                    }
                });
            },
            (error) => {
                console.error('Error in project listener:', error);
            }
        );

        return () => unsubscribe();
    }, [currentUser?.email]);

    const handleProjectSelect = async (project) => {
        if (!project?.id) return;

        try {
            console.log('Loading project data:', project.id);

            // Get fresh project data
            const projectRef = doc(db, 'projects', project.id);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                console.error('Project not found:', project.id);
                toast.error('Project not found');
                return;
            }

            const projectData = projectSnap.data();

            // Get all collections in parallel
            const [filesSnap, membersSnap, reviewsSnap, tasksSnap] = await Promise.all([
                getDocs(collection(projectRef, 'files')),
                getDocs(collection(projectRef, 'members')),
                getDocs(collection(projectRef, 'reviews')),
                getDocs(collection(projectRef, 'tasks'))
            ]);

            // Process files
            const files = filesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastModified: doc.data().lastModified?.toDate() || new Date()
            }));
            setProjectFiles(files);

            // Process members
            const members = membersSnap.docs.map(doc => ({
                email: doc.id,
                ...doc.data(),
                lastActive: doc.data().lastActive?.toDate() || new Date()
            }));
            setActiveUsers(members);

            // Process reviews
            const reviews = reviewsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            // Process tasks
            const tasks = tasksSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }));

            // Update selected project with all data
            const updatedProject = {
                id: project.id,
                ...projectData,
                files,
                members,
                reviews,
                tasks,
                lastModified: projectData.lastModified?.toDate()
            };

            setSelectedProject(updatedProject);
            console.log('Project data loaded:', updatedProject);

            // Set up real-time listeners for collections
            const unsubscribeFiles = onSnapshot(
                collection(projectRef, 'files'),
                (snapshot) => {
                    const updatedFiles = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        lastModified: doc.data().lastModified?.toDate() || new Date()
                    }));
                    setProjectFiles(updatedFiles);
                }
            );

            const unsubscribeMembers = onSnapshot(
                collection(projectRef, 'members'),
                (snapshot) => {
                    const updatedMembers = snapshot.docs.map(doc => ({
                        email: doc.id,
                        ...doc.data(),
                        lastActive: doc.data().lastActive?.toDate() || new Date()
                    }));
                    setActiveUsers(updatedMembers);
                }
            );

            // Clean up listeners when component unmounts or project changes
            return () => {
                unsubscribeFiles();
                unsubscribeMembers();
            };

        } catch (error) {
            console.error('Error loading project:', error);
            toast.error('Failed to load project data');
        }
    };

    const handleFileAnalysis = async () => {
        if (!selectedProject || !projectFiles.length) return;
        await analyzeProjectFiles(projectFiles, selectedProject.id);
    };

    const handleUserAnalysis = async () => {
        if (!selectedProject || !activeUsers.length) return;
        await getActiveUsersInsight(activeUsers);
    };

    const handleFileChanges = async (file) => {
        if (!file.history) return;
        await analyzeFileChanges(file, file.history);
    };

    return (
        <div className="flex-1 bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-secondary-foreground mb-8">AI Assistant</h1>

                {/* Project Selection */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-secondary-foreground mb-4">Select Project</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => handleProjectSelect(project)}
                                className={`p-4 rounded-lg border transition-colors ${selectedProject?.id === project.id
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-foreground border-border text-secondary-foreground hover:bg-muted'
                                    }`}
                            >
                                <h3 className="font-medium">{project.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {project.description || 'No description'}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Features */}
                {selectedProject && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InsightCard
                            title="Analyze Files"
                            icon={FiFileText}
                            content="Get insights about your project files and codebase."
                            onClick={handleFileAnalysis}
                            disabled={!projectFiles.length || isLoading}
                        />
                        <InsightCard
                            title="Team Activity"
                            icon={FiUsers}
                            content="Analyze team collaboration and activity patterns."
                            onClick={handleUserAnalysis}
                            disabled={!activeUsers.length || isLoading}
                        />
                        <InsightCard
                            title="Track Changes"
                            icon={FiActivity}
                            content="Monitor and analyze file changes over time."
                            onClick={() => handleFileChanges(selectedProject.files[0])}
                            disabled={!selectedProject.files?.length || isLoading}
                        />
                        <InsightCard
                            title="AI Chat"
                            icon={FiMessageSquare}
                            content="Chat with AI about your project."
                            onClick={() => setShowChat(true)}
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* AI Chat Modal */}
                {showChat && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-foreground/95 backdrop-blur-lg rounded-lg border border-border p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-secondary-foreground">AI Chat</h2>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="text-muted-foreground hover:text-secondary-foreground"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="h-[calc(80vh-8rem)] overflow-y-auto">
                                <AIChat projectId={selectedProject.id} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPage; 