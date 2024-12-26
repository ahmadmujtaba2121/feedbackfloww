import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiGrid, FiLayers, FiUsers, FiSettings, FiLogOut, FiCpu, FiBook } from 'react-icons/fi';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-slate-900 text-white py-4 px-6 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-8">
                    {/* Logo/Brand */}
                    <Link to="/" className="text-xl font-bold text-violet-500">
                        FeedbackFlow
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 hover:text-violet-400 transition-colors ${isActive('/dashboard') ? 'text-violet-500' : ''
                                }`}
                        >
                            <FiHome className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/projects"
                            className={`flex items-center gap-2 hover:text-violet-400 transition-colors ${isActive('/projects') ? 'text-violet-500' : ''
                                }`}
                        >
                            <FiGrid className="w-4 h-4" />
                            <span>Projects</span>
                        </Link>

                        <Link
                            to="/ai"
                            className={`flex items-center gap-2 hover:text-violet-400 transition-colors ${isActive('/ai') ? 'text-violet-500' : ''
                                }`}
                        >
                            <FiCpu className="w-4 h-4" />
                            <span>AI Assistant</span>
                        </Link>

                        <Link
                            to="/settings"
                            className={`flex items-center gap-2 hover:text-violet-400 transition-colors ${isActive('/settings') ? 'text-violet-500' : ''
                                }`}
                        >
                            <FiSettings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>

                        <Link
                            to="/guide"
                            className={`flex items-center gap-2 hover:text-violet-400 transition-colors ${isActive('/guide') ? 'text-violet-500' : ''
                                }`}
                        >
                            <FiBook className="w-4 h-4" />
                            <span>User Guide</span>
                        </Link>
                    </div>
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                    {currentUser && (
                        <>
                            <span className="text-sm text-slate-400">
                                {currentUser.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 