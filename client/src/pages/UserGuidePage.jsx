import React, { useState } from 'react';
import { FiBook, FiUsers, FiLayers, FiCpu, FiGitBranch, FiMessageSquare, FiCalendar, FiGrid } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SEOMetadata from '../components/SEOMetadata';

const UserGuidePage = () => {
    const [activeSection, setActiveSection] = useState('getting-started');

    const sections = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: <FiBook />,
            content: [
                {
                    title: 'Welcome to FeedbackFlow',
                    description: 'FeedbackFlow is your all-in-one design feedback and collaboration platform. This guide will help you maximize its potential.',
                    steps: [
                        'Create your account or sign in using Google/GitHub',
                        'Set up your profile and preferences',
                        'Create your first project or join an existing one',
                        'Invite team members to collaborate'
                    ]
                }
            ]
        },
        {
            id: 'collaboration',
            title: 'Real-time Collaboration',
            icon: <FiUsers />,
            content: [
                {
                    title: 'Working with Teams',
                    description: 'Collaborate seamlessly with your team in real-time.',
                    steps: [
                        'Invite members using email or sharing link',
                        'Assign roles: Admin, Editor, or Viewer',
                        'Use live cursors to point out specific areas',
                        'Chat in real-time with team members'
                    ]
                },
                {
                    title: 'Feedback Sessions',
                    description: 'Conduct effective feedback sessions.',
                    steps: [
                        'Schedule feedback sessions using the calendar',
                        'Use voice notes for detailed explanations',
                        'Draw annotations directly on designs',
                        'Tag team members for specific feedback'
                    ]
                }
            ]
        },
        {
            id: 'file-management',
            title: 'File Management',
            icon: <FiLayers />,
            content: [
                {
                    title: 'Supported File Types',
                    description: 'Work with various file formats efficiently.',
                    steps: [
                        'Upload designs: PNG, JPEG, SVG',
                        'Preview files directly in the browser',
                        'Organize files using folders and tags',
                        'Search files using AI-powered search'
                    ]
                }
            ]
        },
        {
            id: 'ai-features',
            title: 'AI Assistant',
            icon: <FiCpu />,
            content: [
                {
                    title: 'AI-Powered Features',
                    description: 'Leverage AI to enhance your feedback process.',
                    steps: [
                        'Get automated design suggestions',
                        'Use AI to analyze design consistency',
                        'Generate smart summaries of feedback',
                        'Receive accessibility recommendations'
                    ]
                }
            ]
        },
        {
            id: 'version-control',
            title: 'Version Control',
            icon: <FiGitBranch />,
            content: [
                {
                    title: 'Managing Versions',
                    description: 'Track and manage design iterations effectively.',
                    steps: [
                        'Create new versions of designs',
                        'Compare versions side by side',
                        'Restore previous versions',
                        'Add version notes and tags'
                    ]
                }
            ]
        },
        {
            id: 'comments',
            title: 'Smart Comments',
            icon: <FiMessageSquare />,
            content: [
                {
                    title: 'Advanced Commenting',
                    description: 'Use smart comments for better communication.',
                    steps: [
                        'Add contextual comments on designs',
                        'Use @mentions to notify team members',
                        'Attach references and links',
                        'Create comment threads for discussions'
                    ]
                }
            ]
        },
        {
            id: 'project-management',
            title: 'Project Tools',
            icon: <FiGrid />,
            content: [
                {
                    title: 'Kanban Board',
                    description: 'Organize tasks and track progress.',
                    steps: [
                        'Create and manage task cards',
                        'Set up custom workflows',
                        'Track task status and deadlines',
                        'Assign tasks to team members'
                    ]
                },
                {
                    title: 'Calendar View',
                    icon: <FiCalendar />,
                    description: 'Schedule and manage deadlines.',
                    steps: [
                        'View project timeline',
                        'Schedule feedback sessions',
                        'Set task deadlines',
                        'Get deadline reminders'
                    ]
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <SEOMetadata
                title="User Guide - FeedbackFlow"
                description="Learn how to use FeedbackFlow's features effectively. Complete guide for design feedback and collaboration."
                path="/guide"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-64 flex-shrink-0">
                        <nav className="sticky top-4 space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === section.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    {section.icon}
                                    {section.title}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className={activeSection === section.id ? 'block' : 'hidden'}
                            >
                                <h1 className="text-3xl font-bold text-secondary-foreground mb-8">
                                    {section.title}
                                </h1>

                                <div className="space-y-12">
                                    {section.content.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="bg-foreground rounded-xl p-6 border border-border"
                                        >
                                            <h2 className="text-xl font-semibold text-secondary-foreground mb-4">
                                                {item.title}
                                            </h2>
                                            <p className="text-muted-foreground mb-6">
                                                {item.description}
                                            </p>
                                            <ul className="space-y-4">
                                                {item.steps.map((step, stepIndex) => (
                                                    <li
                                                        key={stepIndex}
                                                        className="flex items-start gap-3 text-secondary-foreground"
                                                    >
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                                                            {stepIndex + 1}
                                                        </span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuidePage; 