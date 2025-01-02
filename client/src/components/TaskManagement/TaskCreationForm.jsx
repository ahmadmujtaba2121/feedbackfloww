import React, { useState } from 'react';
import { FiPlus, FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { toast } from 'react-hot-toast';

const TaskCreationForm = ({ projectId, members, onClose }) => {
    const { currentUser } = useAuth();
    const { addTask } = useTask();
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        subtasks: [],
        status: 'TODO',
        createdBy: currentUser?.email
    });
    const [newSubtask, setNewSubtask] = useState('');

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        setNewTask(prev => ({
            ...prev,
            subtasks: [...prev.subtasks, newSubtask.trim()]
        }));
        setNewSubtask('');
    };

    const handleRemoveSubtask = (index) => {
        setNewTask(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter((_, i) => i !== index)
        }));
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) {
            toast.error('Task title is required');
            return;
        }

        try {
            const taskData = {
                ...newTask,
                subtasks: newTask.subtasks.map(title => ({
                    title,
                    completed: false,
                    createdAt: new Date().toISOString()
                }))
            };

            await addTask(taskData);
            toast.success('Task created successfully');
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        }
    };

    return (
        <div className="bg-background p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Create New Task</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Title */}
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

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md"
                        rows={3}
                    />
                </div>

                {/* Assign To */}
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

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md"
                        />
                        <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>

                {/* Priority */}
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

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        value={newTask.status}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>

                {/* Subtasks */}
                <div>
                    <label className="block text-sm font-medium mb-1">Subtasks</label>
                    <div className="space-y-2">
                        {newTask.subtasks.map((subtask, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="flex-1 text-sm">{subtask}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSubtask(index)}
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
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
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

                {/* Submit Button */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
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
    );
};

export default TaskCreationForm; 