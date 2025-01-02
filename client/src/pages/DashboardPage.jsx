import React from 'react';
import ProjectsOverview from '../components/Dashboard/ProjectsOverview';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const DashboardPage = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome back, {currentUser.email}
                    </p>
                </div>

                <ProjectsOverview />
            </div>
        </div>
    );
};

export default DashboardPage; 