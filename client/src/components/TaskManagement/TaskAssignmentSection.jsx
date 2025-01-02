import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiChevronDown, FiChevronRight, FiUser, FiUsers, FiCheckSquare, FiClock, FiEdit2, FiPlay, FiPause, FiCalendar, FiAlertCircle, FiRepeat, FiLink, FiCoffee, FiMoon, FiSun, FiBarChart2, FiCheckCircle } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import Modal from '../../components/Modal';

const TaskAssignmentSection = ({ projectId, members }) => {
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        subtasks: []
    });
    const [newSubtask, setNewSubtask] = useState('');
    const { tasks, addTask, loading, updateTask } = useTask();
    const { currentUser } = useAuth();
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterAssigned, setFilterAssigned] = useState('all');
    const [notifiedTasks] = useState(new Set());
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [newSubtaskForExisting, setNewSubtaskForExisting] = useState('');
    const [timeTrackingTasks, setTimeTrackingTasks] = useState(new Set());
    const [taskTimers, setTaskTimers] = useState({});
    const [liveTimers, setLiveTimers] = useState({});
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [selectedTaskForDeadline, setSelectedTaskForDeadline] = useState(null);
    const [recurringSettings, setRecurringSettings] = useState({
        isRecurring: false,
        frequency: 'daily', // daily, weekly, monthly
        endDate: null
    });
    const [pomodoroSettings, setPomodoroSettings] = useState({
        workDuration: 25, // minutes
        breakDuration: 5, // minutes
        isActive: false,
        isBreak: false,
        timeLeft: 25 * 60 // seconds
    });
    const [focusModeEnabled, setFocusModeEnabled] = useState(false);
    const [timeboxSettings, setTimeboxSettings] = useState({
        duration: 60, // minutes
        isActive: false,
        timeLeft: 60 * 60 // seconds
    });
    const [taskProgress, setTaskProgress] = useState({});
    const [showTimeDetails, setShowTimeDetails] = useState(false);
    const [selectedTaskForTimeDetails, setSelectedTaskForTimeDetails] = useState(null);
    const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25);
    const [shortBreakTime, setShortBreakTime] = useState(5);
    const [longBreakTime, setLongBreakTime] = useState(15);
    const [isPomodoro, setIsPomodoro] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);
    const [isBreak, setIsBreak] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef(null);
    const [timeRecords, setTimeRecords] = useState({});
    const [activeTimers, setActiveTimers] = useState({});
    const [, setCountdownTick] = useState(0);

    // Filter tasks based on status and assignment
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const statusMatch = filterStatus === 'all' || task.status === filterStatus;
            const assignmentMatch = filterAssigned === 'all'
                || (filterAssigned === 'assigned' && task.assignedTo)
                || (filterAssigned === 'unassigned' && !task.assignedTo)
                || (filterAssigned === 'mine' && task.assignedTo === currentUser?.email);
            return statusMatch && assignmentMatch;
        });
    }, [tasks, filterStatus, filterAssigned, currentUser]);

    // Fix notification system to only show new notifications
    useEffect(() => {
        tasks.forEach(task => {
            const notificationKey = `notified_${task.id}`;
            const wasNotified = localStorage.getItem(notificationKey);

            if (task.assignedTo === currentUser?.email && !wasNotified) {
                toast.success(`You have been assigned a new task: ${task.title}`);
                localStorage.setItem(notificationKey, new Date().toISOString());
            }
        });
    }, [tasks, currentUser]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            // Only notify if status is actually changing
            if (task.status !== newStatus) {
                const updatedTask = {
                    ...task,
                    status: newStatus,
                    lastModified: new Date().toISOString()
                };

                await updateTask(taskId, updatedTask);

                // Create a notification key specific to this status change
                const statusNotificationKey = `status_change_${taskId}_${newStatus}`;
                const wasNotified = localStorage.getItem(statusNotificationKey);

                // Only notify the owner if they haven't been notified about this specific status change
                if (task.createdBy === currentUser?.email && !wasNotified) {
                    const taskTitle = task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title;
                    const message = newStatus === 'COMPLETED'
                        ? `Task "${taskTitle}" has been completed`
                        : `Task "${taskTitle}" is now ${newStatus.toLowerCase()}`;

                    toast.success(message);
                    localStorage.setItem(statusNotificationKey, new Date().toISOString());
                }

                // If the owner is different from the assignee, notify the owner about completion
                if (task.createdBy !== currentUser?.email && newStatus === 'COMPLETED') {
                    const ownerNotificationKey = `completed_notification_${taskId}`;
                    const ownerWasNotified = localStorage.getItem(ownerNotificationKey);

                    if (!ownerWasNotified) {
                        // Store in database or send through your notification system to the owner
                        // This is just a placeholder - implement according to your notification system
                        console.log(`Notification for owner: Task "${task.title}" has been completed`);
                        localStorage.setItem(ownerNotificationKey, new Date().toISOString());
                    }
                }
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to update task status');
        }
    };

    const toggleTaskTimer = (taskId) => {
        const currentTimer = activeTimers[taskId];

        if (currentTimer?.isRunning) {
            // Stop timer
            clearInterval(currentTimer.interval);
            const endTime = new Date();
            const startTime = new Date(currentTimer.startTime);
            const duration = Math.floor((endTime - startTime) / 1000);

            // Save time record with both owner and assignee info
            const task = tasks.find(t => t.id === taskId);
            const newRecord = {
                startTime: currentTimer.startTime,
                endTime: endTime.toISOString(),
                duration,
                user: currentUser?.email,
                taskTitle: task?.title || '',
                owner: task?.createdBy,
                assignee: task?.assignedTo
            };

            const newRecords = {
                ...timeRecords,
                [taskId]: [...(timeRecords[taskId] || []), newRecord]
            };

            setTimeRecords(newRecords);
            localStorage.setItem('taskTimeRecords', JSON.stringify(newRecords));

            // Clear active timer
            setActiveTimers(current => {
                const newTimers = { ...current };
                delete newTimers[taskId];
                return newTimers;
            });
            localStorage.setItem('activeTimers', JSON.stringify({}));

            // Notify owner if different from current user
            if (task?.createdBy !== currentUser?.email) {
                const timeNotificationKey = `time_update_${taskId}_${Date.now()}`;
                if (!localStorage.getItem(timeNotificationKey)) {
                    // This would be replaced with your actual notification system
                    console.log(`Time update for owner: Task "${task?.title}" worked for ${formatTimeTracking(duration)}`);
                    localStorage.setItem(timeNotificationKey, 'true');
                }
            }
        } else {
            // Start timer
            const startTime = new Date();
            startTimerInterval(taskId, startTime);
            const task = tasks.find(t => t.id === taskId);
            localStorage.setItem('activeTimers', JSON.stringify({
                [taskId]: {
                    startTime: startTime.toISOString(),
                    isRunning: true,
                    taskTitle: task?.title || '',
                    owner: task?.createdBy,
                    assignee: task?.assignedTo
                }
            }));
        }
    };

    // Load saved time records on mount with improved sync
    useEffect(() => {
        const loadTimeRecords = () => {
            const savedRecords = localStorage.getItem('taskTimeRecords');
            if (savedRecords) {
                try {
                    const records = JSON.parse(savedRecords);
                    setTimeRecords(records);
                } catch (error) {
                    console.error('Error loading time records:', error);
                }
            }

            // Load active timers
            const active = JSON.parse(localStorage.getItem('activeTimers') || '{}');
            setActiveTimers(prev => {
                const newTimers = {};
                Object.entries(active).forEach(([taskId, timer]) => {
                    if (timer.isRunning) {
                        const startTime = new Date(timer.startTime);
                        const elapsed = Math.floor((new Date() - startTime) / 1000);
                        newTimers[taskId] = {
                            ...timer,
                            elapsed,
                            startTime: timer.startTime
                        };
                    }
                });
                return newTimers;
            });
        };

        loadTimeRecords();
        // Update more frequently to keep time in sync
        const interval = setInterval(loadTimeRecords, 1000);
        return () => clearInterval(interval);
    }, []);

    const startTimerInterval = (taskId, startTime) => {
        const interval = setInterval(() => {
            setActiveTimers(current => ({
                ...current,
                [taskId]: {
                    startTime: startTime.toISOString(),
                    elapsed: Math.floor((new Date() - startTime) / 1000),
                    isRunning: true,
                    interval
                }
            }));
        }, 1000);

        setActiveTimers(current => ({
            ...current,
            [taskId]: {
                startTime: startTime.toISOString(),
                elapsed: 0,
                isRunning: true,
                interval
            }
        }));
    };

    // Format time for display
    const formatTimeTracking = (seconds) => {
        if (!seconds && seconds !== 0) return '0h 0m 0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    };

    // Get total time for a task
    const getTaskTotalTime = (taskId) => {
        const records = timeRecords[taskId] || [];
        const completedTime = records.reduce((total, record) => {
            // Include time if user is owner, assignee, or the one who logged the time
            if (record.owner === currentUser?.email ||
                record.assignee === currentUser?.email ||
                record.user === currentUser?.email) {
                return total + record.duration;
            }
            return total;
        }, 0);

        const activeTimer = activeTimers[taskId];
        if (activeTimer?.isRunning &&
            (activeTimer.owner === currentUser?.email ||
                activeTimer.assignee === currentUser?.email ||
                activeTimer.user === currentUser?.email)) {
            const startTime = new Date(activeTimer.startTime);
            const activeTime = Math.floor((new Date() - startTime) / 1000);
            return completedTime + activeTime;
        }

        return completedTime;
    };

    // Clean up intervals on unmount
    useEffect(() => {
        return () => {
            Object.values(taskTimers).forEach(timer => {
                if (timer.interval) {
                    clearInterval(timer.interval);
                }
            });
        };
    }, [taskTimers]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) {
            toast.error('Task title is required');
            return;
        }

        try {
            const taskData = {
                ...newTask,
                id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'TODO',
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.email,
                subtasks: newTask.subtasks.map(st => ({
                    id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: st,
                    completed: false
                }))
            };

            await addTask(taskData);

            setNewTask({
                title: '',
                description: '',
                assignedTo: '',
                priority: 'medium',
                dueDate: '',
                subtasks: []
            });
            setShowNewTaskForm(false);
            toast.success('Task created successfully');
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        setNewTask(prev => ({
            ...prev,
            subtasks: [...prev.subtasks, newSubtask.trim()]
        }));
        setNewSubtask('');
    };

    const handleRemoveSubtask = async (taskId, subtaskIdOrIndex) => {
        // Case 1: Removing from new task form
        if (typeof subtaskIdOrIndex === 'number') {
            setNewTask(prev => ({
                ...prev,
                subtasks: prev.subtasks.filter((_, i) => i !== subtaskIdOrIndex)
            }));
            return;
        }

        // Case 2: Removing from existing task
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const updatedTask = {
                ...task,
                subtasks: task.subtasks.filter(st => st.id !== subtaskIdOrIndex)
            };

            await updateTask(taskId, updatedTask);
            toast.success('Subtask removed');
        } catch (error) {
            console.error('Error removing subtask:', error);
            toast.error('Failed to remove subtask');
        }
    };

    const handleSubtaskToggle = async (taskId, subtaskId, completed) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const updatedTask = {
                ...task,
                subtasks: task.subtasks.map(subtask =>
                    subtask.id === subtaskId
                        ? { ...subtask, completed: !completed }
                        : subtask
                )
            };

            await updateTask(taskId, updatedTask);
            toast.success('Subtask updated');
        } catch (error) {
            console.error('Error updating subtask:', error);
            toast.error('Failed to update subtask');
        }
    };

    // Timer functions
    const startPomodoro = () => {
        if (!isRunning) {
            setIsRunning(true);
            const startTime = new Date();
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handlePomodoroComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Save pomodoro start time
            localStorage.setItem('pomodoroState', JSON.stringify({
                isRunning: true,
                startTime: startTime.toISOString(),
                timeLeft: timeLeft,
                isBreak: isBreak,
                pomodoroCount: pomodoroCount
            }));
        }
    };

    const pausePomodoro = () => {
        if (isRunning) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            localStorage.setItem('pomodoroState', JSON.stringify({
                isRunning: false,
                timeLeft: timeLeft,
                isBreak: isBreak,
                pomodoroCount: pomodoroCount
            }));
        }
    };

    const resetPomodoro = () => {
        clearInterval(timerRef.current);
        setIsRunning(false);
        setTimeLeft(pomodoroTime * 60);
        setIsBreak(false);
        setPomodoroCount(0);
        localStorage.removeItem('pomodoroState');
    };

    // Load pomodoro state on mount
    useEffect(() => {
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            const state = JSON.parse(savedState);
            setTimeLeft(state.timeLeft);
            setIsBreak(state.isBreak);
            setPomodoroCount(state.pomodoroCount);
            if (state.isRunning) {
                startPomodoro();
            }
        }
    }, []);

    const handlePomodoroComplete = () => {
        clearInterval(timerRef.current);
        setIsRunning(false);

        if (!isBreak) {
            setPomodoroCount(prev => prev + 1);
            if (pomodoroCount % 4 === 3) {
                // Long break after 4 pomodoros
                setTimeLeft(longBreakTime * 60);
            } else {
                setTimeLeft(shortBreakTime * 60);
            }
            setIsBreak(true);
            toast.success('Time for a break!');
        } else {
            setTimeLeft(pomodoroTime * 60);
            setIsBreak(false);
            toast.success('Break complete! Ready for next session?');
        }
    };

    const toggleFocusMode = () => {
        setIsFocusMode(prev => !prev);
        if (!isFocusMode) {
            toast.success('Focus mode enabled - Minimize distractions');
        } else {
            toast.success('Focus mode disabled');
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDeadlineCountdown = (deadline) => {
        const now = new Date();
        const diff = deadline - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) {
            const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
            return `${overdueDays}d overdue`;
        }

        if (days > 0) {
            return `${days}d ${hours}h left`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        } else if (minutes > 0) {
            return `${minutes}m left`;
        } else {
            return 'Due now';
        }
    };

    // Add effect for countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdownTick(tick => tick + 1);
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const renderPomodoroSettings = () => (
        <Modal
            isOpen={showPomodoroSettings}
            onClose={() => setShowPomodoroSettings(false)}
            title="Pomodoro Timer"
        >
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 relative">
                    <div className="p-6 space-y-6">
                        {/* Timer Display */}
                        <div className="text-center">
                            <div className="text-4xl font-mono font-bold mb-2">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {isBreak ? 'Break Time' : 'Focus Time'} • {pomodoroCount} completed
                            </div>
                        </div>

                        {/* Timer Controls */}
                        <div className="flex justify-center gap-4">
                            {!isRunning ? (
                                <button
                                    onClick={startPomodoro}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                >
                                    <FiPlay className="w-5 h-5" />
                                    Start
                                </button>
                            ) : (
                                <button
                                    onClick={pausePomodoro}
                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 flex items-center gap-2"
                                >
                                    <FiPause className="w-5 h-5" />
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={resetPomodoro}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/90 flex items-center gap-2"
                            >
                                <FiClock className="w-5 h-5" />
                                Reset
                            </button>
                        </div>

                        {/* Timer Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Focus Time (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={pomodoroTime}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setPomodoroTime(value);
                                        if (!isRunning && !isBreak) {
                                            setTimeLeft(value * 60);
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    min="1"
                                    max="60"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Short Break (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={shortBreakTime}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setShortBreakTime(value);
                                        if (!isRunning && isBreak) {
                                            setTimeLeft(value * 60);
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    min="1"
                                    max="30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Long Break (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={longBreakTime}
                                    onChange={(e) => setLongBreakTime(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    min="1"
                                    max="60"
                                />
                            </div>
                        </div>

                        {/* Focus Mode Toggle */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Focus Mode</span>
                            <button
                                onClick={toggleFocusMode}
                                className={`px-4 py-2 rounded-lg transition-colors ${isFocusMode
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {isFocusMode ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Update the timer display section
    const renderTaskTimer = (task) => {
        const totalTime = getTaskTotalTime(task.id);
        const isOwnerOrEditor = task.createdBy === currentUser?.email || task.assignedTo === currentUser?.email;

        return (
            <div className="mt-4 flex flex-col gap-2 p-3 bg-background/50 rounded-lg border border-border">
                {/* Timer Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {task.assignedTo === currentUser?.email && (
                            <button
                                onClick={() => toggleTaskTimer(task.id)}
                                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 ${activeTimers[task.id]?.isRunning
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-primary text-primary-foreground'
                                    }`}
                            >
                                {activeTimers[task.id]?.isRunning ? (
                                    <>
                                        <FiPause className="w-4 h-4" />
                                        Stop Timer
                                    </>
                                ) : (
                                    <>
                                        <FiPlay className="w-4 h-4" />
                                        Start Timer
                                    </>
                                )}
                            </button>
                        )}
                        {activeTimers[task.id]?.isRunning && (
                            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded animate-pulse">
                                Currently Working
                            </span>
                        )}
                    </div>
                    {isOwnerOrEditor && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">
                                Total Time: {formatTimeTracking(totalTime)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Current Session */}
                {(activeTimers[task.id]?.isRunning || activeTimers[task.id]?.elapsed > 0) && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Session:</span>
                        <span className="font-mono">
                            {formatTimeTracking(activeTimers[task.id]?.elapsed || 0)}
                        </span>
                    </div>
                )}

                {/* Time Records */}
                {isOwnerOrEditor && timeRecords[task.id] && timeRecords[task.id].length > 0 && (
                    <div className="mt-2 border-t border-border/50 pt-2">
                        <div className="text-sm text-muted-foreground mb-1">Recent Sessions:</div>
                        <div className="space-y-1">
                            {timeRecords[task.id].slice(-3).map((record, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        {new Date(record.startTime).toLocaleString()}
                                    </span>
                                    <span className="font-mono">
                                        {formatTimeTracking(record.duration)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Add back the renderSubtasks function
    const renderSubtasks = (task) => (
        <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Subtasks</h4>
                {task.assignedTo === currentUser?.email && (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={task.id === editingTaskId ? newSubtaskForExisting : ''}
                            onChange={(e) => {
                                setEditingTaskId(task.id);
                                setNewSubtaskForExisting(e.target.value);
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddSubtaskToExisting(task.id);
                                }
                            }}
                            placeholder="Add a subtask"
                            className="px-2 py-1 text-sm bg-background border border-border rounded"
                        />
                        <button
                            onClick={() => handleAddSubtaskToExisting(task.id)}
                            className="p-1 hover:bg-primary/10 rounded"
                            title="Add Subtask"
                        >
                            <FiPlus className="w-4 h-4 text-primary" />
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                {task.subtasks?.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 group">
                        <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => handleSubtaskToggle(task.id, subtask.id, subtask.completed)}
                            className="rounded border-border"
                            disabled={task.assignedTo !== currentUser?.email}
                        />
                        <span className={`text-sm flex-1 ${subtask.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                            }`}>
                            {subtask.title}
                        </span>
                        {task.assignedTo === currentUser?.email && (
                            <button
                                onClick={() => handleRemoveSubtask(task.id, subtask.id)}
                                className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Subtask"
                            >
                                <FiX className="w-4 h-4 text-destructive" />
                            </button>
                        )}
                    </div>
                ))}
                {(!task.subtasks || task.subtasks.length === 0) && (
                    <p className="text-sm text-muted-foreground">No subtasks yet</p>
                )}
            </div>
        </div>
    );

    // Also add back the handleAddSubtaskToExisting function
    const handleAddSubtaskToExisting = async (taskId) => {
        if (!newSubtaskForExisting.trim()) return;

        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const newSubtask = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: newSubtaskForExisting.trim(),
                completed: false
            };

            const updatedTask = {
                ...task,
                subtasks: [...(task.subtasks || []), newSubtask]
            };

            await updateTask(taskId, updatedTask);
            setNewSubtaskForExisting('');
            setEditingTaskId(null);
            toast.success('Subtask added');
        } catch (error) {
            console.error('Error adding subtask:', error);
            toast.error('Failed to add subtask');
        }
    };

    // Update the status control section in the task card
    const renderStatusControl = (task) => (
        <div className="mt-4 flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                className={`px-3 py-1.5 text-sm rounded-md border ${task.status === 'COMPLETED'
                    ? 'bg-success/10 border-success/20 text-success'
                    : task.status === 'IN_PROGRESS'
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
            >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
            </select>
        </div>
    );

    // Update the task card to include better status indicators
    return (
        <div className="bg-background p-6 rounded-lg border border-border">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
                <div className="flex items-center gap-4">
                    {/* Pomodoro Display */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                        <FiClock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-lg">
                            {formatTime(timeLeft)}
                        </span>
                        <div className="flex items-center gap-1">
                            {!isRunning ? (
                                <button
                                    onClick={startPomodoro}
                                    className="p-1 hover:bg-primary/10 rounded"
                                    title="Start Pomodoro"
                                >
                                    <FiPlay className="w-4 h-4 text-primary" />
                                </button>
                            ) : (
                                <button
                                    onClick={pausePomodoro}
                                    className="p-1 hover:bg-destructive/10 rounded"
                                    title="Pause Pomodoro"
                                >
                                    <FiPause className="w-4 h-4 text-destructive" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowPomodoroSettings(true)}
                                className="p-1 hover:bg-muted rounded"
                                title="Pomodoro Settings"
                            >
                                <FiClock className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNewTaskForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                    <option value="all">All Status</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                </select>

                <select
                    value={filterAssigned}
                    onChange={(e) => setFilterAssigned(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                    <option value="all">All Tasks</option>
                    <option value="assigned">Assigned</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="mine">My Tasks</option>
                </select>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.map(task => {
                    const deadline = task.dueDate ? new Date(task.dueDate) : null;
                    const now = new Date();
                    const isOverdue = deadline && deadline < now && task.status !== 'COMPLETED';
                    const isCloseToDeadline = deadline &&
                        deadline > now &&
                        (deadline - now) / (1000 * 60 * 60 * 24) <= 2 &&
                        task.status !== 'COMPLETED';
                    const totalTime = getTaskTotalTime(task.id);
                    const isInProgress = activeTimers[task.id]?.isRunning || task.status === 'IN_PROGRESS';

                    return (
                        <div
                            key={task.id}
                            className={`p-4 rounded-lg border ${isOverdue
                                ? 'border-destructive/50 bg-destructive/5'
                                : isCloseToDeadline
                                    ? 'border-warning/50 bg-warning/5'
                                    : isInProgress
                                        ? 'border-primary/50 bg-primary/5'
                                        : task.status === 'COMPLETED'
                                            ? 'border-success/50 bg-success/5'
                                            : 'border-border bg-card'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-medium text-foreground">{task.title}</h3>
                                        {task.assignedTo === currentUser?.email && (
                                            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                                                Assigned to you
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className="px-2 py-1 text-xs bg-destructive/20 text-destructive rounded">
                                                Overdue
                                            </span>
                                        )}
                                        {isCloseToDeadline && (
                                            <span className="px-2 py-1 text-xs bg-warning/20 text-warning rounded">
                                                Due Soon
                                            </span>
                                        )}
                                        {isInProgress && !isOverdue && !isCloseToDeadline && (
                                            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                                                In Progress
                                            </span>
                                        )}
                                    </div>

                                    {/* Task Details */}
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <FiUser className="w-4 h-4" />
                                            {task.assignedTo || 'Unassigned'}
                                        </span>
                                        {deadline && (
                                            <span className={`flex items-center gap-1 ${isOverdue
                                                ? 'text-destructive'
                                                : isCloseToDeadline
                                                    ? 'text-warning'
                                                    : 'text-muted-foreground'
                                                }`}>
                                                <FiCalendar className="w-4 h-4" />
                                                {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <span className="ml-1 font-medium">
                                                    ({formatDeadlineCountdown(deadline)})
                                                </span>
                                            </span>
                                        )}
                                        <span className={`flex items-center gap-1 ${task.status === 'COMPLETED'
                                            ? 'text-success'
                                            : isInProgress
                                                ? 'text-primary'
                                                : 'text-muted-foreground'
                                            }`}>
                                            <FiCheckCircle className="w-4 h-4" />
                                            {task.status}
                                        </span>
                                        {(task.createdBy === currentUser?.email || task.assignedTo === currentUser?.email) && (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <FiClock className="w-4 h-4" />
                                                Total: {formatTimeTracking(totalTime)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Timer Display */}
                                    {renderTaskTimer(task)}

                                    {/* Status Control - Replace the existing status control with the new one */}
                                    {task.assignedTo === currentUser?.email && renderStatusControl(task)}

                                    {/* Subtasks */}
                                    {renderSubtasks(task)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Task Modal */}
            <Modal
                isOpen={showNewTaskForm}
                onClose={() => setShowNewTaskForm(false)}
                title="Create New Task"
            >
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center p-4 border-b border-border">
                            <h3 className="text-lg font-semibold">Create New Task</h3>
                            <button
                                onClick={() => setShowNewTaskForm(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Assign To</label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                >
                                    <option value="">Select User</option>
                                    {members.map(member => (
                                        <option key={member.email} value={member.email}>
                                            {member.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Subtasks</label>
                                <div className="space-y-2">
                                    {newTask.subtasks.map((subtask, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="flex-1 text-sm">{subtask}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubtask(null, index)}
                                                className="text-destructive hover:text-destructive/90"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            placeholder="Add a subtask"
                                            className="flex-1 px-3 py-2 bg-background border border-border rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubtask}
                                            className="px-3 py-2 bg-primary text-primary-foreground rounded-md"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTaskForm(false)}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            {/* Pomodoro Timer */}
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setShowPomodoroSettings(true)}
                    className="p-2 bg-background border border-border rounded-lg shadow-lg hover:bg-card"
                    title="Open Pomodoro Timer"
                >
                    <FiClock className="w-5 h-5" />
                </button>
            </div>

            {/* Pomodoro Settings Modal */}
            {renderPomodoroSettings()}
        </div>
    );
};

export default TaskAssignmentSection; 