import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

const CreateProjectModal = ({ onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fileFormat, setFileFormat] = useState('PNG');
    const [accessType, setAccessType] = useState('private'); // 'private' or 'public'
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const projectData = {
                name: name.trim(),
                description: description.trim(),
                fileFormat,
                accessType,
                owner: currentUser.email,
                members: [{
                    email: currentUser.email,
                    role: 'owner',
                    addedAt: new Date().toISOString(),
                    status: 'active'
                }],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'projects'), projectData);
            toast.success('Project created successfully!');
            navigate(`/project/${docRef.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <div
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-lg bg-foreground rounded-lg shadow-xl p-6 border border-border"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-primary">Create New Project</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-background rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Project Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                                Project Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter project name"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your project"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                            />
                        </div>

                        {/* File Format */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                File Format
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {['PNG', 'JPG', 'SVG'].map(format => (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => setFileFormat(format)}
                                        className={`p-4 rounded-lg border ${fileFormat === format
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-background text-muted-foreground'
                                            }`}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Access Type */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Access Control
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAccessType('private')}
                                    className={`p-4 rounded-lg border ${accessType === 'private'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-muted-foreground'
                                        }`}
                                >
                                    Private
                                    <p className="text-xs mt-1 text-muted-foreground">Only invited members can access</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccessType('public')}
                                    className={`p-4 rounded-lg border ${accessType === 'public'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-muted-foreground'
                                        }`}
                                >
                                    Public
                                    <p className="text-xs mt-1 text-muted-foreground">Anyone with the code can join</p>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? <LoadingSpinner /> : 'Create Project'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CreateProjectModal; 