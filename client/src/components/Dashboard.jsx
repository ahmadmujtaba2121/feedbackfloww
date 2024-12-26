import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiPlus, FiFolder, FiClock, FiUsers, FiFileText, FiStar, FiBookmark } from 'react-icons/fi';
import CreateProject from './CreateProject';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quickNote, setQuickNote] = useState('');
  const [pinnedTasks, setPinnedTasks] = useState([]);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [showTodoPanel, setShowTodoPanel] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) {
      setLoading(false);
      return;
    }

    try {
      // Query for projects where the user is the owner
      const projectsQuery = query(
        collection(db, 'projects'),
        where('owner', '==', currentUser.email),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        try {
          const projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert any Firestore timestamps to ISO strings
            const formatDate = (date) => {
              if (!date) return null;
              if (typeof date === 'string') return date;
              if (date.toDate) return date.toDate().toISOString();
              return new Date().toISOString();
            };

            return {
              id: doc.id,
              ...data,
              createdAt: formatDate(data.createdAt),
              updatedAt: formatDate(data.updatedAt)
            };
          });
          console.log('Fetched projects:', projectsData);
          setProjects(projectsData);
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error('Error processing projects:', err);
          setError('Error loading projects');
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up projects subscription:', err);
      setError('Error loading projects');
      setLoading(false);
    }
  }, [currentUser]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  // Export note to file
  const exportToNotepad = async (content) => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quick-note-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting note:', error);
    }
  };

  // Get tasks due soon
  const getDueSoonTasks = () => {
    const allTasks = projects.flatMap(project => project.tasks || []);
    return allTasks
      .filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        const now = new Date();
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil <= 72; // Tasks due within 72 hours
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  };

  // Toggle pin/unpin task
  const togglePinTask = (task) => {
    setPinnedTasks(prev => {
      const isPinned = prev.some(t => t.id === task.id);
      if (isPinned) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'todo':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <div className="flex mt-4 space-x-4">
              <button
                onClick={() => setShowQuickNotes(!showQuickNotes)}
                className="flex items-center px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
              >
                <FiFileText className="mr-2" />
                Quick Notes
              </button>
              <button
                onClick={() => setShowTodoPanel(!showTodoPanel)}
                className="flex items-center px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
              >
                <FiBookmark className="mr-2" />
                Quick TODOs
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg hover:opacity-90 transition-opacity flex items-center"
          >
            <FiPlus className="mr-2" />
            New Project
          </button>
        </div>

        {/* Quick Access Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Notes Panel */}
          {showQuickNotes && (
            <div className="lg:col-span-2">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white flex items-center mb-3">
                  <FiFileText className="mr-2 text-violet-400" />
                  Quick Notes
                </h3>
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Take quick notes..."
                  className="w-full h-32 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
                />
                <button
                  onClick={() => exportToNotepad(quickNote)}
                  className="mt-2 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 text-sm flex items-center"
                >
                  <FiFileText className="mr-2" />
                  Export Note
                </button>
              </div>
            </div>
          )}

          {/* Quick TODOs Panel */}
          {showTodoPanel && (
            <div className="lg:col-span-2">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="space-y-4">
                  {/* Pinned Tasks Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center mb-3">
                      <FiStar className="mr-2 text-yellow-400" />
                      Pinned Tasks
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pinnedTasks.length === 0 ? (
                        <p className="text-sm text-slate-400">No pinned tasks yet</p>
                      ) : (
                        pinnedTasks.map(task => (
                          <motion.div
                            key={task.id}
                            className="bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"
                            whileHover={{ scale: 1.02 }}
                          >
                            <span className="text-sm text-white">{task.title}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400">
                                {task.deadline && new Date(task.deadline).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => togglePinTask(task)}
                                className="text-yellow-400 hover:text-yellow-300"
                              >
                                <FiStar className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Due Soon Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center mb-3">
                      <FiClock className="mr-2 text-blue-400" />
                      Due Soon
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getDueSoonTasks().length === 0 ? (
                        <p className="text-sm text-slate-400">No tasks due soon</p>
                      ) : (
                        getDueSoonTasks().map(task => (
                          <motion.div
                            key={task.id}
                            className="bg-slate-700/50 rounded-lg p-2"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white">{task.title}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400">
                                  Due: {new Date(task.deadline).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={() => togglePinTask(task)}
                                  className={`${pinnedTasks.some(t => t.id === task.id)
                                    ? 'text-yellow-400 hover:text-yellow-300'
                                    : 'text-slate-400 hover:text-yellow-400'
                                    }`}
                                >
                                  <FiStar className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 rounded-lg border border-slate-700">
            <FiFolder className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-4">Create your first project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors inline-flex items-center"
            >
              <FiPlus className="mr-2" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden hover:border-violet-500/50 transition-colors"
              >
                <Link to={`/project/${project.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">{project.name}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FiClock className="mr-2 text-slate-400" />
                      <span className="text-slate-300">
                        Created {formatDisplayDate(project.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiUsers className="mr-2 text-slate-400" />
                      <span className="text-slate-300">
                        {project.members?.length || 1} member{project.members?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full border ${getProjectStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status || 'Pending'}
                    </span>
                    {project.format && (
                      <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                        {project.format}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProject onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default Dashboard; 