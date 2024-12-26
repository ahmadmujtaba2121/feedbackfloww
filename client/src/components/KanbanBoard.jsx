import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiPlus, FiX, FiClock, FiCheckCircle, FiAlertCircle, FiPlayCircle, FiEye, FiFileText, FiStar, FiBookmark, FiCheckSquare, FiSquare, FiTrash2 } from 'react-icons/fi';
import TaskCard from './TaskCard';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STATUSES, getStatusConfig } from '../utils/taskStatus';
import { serverTimestamp } from 'firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useParams } from 'react-router-dom';

const LoadingSkeleton = () => (
  <div className="flex space-x-4 min-w-max p-4">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="w-80">
        <div className="p-3 rounded-t-lg bg-slate-800/50 border-slate-600 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-slate-600 rounded" />
              <div className="h-4 w-20 bg-slate-600 rounded" />
            </div>
            <div className="h-4 w-6 bg-slate-600 rounded" />
          </div>
        </div>
        <div className="min-h-[200px] p-2 rounded-b-lg border border-slate-600 bg-slate-800/50">
          {[...Array(3)].map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="mb-2 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
            >
              <div className="h-4 w-3/4 bg-slate-600 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const BoardColumn = React.memo(({ status, config, tasks, project, currentUser }) => {
  const { currentTheme } = useTheme();

  return (
    <div key={status} className="w-80">
      <div className={`p-3 rounded-t-lg bg-foreground border-border border-b-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <config.icon className={`w-4 h-4 text-primary`} />
            <h3 className={`font-medium text-secondary-foreground`}>{config.label}</h3>
          </div>
          <span className={`text-sm text-muted-foreground`}>
            {tasks?.length || 0}
          </span>
        </div>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] p-2 rounded-b-lg border border-border bg-foreground transition-colors ${snapshot.isDraggingOver ? 'bg-opacity-70' : ''
              }`}
          >
            {tasks?.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={project?.owner !== currentUser?.email}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-2 transition-transform ${snapshot.isDragging ? 'scale-105' : ''}`}
                  >
                    <TaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggingTask?.id === task.id}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

const MemoizedTaskCard = React.memo(TaskCard);

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Never';
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleString();
  }
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) ? date.toLocaleString() : 'Never';
  }
  return 'Never';
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { tasks, loading, updateTaskStatus, addTask, project, error, lastUpdate } = useTask();
  const { currentUser } = useAuth();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'TODO',
    deadline: '',
    notifyBefore: 24
  });

  // Filter and search tasks with member suggestions
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Add drag start state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [isDraggingStatus, setIsDraggingStatus] = useState(false);

  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showTodoPanel, setShowTodoPanel] = useState(false);
  const [pinnedTasks, setPinnedTasks] = useState([]);
  const quickNotesRef = useRef(null);

  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');

  // Add useEffect to log project data for debugging
  useEffect(() => {
    if (project) {
      console.log('Project data in KanbanBoard:', project);
    }
  }, [project]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const searchTerm = textBeforeCursor.slice(lastAtIndex + 1).toLowerCase();
      const nextSpaceIndex = value.indexOf(' ', lastAtIndex);
      const isTypingMention = nextSpaceIndex === -1 || cursorPosition <= nextSpaceIndex;

      if (isTypingMention) {
        // Filter project members
        const filteredMembers = (project?.members || []).filter(member =>
          member.toLowerCase().includes(searchTerm)
        );
        setMemberSuggestions(filteredMembers);
        setShowSuggestions(filteredMembers.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleMemberSelect = (member) => {
    const cursorPosition = searchInputRef.current.selectionStart;
    const textBeforeCursor = searchQuery.slice(0, cursorPosition);
    const textAfterCursor = searchQuery.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const newText = textBeforeCursor.slice(0, lastAtIndex) +
      '@' + member + ' ' +
      textAfterCursor;

    setSearchQuery(newText);
    setShowSuggestions(false);
    searchInputRef.current.focus();

    // Set cursor position after the inserted mention
    const newCursorPosition = lastAtIndex + member.length + 2; // +2 for @ and space
    setTimeout(() => {
      searchInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    setDraggingTask(task);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggingTask(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId || !newStatus) return;

    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success(`Task moved to ${TASK_STATUSES[newStatus].label}`, {
        id: `move-${taskId}-${newStatus}`,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task', {
        id: `error-move-${taskId}`,
      });
    }
  }, [updateTaskStatus]);

  // Add event listener for task updates from other components
  useEffect(() => {
    const handleTaskUpdate = (event) => {
      const { taskId, newStatus, updatedTask } = event.detail;
      // Update local state if needed
      if (tasks.some(t => t.id === taskId)) {
        // Force a re-render of the affected task
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = updatedTask;
        }
      }
    };

    window.addEventListener('taskStatusUpdate', handleTaskUpdate);
    return () => {
      window.removeEventListener('taskStatusUpdate', handleTaskUpdate);
    };
  }, [tasks]);

  // Filtered tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task) return false;

      const matchesSearch = !searchQuery ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  const getTasksByStatus = useCallback((status) => {
    return filteredTasks.filter(task => {
      if (!task || !task.status) return false;
      const taskStatus = task.status.toUpperCase();
      return taskStatus === status.toUpperCase();
    });
  }, [filteredTasks]);

  const taskGroups = useMemo(() => {
    return Object.keys(TASK_STATUSES).reduce((acc, status) => {
      acc[status] = getTasksByStatus(status);
      return acc;
    }, {});
  }, [getTasksByStatus]);

  const handleCreateTask = useCallback(async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required', { id: 'error-title-required' });
      return;
    }

    try {
      await addTask({
        ...newTask,
        createdBy: currentUser?.email
      });
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'TODO'
      });
      setIsAddingTask(false);
      toast.success('Task created successfully', { id: 'task-created' });
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task', { id: 'error-create-task' });
    }
  }, [newTask, addTask, currentUser?.email]);

  // Add deadline notification check
  const checkDeadlines = useCallback(() => {
    const notifiedTasks = new Set();
    tasks.forEach(task => {
      if (task.deadline && !notifiedTasks.has(task.id)) {
        const deadline = new Date(task.deadline);
        const now = new Date();
        const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

        if (hoursUntilDeadline <= task.notifyBefore && hoursUntilDeadline > 0) {
          toast.warning(`Task "${task.title}" is due in ${Math.round(hoursUntilDeadline)} hours!`, {
            id: `deadline-${task.id}`,
          });
          notifiedTasks.add(task.id);
        } else if (hoursUntilDeadline <= 0) {
          toast.error(`Task "${task.title}" is overdue!`, {
            id: `overdue-${task.id}`,
          });
          notifiedTasks.add(task.id);
        }
      }
    });
  }, [tasks]);

  // Add deadline check on component mount and every hour
  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // Function to export note to local text file
  const exportToNotepad = async (content, title = 'Quick Note') => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Note exported successfully!');
    } catch (error) {
      console.error('Error exporting note:', error);
      toast.error('Failed to export note');
    }
  };

  // Function to pin/unpin task
  const togglePinTask = (task) => {
    if (pinnedTasks.some(t => t.id === task.id)) {
      setPinnedTasks(pinnedTasks.filter(t => t.id !== task.id));
      toast.success('Task unpinned', { id: `unpin-${task.id}` });
    } else {
      setPinnedTasks([...pinnedTasks, task]);
      toast.success('Task pinned to Quick Access', { id: `pin-${task.id}` });
    }
  };

  // Quick Notes Panel Component
  const QuickNotesPanel = React.memo(() => {
    const handleNoteChange = (e) => {
      const { value, selectionStart, selectionEnd } = e.target;
      setQuickNote(value);
      // Preserve cursor position after state update
      requestAnimationFrame(() => {
        e.target.selectionStart = selectionStart;
        e.target.selectionEnd = selectionEnd;
      });
    };

    // Focus the textarea when panel opens
    useEffect(() => {
      if (quickNotesRef.current) {
        quickNotesRef.current.focus();
        // Set cursor to end of text
        const length = quickNotesRef.current.value.length;
        quickNotesRef.current.selectionStart = length;
        quickNotesRef.current.selectionEnd = length;
      }
    }, []);

    return (
      <div className="fixed right-4 top-20 w-96 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Quick Notes</h3>
          <button onClick={() => setShowQuickNotes(false)} className="text-slate-400 hover:text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            ref={quickNotesRef}
            value={quickNote}
            onChange={handleNoteChange}
            placeholder="Take quick notes..."
            className="w-full h-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
            autoFocus
            spellCheck="false"
            dir="ltr"
          />
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => exportToNotepad(quickNote)}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 flex items-center"
            >
              <FiFileText className="mr-2" />
              Export to Notepad
            </button>
          </div>
        </div>
      </div>
    );
  });

  // Enhanced TODO Panel Component
  const TodoPanel = () => (
    <div className="fixed left-4 top-20 w-96 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Quick Access TODOs</h3>
        <button onClick={() => setShowTodoPanel(false)} className="text-slate-400 hover:text-white">
          <FiX className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center">
              <FiStar className="mr-2 text-yellow-500" />
              Pinned Tasks
            </h4>
            {pinnedTasks.length === 0 ? (
              <p className="text-sm text-slate-400">No pinned tasks yet</p>
            ) : (
              <div className="space-y-2">
                {pinnedTasks.map(task => (
                  <div key={task.id} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{task.title}</span>
                      <button
                        onClick={() => togglePinTask(task)}
                        className="text-yellow-500 hover:text-yellow-400"
                      >
                        <FiStar className="w-4 h-4" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-400 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{TASK_STATUSES[task.status]?.label}</span>
                      {task.deadline && (
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center">
              <FiClock className="mr-2 text-blue-500" />
              Due Soon
            </h4>
            {getTasksByStatus('TODO')
              .filter(task => task.deadline && new Date(task.deadline) > new Date())
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="bg-slate-800 rounded-lg p-2 mb-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">{task.title}</span>
                    <p className="text-xs text-slate-400">
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePinTask(task)}
                    className={`${pinnedTasks.some(t => t.id === task.id)
                      ? 'text-yellow-500 hover:text-yellow-400'
                      : 'text-slate-400 hover:text-yellow-500'
                      }`}
                  >
                    <FiStar className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add Quick Access Buttons to the header
  const renderQuickAccessButtons = () => (
    <div className="flex items-center space-x-2 ml-4">
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
  );

  // Add Pin Button to TaskCard
  const renderTaskWithPin = (task) => (
    <div className="relative">
      <div className="absolute top-[18px] right-12 z-10">
        <button
          onClick={() => togglePinTask(task)}
          className={`${pinnedTasks.some(t => t.id === task.id)
            ? 'text-yellow-500 hover:text-yellow-400'
            : 'text-slate-400 hover:text-yellow-500'
            }`}
        >
          <FiStar className="w-4 h-4" />
        </button>
      </div>
      <TaskCard
        task={task}
        isDragging={draggingTask?.id === task.id}
        projectId={projectId}
      />
    </div>
  );

  // Add Subtask Modal Component
  const SubtaskModal = () => {
    if (!selectedTask) return null;

    const handleSubtaskInputChange = (e) => {
      setNewSubtask(e.target.value);
    };

    const handleAddSubtask = async () => {
      if (!newSubtask.trim()) return;

      try {
        if (!projectId) {
          console.error('Missing projectId');
          toast.error('Project ID not found');
          return;
        }

        console.log('Adding subtask to project:', projectId);
        console.log('Selected task:', selectedTask);

        // Get project reference
        const projectRef = doc(db, 'projects', projectId);

        // Get the latest project data
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          console.error('Project document not found:', projectId);
          toast.error('Project not found');
          return;
        }

        const projectData = projectSnap.data();
        console.log('Project data:', projectData);

        // Ensure tasks array exists
        const tasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];
        console.log('Current tasks:', tasks);

        // Find the task to update
        const taskIndex = tasks.findIndex(t => t.id === selectedTask.id);
        console.log('Task index:', taskIndex, 'Selected task ID:', selectedTask.id);

        if (taskIndex === -1) {
          console.error('Task not found in project tasks');
          toast.error('Task not found');
          return;
        }

        // Create a deep copy of the tasks array
        const updatedTasks = JSON.parse(JSON.stringify(tasks));
        const taskToUpdate = updatedTasks[taskIndex];

        // Initialize subtasks array if it doesn't exist
        if (!Array.isArray(taskToUpdate.subtasks)) {
          taskToUpdate.subtasks = [];
        }

        // Create new subtask object
        const newSubtaskObj = {
          id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: newSubtask.trim(),
          completed: false,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.email || 'unknown'
        };

        // Add the new subtask
        taskToUpdate.subtasks.push(newSubtaskObj);
        taskToUpdate.lastModified = serverTimestamp();

        console.log('Updated task with new subtask:', taskToUpdate);

        try {
          // Update the project document
          await updateDoc(projectRef, {
            tasks: updatedTasks,
            lastModified: serverTimestamp()
          });

          // Update local state
          setSelectedTask({
            ...taskToUpdate,
            projectId
          });
          setNewSubtask('');
          toast.success('Subtask added successfully');
        } catch (updateError) {
          console.error('Error updating document:', updateError);
          toast.error('Failed to update project document');
        }
      } catch (error) {
        console.error('Error in handleAddSubtask:', error);
        toast.error(error.message || 'Failed to add subtask');
      }
    };

    const handleToggleSubtask = async (subtaskId) => {
      try {
        const projectRef = doc(db, 'projects', selectedTask.projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          console.error('Project not found:', selectedTask.projectId);
          toast.error('Project not found');
          return;
        }

        const projectData = projectSnap.data();
        const taskIndex = projectData.tasks.findIndex(t => t.id === selectedTask.id);

        if (taskIndex === -1) {
          console.error('Task not found in project:', selectedTask.id);
          toast.error('Task not found');
          return;
        }

        const updatedTasks = [...projectData.tasks];
        const taskToUpdate = { ...updatedTasks[taskIndex] };

        taskToUpdate.subtasks = taskToUpdate.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        taskToUpdate.lastModified = serverTimestamp();
        updatedTasks[taskIndex] = taskToUpdate;

        await updateDoc(projectRef, {
          tasks: updatedTasks,
          lastModified: serverTimestamp()
        });

        setSelectedTask(taskToUpdate);
      } catch (error) {
        console.error('Error toggling subtask:', error);
        toast.error('Failed to toggle subtask');
      }
    };

    const handleDeleteSubtask = async (subtaskId) => {
      try {
        const projectRef = doc(db, 'projects', selectedTask.projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          console.error('Project not found:', selectedTask.projectId);
          toast.error('Project not found');
          return;
        }

        const projectData = projectSnap.data();
        const taskIndex = projectData.tasks.findIndex(t => t.id === selectedTask.id);

        if (taskIndex === -1) {
          console.error('Task not found in project:', selectedTask.id);
          toast.error('Task not found');
          return;
        }

        const updatedTasks = [...projectData.tasks];
        const taskToUpdate = { ...updatedTasks[taskIndex] };

        taskToUpdate.subtasks = taskToUpdate.subtasks.filter(st => st.id !== subtaskId);
        taskToUpdate.lastModified = serverTimestamp();
        updatedTasks[taskIndex] = taskToUpdate;

        await updateDoc(projectRef, {
          tasks: updatedTasks,
          lastModified: serverTimestamp()
        });

        setSelectedTask(taskToUpdate);
        toast.success('Subtask deleted');
      } catch (error) {
        console.error('Error deleting subtask:', error);
        toast.error('Failed to delete subtask');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">
              Manage Subtasks: {selectedTask.title}
            </h3>
            <button
              onClick={() => {
                setShowSubtaskModal(false);
                setSelectedTask(null);
                setNewSubtask('');
              }}
              className="text-slate-400 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSubtask}
                onChange={handleSubtaskInputChange}
                placeholder="New subtask..."
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
              >
                Add Subtask
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedTask.subtasks?.map(subtask => (
              <div
                key={subtask.id}
                className="flex items-center justify-between bg-slate-700/50 p-2 rounded-lg group"
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={`p-1 rounded hover:bg-slate-600 ${subtask.completed ? 'text-violet-400' : 'text-slate-400'}`}
                  >
                    {subtask.completed ? (
                      <FiCheckSquare className="w-4 h-4" />
                    ) : (
                      <FiSquare className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`ml-2 ${subtask.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {subtask.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (
              <p className="text-slate-400 text-center py-4">No subtasks yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-4">
        <div className="text-red-500 text-xl mb-4">
          <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
          Failed to load tasks
        </div>
        <div className="text-slate-400 text-center mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-slate-900">
        <div className="p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-white">Task Board</h2>
              {renderQuickAccessButtons()}
            </div>
            {project?.owner === currentUser?.email && (
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
              >
                <FiPlus className="mr-2" />
                Add Task
              </button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tasks... Use @ to mention someone"
                value={searchQuery}
                onChange={handleSearchInput}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />
              {/* Member suggestions dropdown */}
              {showSuggestions && memberSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {memberSuggestions.map(member => (
                    <button
                      key={member}
                      onClick={() => handleMemberSelect(member)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 focus:outline-none focus:bg-slate-700"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center mr-2">
                          {member.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{member.split('@')[0]}</div>
                          <div className="text-xs text-slate-400">{member}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-40">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="w-40">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Assignees</option>
                {Array.isArray(project?.members) && project.members.map(member => {
                  if (typeof member !== 'string') return null;
                  const displayName = member.includes('@') ? member.split('@')[0] : member;
                  return (
                    <option key={member} value={member}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Task Creation Form */}
          {isAddingTask && (
            <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Create New Task</h3>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    rows="3"
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    >
                      {Object.entries(TASK_STATUSES).map(([value, { label }]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Notify Before (hours)
                    </label>
                    <input
                      type="number"
                      value={newTask.notifyBefore}
                      onChange={(e) => setNewTask({ ...newTask, notifyBefore: parseInt(e.target.value) })}
                      min="1"
                      max="72"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Quick Notes and TODO Panels */}
        {showQuickNotes && <QuickNotesPanel />}
        {showTodoPanel && <TodoPanel />}

        {/* Kanban Board */}
        <div className="flex-1 p-4 overflow-x-auto">
          <div className="flex space-x-4 min-w-max">
            {Object.entries(TASK_STATUSES).map(([status, config]) => (
              <div key={status} className="w-80">
                <div className={`p-3 rounded-t-lg ${config.bgColor} ${config.borderColor} border-b-0`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`w-4 h-4 ${config.color}`} />
                      <h3 className={`font-medium ${config.color}`}>{config.label}</h3>
                    </div>
                    <span className={`text-sm ${config.color}`}>
                      {getTasksByStatus(status).length}
                    </span>
                  </div>
                </div>
                <div
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`min-h-[200px] p-2 rounded-b-lg border ${config.borderColor} ${config.bgColor
                    } transition-colors ${dragOverStatus === status
                      ? 'border-violet-500 ring-2 ring-violet-500/50 bg-opacity-70'
                      : ''
                    }`}
                >
                  {getTasksByStatus(status).map((task) => (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`mb-2 cursor-move select-none ${draggingTask?.id === task.id ? 'opacity-50' : ''
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {renderTaskWithPin(task)}
                    </motion.div>
                  ))}
                  {dragOverStatus === status && (
                    <div className="h-2 bg-violet-500/20 rounded-lg mt-2 transition-all duration-200" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Statistics */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <div className="flex justify-between text-sm text-slate-400">
            <div>Total Tasks: {filteredTasks.length}</div>
            <div>Filtered Tasks: {filteredTasks.length} / {tasks.length}</div>
            <div>Last Updated: {formatTimestamp(lastUpdate)}</div>
          </div>
        </div>

        {/* Subtask Modal */}
        {showSubtaskModal && <SubtaskModal />}
      </div>
    </DragDropContext>
  );
};

export default React.memo(KanbanBoard); 