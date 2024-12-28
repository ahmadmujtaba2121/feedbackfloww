import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { FiArrowRight } from 'react-icons/fi';

const JoinProject = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        try {
            // Query projects with either viewerCode or editorCode matching
            const projectsRef = collection(db, 'projects');
            const viewerQuery = query(projectsRef, where('viewerCode', '==', code.trim()));
            const editorQuery = query(projectsRef, where('editorCode', '==', code.trim()));

            const [viewerSnapshot, editorSnapshot] = await Promise.all([
                getDocs(viewerQuery),
                getDocs(editorQuery)
            ]);

            let projectDoc = viewerSnapshot.docs[0] || editorSnapshot.docs[0];

            if (!projectDoc) {
                toast.error('Project not found');
                return;
            }

            const projectId = projectDoc.id;
            const projectData = projectDoc.data();

            // Check if user is already a member
            const isMember = projectData.members?.some(member => member.email === currentUser.email);
            if (isMember) {
                toast.success('Already a member of this project');
                navigate(`/project/${projectId}`);
                return;
            }

            // Determine role based on which code was used
            const role = code === projectData.editorCode ? 'EDITOR' : 'VIEWER';

            // Get user's display name from Firebase Auth
            const displayName = currentUser.displayName || currentUser.email.split('@')[0];

            // Add user to project members
            const newMember = {
                email: currentUser.email,
                displayName,
                role,
                uid: currentUser.uid,
                addedAt: new Date().toISOString()
            };

            // Update project with new member
            await updateDoc(doc(db, 'projects', projectId), {
                members: [...(projectData.members || []), newMember],
                updatedAt: new Date().toISOString()
            });

            toast.success('Successfully joined project');
            navigate(`/project/${projectId}`);
        } catch (error) {
            console.error('Error joining project:', error);
            toast.error('Failed to join project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-secondary-foreground mb-2">Join Project</h1>
                    <p className="text-muted-foreground">Enter the project code to join</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-muted-foreground mb-2">
                            Project Code
                        </label>
                        <input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter project code"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Joining...' : (
                            <>
                                Join Project
                                <FiArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinProject; 