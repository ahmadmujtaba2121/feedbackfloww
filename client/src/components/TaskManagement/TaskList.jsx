import React, { useState } from 'react';
import { FiPlus, FiFilter, FiClock, FiUser, FiCalendar, FiFlag } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import TaskCreationForm from './TaskCreationForm';
import TaskAssignmentSection from './TaskAssignmentSection';
import Modal from '../Modal';

const TaskList = ({ projectId, members }) => {
    const { currentUser } = useAuth();
    const {
        tasks,
        loading,
        filterStatus,
        setFilterStatus,
        filterAssigned,
        setFilterAssigned,
        filterPriority,
        setFilterPriority,
        getFilteredTasks
    } = useTask();

    const [showNewTaskForm, setShowNewTaskForm] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const filteredTasks = getFilteredTasks();

    return (
        <div className="bg-background p-6 rounded-lg border border-border">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
                <button
                    onClick={() => setShowNewTaskForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <FiPlus className="w-4 h-4" />
                    New Task
                </button>
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
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <select
                    value={filterAssigned}
                    onChange={(e) => setFilterAssigned(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                    <option value="all">All Tasks</option>
                    <option value="assigned">Assigned</option>
                    <option value="unassigned">Unassigned</option>
                </select>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.map(task => (
                    <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${task.status === 'COMPLETED'
                            ? 'border-success/50 bg-success/5'
                            : task.status === 'IN_PROGRESS'
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-card'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium text-foreground">{task.title}</h3>
                                    <span className={`px-2 py-1 text-xs rounded ${task.status === 'COMPLETED'
                                        ? 'bg-success/20 text-success'
                                        : task.status === 'IN_PROGRESS'
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {task.status}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${task.priority === 'high'
                                        ? 'bg-destructive/20 text-destructive'
                                        : task.priority === 'medium'
                                            ? 'bg-warning/20 text-warning'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {task.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3 text-sm">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <FiUser className="w-4 h-4" />
                                        {task.assignedTo || 'Unassigned'}
                                    </span>
                                    {task.dueDate && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <FiCalendar className="w-4 h-4" />
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {/* Task Assignment Section */}
                                <TaskAssignmentSection projectId={projectId} task={task} />
                            </div>
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No tasks found
                    </div>
                )}
            </div>

            {/* Task Creation Modal */}
            <Modal
                isOpen={showNewTaskForm}
                onClose={() => setShowNewTaskForm(false)}
            >
                <TaskCreationForm
                    projectId={projectId}
                    members={members}
                    onClose={() => setShowNewTaskForm(false)}
                />
            </Modal>
        </div>
    );
};

export default TaskList; 