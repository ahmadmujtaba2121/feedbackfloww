import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const JoinProject = () => {
    const [projectCode, setProjectCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!projectCode.trim()) return;

        setLoading(true);
        try {
            const projectRef = doc(db, 'projects', projectCode);
            const projectDoc = await getDoc(projectRef);

            if (!projectDoc.exists()) {
                toast.error('Project not found');
                return;
            }

            const data = projectDoc.data();
            const members = data.members || [];

            // Check if user is already a member
            if (members.some(member => member.email === currentUser.email)) {
                navigate(`/project/${projectCode}`);
                return;
            }

            // Add user to project members
            const memberData = {
                email: currentUser.email,
                role: 'viewer',
                addedAt: new Date().toISOString(),
                status: 'active'
            };

            await updateDoc(projectRef, {
                members: arrayUnion(memberData),
                [`lastActivity.${currentUser.email.replace(/\./g, '_')}`]: serverTimestamp()
            });

            toast.success('Successfully joined the project!');
            navigate(`/project/${projectCode}`);
        } catch (error) {
            console.error('Error joining project:', error);
            toast.error('Failed to join project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-foreground rounded-lg shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center">Join Project</h2>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="projectCode" className="block text-sm font-medium text-muted-foreground mb-2">
                            Enter Project Code
                        </label>
                        <input
                            id="projectCode"
                            type="text"
                            value={projectCode}
                            onChange={(e) => setProjectCode(e.target.value)}
                            placeholder="Enter project code"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !projectCode.trim()}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? <LoadingSpinner /> : 'Join Project'}
                    </button>
                </form>

                <p className="mt-4 text-sm text-muted-foreground text-center">
                    Ask the project owner for the project code
                </p>
            </div>
        </div>
    );
};

export default JoinProject; 