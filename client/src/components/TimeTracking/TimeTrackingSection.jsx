import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiUser, FiCalendar, FiBarChart2, FiEdit2, FiX, FiChevronDown, FiChevronRight, FiCheckSquare } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import TimeTracker from './TimeTracker';

const TimeTrackingSection = ({ projectId }) => {
    const { tasks, updateTask } = useTask();
    const { currentUser } = useAuth();
    const [selectedTimeframe, setSelectedTimeframe] = useState('week');
    const [selectedUser, setSelectedUser] = useState('all');
    const [showTimeDetails, setShowTimeDetails] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState(new Set());

    // Get unique users from tasks
    const users = useMemo(() => {
        const userSet = new Set();
        tasks.forEach(task => {
            if (task.assignedTo) userSet.add(task.assignedTo);
            if (task.timeLogs) {
                task.timeLogs.forEach(log => {
                    if (log.userId) userSet.add(log.userId);
                });
            }
        });
        return Array.from(userSet);
    }, [tasks]);

    // Calculate time statistics with subtask breakdown
    const timeStats = useMemo(() => {
        const now = new Date();
        const stats = {
            total: 0,
            today: 0,
            week: 0,
            month: 0,
            byUser: {},
            byTask: {}
        };

        tasks.forEach(task => {
            if (!task.timeLogs && !task.subtasks?.some(st => st.timeLogs?.length)) return;

            // Initialize task stats
            if (!stats.byTask[task.id]) {
                stats.byTask[task.id] = {
                    title: task.title,
                    assignedTo: task.assignedTo,
                    total: 0,
                    today: 0,
                    week: 0,
                    month: 0,
                    logs: [],
                    subtasks: {},
                    status: task.status
                };
            }

            // Process main task time logs
            if (task.timeLogs) {
                task.timeLogs.forEach(log => processTimeLog(log, task.id, null, stats));
            }

            // Process subtask time logs
            task.subtasks?.forEach(subtask => {
                if (!stats.byTask[task.id].subtasks[subtask.id]) {
                    stats.byTask[task.id].subtasks[subtask.id] = {
                        title: subtask.title,
                        total: 0,
                        today: 0,
                        week: 0,
                        month: 0,
                        logs: [],
                        completed: subtask.completed
                    };
                }

                subtask.timeLogs?.forEach(log => processTimeLog(log, task.id, subtask.id, stats));
            });
        });

        return stats;
    }, [tasks, selectedUser]);

    const processTimeLog = (log, taskId, subtaskId, stats) => {
        const logDate = new Date(log.startTime);
        const userId = log.userId;

        if (selectedUser !== 'all' && userId !== selectedUser) return;

        // Initialize user stats if not exists
        if (!stats.byUser[userId]) {
            stats.byUser[userId] = {
                total: 0,
                today: 0,
                week: 0,
                month: 0,
                tasks: new Set()
            };
        }

        const duration = log.duration || 0;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

        // Update global stats
        stats.total += duration;
        if (logDate >= today) stats.today += duration;
        if (logDate >= weekAgo) stats.week += duration;
        if (logDate >= monthAgo) stats.month += duration;

        // Update user stats
        stats.byUser[userId].total += duration;
        if (logDate >= today) stats.byUser[userId].today += duration;
        if (logDate >= weekAgo) stats.byUser[userId].week += duration;
        if (logDate >= monthAgo) stats.byUser[userId].month += duration;
        stats.byUser[userId].tasks.add(taskId);

        // Update task/subtask stats
        const target = subtaskId ? stats.byTask[taskId].subtasks[subtaskId] : stats.byTask[taskId];
        target.total += duration;
        if (logDate >= today) target.today += duration;
        if (logDate >= weekAgo) target.week += duration;
        if (logDate >= monthAgo) target.month += duration;
        target.logs.push({ ...log, formattedDuration: formatDuration(duration) });

        // Also update parent task totals for subtask time
        if (subtaskId) {
            stats.byTask[taskId].total += duration;
            if (logDate >= today) stats.byTask[taskId].today += duration;
            if (logDate >= weekAgo) stats.byTask[taskId].week += duration;
            if (logDate >= monthAgo) stats.byTask[taskId].month += duration;
        }
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const handleEditTimeLog = async (taskId, subtaskId, log) => {
        // Implementation for editing time logs
        // This would open a modal to edit the duration
    };

    const toggleTaskExpand = (taskId) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Time Tracking</h2>
                    <div className="flex gap-4">
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="px-3 py-2 bg-input text-foreground rounded-md border border-input"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>

                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="px-3 py-2 bg-input text-foreground rounded-md border border-input"
                        >
                            <option value="all">All Users</option>
                            {users.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Time Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <FiClock className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">Total Time</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {formatDuration(timeStats[selectedTimeframe] || timeStats.total)}
                        </div>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <FiUser className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">Active Users</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {Object.keys(timeStats.byUser).length}
                        </div>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <FiCheckSquare className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">Tasks Tracked</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {Object.keys(timeStats.byTask).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Time by User */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Time by User</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(timeStats.byUser).map(([userId, stats]) => (
                        <div key={userId} className="p-4 bg-card rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <FiUser className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{userId}</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">
                                {formatDuration(stats[selectedTimeframe] || stats.total)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {stats.tasks.size} tasks worked on
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time by Task */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Time by Task</h3>
                <div className="space-y-4">
                    {Object.entries(timeStats.byTask).map(([taskId, taskStats]) => (
                        <div key={taskId} className="bg-card rounded-lg border border-border overflow-hidden">
                            {/* Task Header */}
                            <div
                                className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleTaskExpand(taskId)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {expandedTasks.has(taskId) ? (
                                            <FiChevronDown className="w-4 h-4" />
                                        ) : (
                                            <FiChevronRight className="w-4 h-4" />
                                        )}
                                        <h4 className="font-medium text-foreground">{taskStats.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${taskStats.status === 'COMPLETED'
                                            ? 'bg-success/10 text-success'
                                            : taskStats.status === 'IN_PROGRESS'
                                                ? 'bg-warning/10 text-warning'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {taskStats.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground ml-6">
                                        Assigned to: {taskStats.assignedTo || 'Unassigned'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-foreground">
                                        {formatDuration(taskStats[selectedTimeframe] || taskStats.total)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {Object.keys(taskStats.subtasks).length} subtasks
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Task Details */}
                            {expandedTasks.has(taskId) && (
                                <div className="border-t border-border">
                                    {/* Subtasks */}
                                    {Object.entries(taskStats.subtasks).map(([subtaskId, subtaskStats]) => (
                                        <div key={subtaskId} className="p-4 border-b border-border last:border-b-0 pl-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${subtaskStats.completed
                                                            ? 'line-through text-muted-foreground'
                                                            : 'text-foreground'
                                                            }`}>
                                                            {subtaskStats.title}
                                                        </span>
                                                        {subtaskStats.completed && (
                                                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-foreground">
                                                        {formatDuration(subtaskStats[selectedTimeframe] || subtaskStats.total)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time Logs */}
                                            <div className="mt-2 space-y-1">
                                                {subtaskStats.logs.map((log, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <FiClock className="w-3 h-3" />
                                                            <span>{new Date(log.startTime).toLocaleString()}</span>
                                                            <span className="text-xs">({log.userId})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span>{log.formattedDuration}</span>
                                                            {(currentUser?.role === 'owner' || currentUser?.role === 'editor') && (
                                                                <button
                                                                    onClick={() => handleEditTimeLog(taskId, subtaskId, log)}
                                                                    className="text-primary hover:text-primary/90"
                                                                >
                                                                    <FiEdit2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Main Task Time Logs */}
                                    {taskStats.logs.length > 0 && (
                                        <div className="p-4 bg-muted/50 border-t border-border">
                                            <div className="text-sm font-medium text-foreground mb-2">Main Task Time Logs</div>
                                            <div className="space-y-1">
                                                {taskStats.logs.map((log, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <FiClock className="w-3 h-3" />
                                                            <span>{new Date(log.startTime).toLocaleString()}</span>
                                                            <span className="text-xs">({log.userId})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span>{log.formattedDuration}</span>
                                                            {(currentUser?.role === 'owner' || currentUser?.role === 'editor') && (
                                                                <button
                                                                    onClick={() => handleEditTimeLog(taskId, null, log)}
                                                                    className="text-primary hover:text-primary/90"
                                                                >
                                                                    <FiEdit2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <TimeTracker projectId={projectId} />
        </div>
    );
};

export default TimeTrackingSection; 