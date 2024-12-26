import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AIChat from '../components/AIAssistant/AIChat';
import { useAuth } from '../contexts/AuthContext';
import { AIProvider } from '../contexts/AIContext';

const AIAssistant = () => {
    const { projectId } = useParams();
    const location = useLocation();
    const { currentUser } = useAuth();
    const project = location.state?.project;

    if (!currentUser || !projectId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <AIProvider>
            <div className="min-h-screen bg-background pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-foreground/95 backdrop-blur-lg rounded-lg border border-border overflow-hidden">
                        <AIChat projectId={projectId} />
                    </div>
                </div>
            </div>
        </AIProvider>
    );
};

export default AIAssistant; 