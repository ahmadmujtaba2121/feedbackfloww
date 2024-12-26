import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle, FiCheckSquare, FiSquare, FiPlus, FiTrash2, FiUser, FiFileText, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useTask } from '../contexts/TaskContext';

const TaskCard = ({ task, isDragging }) => {
  const { projectId } = useParams();
  const { updateTask: contextUpdateTask } = useTask();
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');

  useEffect(() => {
    if (task && JSON.stringify(task) !== JSON.stringify(currentTask)) {
      setCurrentTask(task);
    }
  }, [task]);

  const updateTask = async (taskId, updates) => {
    if (!projectId || !taskId) {
      console.error('Missing projectId or taskId:', { projectId, taskId });
      toast.error('Cannot update task: Missing required information');
      return;
    }

    try {
      console.log('Updating task with:', { projectId, taskId, updates });

      // Get project reference and data
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      console.log('Found project data:', projectData);

      // Ensure tasks array exists and find task
      const tasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);

      console.log('Found task at index:', taskIndex);

      if (taskIndex === -1) {
        throw new Error('Task not found in project');
      }

      // Create updated task with new data
      const updatedTask = {
        ...tasks[taskIndex],
        ...updates,
        lastModified: new Date().toISOString()
      };

      // Ensure subtasks array exists
      if (!updatedTask.subtasks) {
        updatedTask.subtasks = [];
      }

      // Update tasks array
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = updatedTask;

      console.log('Updating with task:', updatedTask);

      // Update in Firestore
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      // Update local state
      setCurrentTask(updatedTask);

      // Update task in context
      if (contextUpdateTask) {
        await contextUpdateTask(taskId, updatedTask);
      }

      console.log('Successfully updated task');
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
      throw error;
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !currentTask?.id) {
      console.log('Invalid input for subtask:', { newSubtask, taskId: currentTask?.id });
      return;
    }

    try {
      console.log('Adding subtask to task:', currentTask.id);

      // Create new subtask
      const subtask = {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newSubtask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };

      // Get current subtasks or initialize empty array
      const currentSubtasks = Array.isArray(currentTask.subtasks) ? currentTask.subtasks : [];
      console.log('Current subtasks:', currentSubtasks);

      // Create updated subtasks array
      const updatedSubtasks = [...currentSubtasks, subtask];
      console.log('New subtasks array:', updatedSubtasks);

      // Update task with new subtasks
      const updatedTask = await updateTask(currentTask.id, {
        subtasks: updatedSubtasks
      });

      if (updatedTask) {
        setNewSubtask('');
        setIsAddingSubtask(false);
        setShowSubtasks(true); // Show subtasks after adding
        toast.success('Subtask added successfully');
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    if (!currentTask?.id || !currentTask.subtasks) return;

    try {
      const updatedSubtasks = currentTask.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      await updateTask(currentTask.id, {
        subtasks: updatedSubtasks
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast.error('Failed to toggle subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!currentTask?.id || !currentTask.subtasks) return;

    try {
      const updatedSubtasks = currentTask.subtasks.filter(st => st.id !== subtaskId);

      await updateTask(currentTask.id, {
        subtasks: updatedSubtasks
      });

      toast.success('Subtask deleted successfully');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  const handleNotesChange = async (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    try {
      await updateTask(currentTask.id, {
        notes: newNotes
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes');
    }
  };

  return (
    <div className={`p-4 rounded-lg border bg-slate-800/50 hover:bg-slate-800 transition-colors ${isDragging ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-slate-700'}`}>
      {/* Task Title and Description */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{currentTask.title}</h4>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-slate-400 hover:text-violet-400 transition-colors"
          >
            <FiFileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentTask.description && (
        <p className="text-sm text-slate-400 mb-3">{currentTask.description}</p>
      )}

      {showNotes && (
        <div className="mb-3">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add notes..."
            className="w-full h-24 px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}

      {/* Subtasks Section */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="text-sm text-slate-300 hover:text-white flex items-center"
          >
            Subtasks {currentTask.subtasks?.length > 0 && `(${currentTask.subtasks.filter(st => st.completed).length}/${currentTask.subtasks.length})`}
          </button>
          <button
            onClick={() => {
              setIsAddingSubtask(true);
              setShowSubtasks(true);
            }}
            className="text-sm text-violet-400 hover:text-violet-300 flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {showSubtasks && (
          <div className="space-y-2 ml-1 bg-slate-700/50 p-2 rounded-lg">
            {currentTask.subtasks?.map(subtask => (
              <motion.div
                key={subtask.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between group bg-slate-800/50 p-2 rounded"
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={`p-1 rounded hover:bg-slate-700 ${subtask.completed ? 'text-violet-400' : 'text-slate-400'}`}
                  >
                    {subtask.completed ? (
                      <FiCheckSquare className="w-4 h-4" />
                    ) : (
                      <FiSquare className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`ml-2 text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                    {subtask.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {isAddingSubtask && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 bg-slate-800/50 p-2 rounded"
              >
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="New subtask..."
                  className="flex-1 px-2 py-1 text-sm bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-2 py-1 text-sm bg-violet-500 text-white rounded hover:bg-violet-600"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setNewSubtask('');
                    setIsAddingSubtask(false);
                  }}
                  className="px-2 py-1 text-sm text-slate-400 hover:text-slate-300"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </div>
        )}

        {currentTask.subtasks?.length > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${(currentTask.subtasks.filter(st => st.completed).length / currentTask.subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task Metadata */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center space-x-2">
          {currentTask.priority && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${currentTask.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              currentTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
              {currentTask.priority}
            </span>
          )}
          {currentTask.assignedTo && (
            <span className="flex items-center">
              <FiUser className="w-3 h-3 mr-1" />
              {currentTask.assignedTo}
            </span>
          )}
        </div>
        {currentTask.deadline && (
          <span className="flex items-center">
            <FiClock className="w-3 h-3 mr-1" />
            {new Date(currentTask.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(TaskCard); 