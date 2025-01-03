import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiPlus, FiX, FiClock, FiCheckCircle, FiAlertCircle, FiPlayCircle, FiEye, FiFileText, FiStar, FiBookmark, FiCheckSquare, FiSquare, FiTrash2, FiSearch, FiCircle, FiFilter, FiCalendar, FiGrid } from 'react-icons/fi';
import TaskCard from './TaskCard';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STATUSES, getStatusConfig } from '../utils/taskStatus';
import { serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useParams } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import { cn } from '../utils/cn';

// Add this after the imports
const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-destructive/10 text-destructive';
    case 'medium':
      return 'bg-warning/10 text-warning';
    case 'low':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const LoadingSkeleton = () => (
  <div className="flex space-x-4 min-w-max p-4">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="w-[320px]">
        <div className="p-3 rounded-t-lg bg-card/50 border-border animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
            <div className="h-4 w-6 bg-muted rounded" />
          </div>
        </div>
        <div className="min-h-[200px] p-2 rounded-b-lg border border-border bg-card/30">
          {[...Array(3)].map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="mb-2 p-4 bg-card rounded-lg border border-border"
            >
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted rounded" />
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
    <div className="w-80 shrink-0">
      <div className="p-3 rounded-t-lg bg-card border border-border border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground">{config.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {tasks?.length || 0}
            </span>
            {project?.owner === currentUser?.email && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] p-2 rounded-b-lg border border-border bg-card/50 transition-colors ${snapshot.isDraggingOver ? 'bg-card shadow-sm' : ''
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
                    className={`group relative mb-2 p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg scale-105' : ''
                      }`}
                    style={{
                      ...provided.draggableProps.style,
                      userSelect: 'none',
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground line-clamp-1">{task.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              <span>{formatTimestamp(task.deadline)}</span>
                            </div>
                          )}
                          {task.subtasks?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <FiCheckSquare className="w-3 h-3" />
                              <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                            </div>
                          )}
                        </div>
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs text-primary font-medium">
                                {task.assignedTo.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {task.subtasks?.length > 0 && (
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Add this hover card component inside the task card */}
                    <div className={`absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none ${draggingTask?.id === task.id ? 'opacity-0' : ''}`} style={{
                      top: '-0.5rem',
                      left: '50%',
                      transform: 'translate(-50%, -100%)',
                    }}>
                      <div className="p-4 bg-popover border border-border rounded-lg shadow-lg">
                        <div className="flex flex-col gap-3 min-w-[16rem]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{task.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <FiClock className="w-3.5 h-3.5" />
                                <span>Created {formatTimestamp(task.createdAt)}</span>
                              </div>
                              {task.lastModified && (
                                <div className="flex items-center gap-1.5">
                                  <FiFileText className="w-3.5 h-3.5" />
                                  <span>Updated {formatTimestamp(task.lastModified)}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {task.deadline && (
                                <div className="flex items-center gap-1.5">
                                  <FiClock className="w-3.5 h-3.5" />
                                  <span>Due {formatTimestamp(task.deadline)}</span>
                                </div>
                              )}
                              {task.assignedTo && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-[10px] text-primary font-medium">
                                      {task.assignedTo.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span>{task.assignedTo}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {task.subtasks?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-foreground font-medium">
                                  {Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{
                                    width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                                  }}
                                />
                              </div>
                              <div className="text-xs space-y-1">
                                {task.subtasks.map(subtask => (
                                  <div key={subtask.id} className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${subtask.completed ? 'bg-primary' : 'bg-muted'}`} />
                                    <span className={subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { tasks, loading, updateTaskStatus, addTask, project, error, lastUpdate } = useTask();
  const { currentUser } = useAuth();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDue, setFilterDue] = useState('all');
  const [filterProgress, setFilterProgress] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [view, setView] = useState('board');
  const [groupBy, setGroupBy] = useState('status');
  const [customStatuses, setCustomStatuses] = useState([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showTodoPanel, setShowTodoPanel] = useState(false);
  const [pinnedTasks, setPinnedTasks] = useState([]);
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');
  const searchInputRef = useRef(null);

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

  // Add drag start state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [isDraggingStatus, setIsDraggingStatus] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    priority: false,
    dueDate: false,
    assignee: false,
    progress: false
  });

  const [activeView, setActiveView] = useState('board');
  const [activeGrouping, setActiveGrouping] = useState('status');

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
      const statusLabel = TASK_STATUSES[newStatus]?.label || newStatus;
      toast.success(`Task moved to ${statusLabel}`, {
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
      if (!taskId || !newStatus) return;

      // Update local state if needed
      const taskToUpdate = tasks.find(t => t?.id === taskId);
      if (taskToUpdate) {
        const updatedTasks = tasks.map(t =>
          t?.id === taskId ? { ...t, status: newStatus, ...updatedTask } : t
        );
        // Use the tasks from context
        const { setTasks } = useTask();
        setTasks(updatedTasks);
      }
    };

    window.addEventListener('taskStatusUpdate', handleTaskUpdate);
    return () => {
      window.removeEventListener('taskStatusUpdate', handleTaskUpdate);
    };
  }, [tasks]);

  // Filtered tasks based on search and filters
  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      // Priority filter
      if (filterPriority !== 'all' && task.priority?.toLowerCase() !== filterPriority?.toLowerCase()) {
        return false;
      }

      // Due date filter
      if (filterDue !== 'all') {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        switch (filterDue) {
          case 'overdue':
            if (!dueDate || dueDate >= today) return false;
            break;
          case 'today':
            if (!dueDate || dueDate.getDate() !== today.getDate()) return false;
            break;
          case 'tomorrow':
            if (!dueDate || dueDate.getDate() !== tomorrow.getDate()) return false;
            break;
          case 'thisWeek':
            if (!dueDate || dueDate > nextWeek || dueDate < today) return false;
            break;
          case 'none':
            if (dueDate) return false;
            break;
        }
      }

      // Progress filter
      if (filterProgress !== 'all') {
        switch (filterProgress) {
          case 'notStarted':
            if (task.status !== 'TODO') return false;
            break;
          case 'inProgress':
            if (!['IN_PROGRESS', 'IN_REVIEW'].includes(task.status)) return false;
            break;
          case 'completed':
            if (task.status !== 'COMPLETED') return false;
            break;
        }
      }

      // Assignee filter
      if (filterAssignee !== 'all' && task.assignedTo !== filterAssignee) {
        return false;
      }

      return true;
    });
  }, [tasks, filterPriority, filterDue, filterProgress, filterAssignee]);

  const getTasksByStatus = useCallback((status) => {
    return getFilteredTasks().filter(task => task.status === status);
  }, [getFilteredTasks]);

  const taskGroups = useMemo(() => {
    if (!TASK_STATUSES) return {};
    return Object.keys(TASK_STATUSES).reduce((acc, status) => {
      acc[status] = getTasksByStatus(status)?.filter(task => task?.id) || [];
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
    if (!Array.isArray(tasks)) return;
    const notifiedTasks = new Set();
    tasks.forEach(task => {
      if (!task?.id || !task?.deadline) return;
      if (notifiedTasks.has(task.id)) return;

      const deadline = new Date(task.deadline);
      const now = new Date();
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      if (hoursUntilDeadline <= (task.notifyBefore || 24) && hoursUntilDeadline > 0) {
        toast.warning(`Task "${task.title || 'Untitled'}" is due in ${Math.round(hoursUntilDeadline)} hours!`, {
          id: `deadline-${task.id}`,
        });
        notifiedTasks.add(task.id);
      } else if (hoursUntilDeadline <= 0) {
        toast.error(`Task "${task.title || 'Untitled'}" is overdue!`, {
          id: `overdue-${task.id}`,
        });
        notifiedTasks.add(task.id);
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
        className="flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
      >
        <FiFileText className="mr-2" />
        Quick Notes
      </button>
      <button
        onClick={() => setShowTodoPanel(!showTodoPanel)}
        className="flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
      >
        <FiBookmark className="mr-2" />
        Quick TODOs
      </button>
      <button
        onClick={() => setShowStatusModal(true)}
        className="flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
      >
        <FiPlus className="w-4 h-4 mr-1" />
        Add Status
      </button>
      <button
        onClick={() => setIsAddingTask(true)}
        className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 transition-colors"
      >
        <FiPlus className="w-4 h-4" />
        <span>New Task</span>
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
            ? 'text-warning'
            : 'text-muted-foreground hover:text-warning'
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

  const handleFilterToggle = () => {
    const hasActiveFilters = filterPriority !== 'all' || filterDue !== 'all' ||
      filterAssignee !== 'all' || filterProgress !== 'all';
    setShowFilterPanel(prev => !prev);
    if (hasActiveFilters) {
      toast.success('Filters active');
    }
  };

  const handleViewToggle = () => {
    const newView = activeView === 'board' ? 'timeline' : 'board';
    setActiveView(newView);
    toast.success(`Switched to ${newView} view`);
  };

  const handleGroupingToggle = () => {
    const newGrouping = activeGrouping === 'status' ? 'assignee' : 'status';
    setActiveGrouping(newGrouping);
    toast.success(`Grouped by ${newGrouping}`);
  };

  const onDragStart = (result) => {
    const { draggableId } = result;
    const task = tasks.find(t => t.id === draggableId);
    setDraggingTask(task);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    setDraggingTask(null);

    // If dropped outside a droppable area or in the same position
    if (!destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    try {
      const newStatus = destination.droppableId;
      await updateTaskStatus(draggableId, newStatus);

      // Success notification
      const statusLabel = TASK_STATUSES[newStatus]?.label || newStatus;
      toast.success(`Task moved to ${statusLabel}`);
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    }
  };

  // Update event listener for task updates
  useEffect(() => {
    const handleTaskUpdate = (event) => {
      const { taskId, newStatus, task } = event.detail;
      if (!taskId || !newStatus) return;

      // Only update if the event wasn't triggered by this component
      if (event.detail.source !== 'kanban') {
        // The tasks state will be automatically updated by TaskContext
        // No need to manually setTasks here
        return;
      }
    };

    window.addEventListener('taskStatusUpdate', handleTaskUpdate);
    return () => {
      window.removeEventListener('taskStatusUpdate', handleTaskUpdate);
    };
  }, []); // Remove setTasks dependency

  const handleAddCustomStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      const statusId = `CUSTOM_${newStatusName.toUpperCase().replace(/\s+/g, '_')}`;
      const newStatus = {
        id: statusId,
        label: newStatusName,
        color: newStatusColor,
        icon: FiCircle,
        custom: true
      };

      setCustomStatuses(prev => [...prev, newStatus]);
      setNewStatusName('');
      setNewStatusColor('#6366f1');
      setShowStatusModal(false);
      toast.success('Custom status added successfully');
    } catch (error) {
      console.error('Error adding custom status:', error);
      toast.error('Failed to add custom status');
    }
  };

  // Add this function near other state management functions
  const handleDeleteStatus = (statusId) => {
    if (!statusId || Object.keys(TASK_STATUSES).includes(statusId)) {
      toast.error('Cannot delete default status');
      return;
    }

    const tasksInStatus = tasks.filter(task => task.status === statusId);
    if (tasksInStatus.length > 0) {
      toast.error('Cannot delete status with tasks. Please move tasks first.');
      return;
    }

    setCustomStatuses(prev => prev.filter(status => status.id !== statusId));
    toast.success('Status deleted successfully');
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-4">
        <div className="text-destructive text-xl mb-4">
          <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
          Failed to load tasks
        </div>
        <div className="text-muted-foreground text-center mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-background">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-background">
        {/* Header Section */}
        <div className="p-4 bg-background/50 border-b border-border sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-card-foreground">Task Board</h2>
              {renderQuickAccessButtons()}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder="Search tasks..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3 py-1.5 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Assignees</option>
                {project?.members?.map((member) => {
                  // Handle both string and object member formats
                  const memberEmail = typeof member === 'object' ? member.email : member;
                  const displayName = typeof member === 'object' ?
                    (member.displayName || member.email?.split('@')[0] || memberEmail) :
                    member?.split('@')[0] || member;

                  return memberEmail ? (
                    <option key={memberEmail} value={memberEmail}>
                      {displayName}
                    </option>
                  ) : null;
                })}
              </select>

              <select
                value={filterDue}
                onChange={(e) => setFilterDue(e.target.value)}
                className="px-3 py-1.5 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Due Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="tomorrow">Due Tomorrow</option>
                <option value="thisWeek">Due This Week</option>
                <option value="none">No Due Date</option>
              </select>

              <select
                value={filterProgress}
                onChange={(e) => setFilterProgress(e.target.value)}
                className="px-3 py-1.5 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Progress</option>
                <option value="notStarted">Not Started</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="relative">
              <div className="flex items-center space-x-2 ml-auto">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterPanel(prev => !prev)}
                    className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${filterPriority !== 'all' || filterDue !== 'all' ||
                      filterAssignee !== 'all' || filterProgress !== 'all'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-primary'
                      }`}
                    title="Toggle Filters"
                  >
                    <FiFilter className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setView(prev => prev === 'board' ? 'timeline' : 'board');
                    toast.success(`Switched to ${view === 'board' ? 'Timeline' : 'Board'} view`);
                  }}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${view === 'timeline'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-primary'
                    }`}
                  title={`Switch to ${view === 'board' ? 'Timeline' : 'Board'} View`}
                >
                  <FiCalendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setGroupBy(prev => prev === 'status' ? 'assignee' : 'status');
                    toast.success(`Grouped by ${groupBy === 'status' ? 'Assignee' : 'Status'}`);
                  }}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${groupBy === 'assignee'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-primary'
                    }`}
                  title={`Group by ${groupBy === 'status' ? 'Assignee' : 'Status'}`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Notes and TODO Panels */}
        {showQuickNotes && <QuickNotesPanel />}
        {showTodoPanel && <TodoPanel />}

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="absolute right-0 mt-2 w-72 bg-background border border-border shadow-xl rounded-lg z-50">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">Filter Tasks</h3>
                <button onClick={() => setShowFilterPanel(false)} className="text-muted-foreground hover:text-foreground">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Due Date</label>
                  <select
                    value={filterDue}
                    onChange={(e) => setFilterDue(e.target.value)}
                    className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors"
                  >
                    <option value="all">All Due Dates</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Due Today</option>
                    <option value="tomorrow">Due Tomorrow</option>
                    <option value="thisWeek">Due This Week</option>
                    <option value="none">No Due Date</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Progress</label>
                  <select
                    value={filterProgress}
                    onChange={(e) => setFilterProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors"
                  >
                    <option value="all">All Progress</option>
                    <option value="notStarted">Not Started</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Assignee</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors"
                  >
                    <option value="all">All Assignees</option>
                    {project?.members?.map((member) => {
                      const memberEmail = typeof member === 'object' ? member.email : member;
                      const displayName = typeof member === 'object' ?
                        (member.displayName || member.email?.split('@')[0] || memberEmail) :
                        member?.split('@')[0] || member;

                      return memberEmail ? (
                        <option key={memberEmail} value={memberEmail}>
                          {displayName}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="h-full flex flex-col items-center justify-center bg-background p-4">
            <div className="text-destructive text-xl mb-4">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
              Failed to load tasks
            </div>
            <div className="text-muted-foreground text-center mb-4">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Kanban Board */}
        {!loading && !error && (
          <div className="p-4 overflow-x-auto bg-background/50">
            <div className="flex gap-6 min-w-max">
              {Object.entries({ ...TASK_STATUSES, ...Object.fromEntries(customStatuses.map(s => [s.id, s])) })
                .map(([status, config]) => (
                  <div key={status} className="w-[320px] flex flex-col">
                    {/* Column Header */}
                    <div className="mb-3 flex flex-col bg-card/90 rounded-lg border border-border hover:bg-card transition-all">
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">
                            {status === 'TODO' && <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md">To Do</span>}
                            {status === 'IN_PROGRESS' && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-md">In Progress</span>}
                            {status === 'IN_REVIEW' && <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-md">In Review</span>}
                            {status === 'DONE' && <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">Done</span>}
                            {!['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(status) && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{config.label}</span>}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {getTasksByStatus(status).length} tasks
                          </span>
                          {project?.owner === currentUser?.email && (
                            <button
                              onClick={() => setShowStatusModal(true)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="px-3 pb-2 flex flex-col gap-2 border-t border-border pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex space-x-3">
                            <span className="text-primary">
                              {getTasksByStatus(status).length} tasks
                            </span>
                            <span className="text-muted-foreground">
                              {getTasksByStatus(status).filter(t => t.priority === 'high').length} high priority
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <span>{getTasksByStatus(status).filter(t => t.subtasks?.every(st => st.completed)).length}</span>
                            <FiCheckCircle className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Column Analytics */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/30 rounded-md p-1.5 flex items-center justify-between">
                            <span className="text-muted-foreground">Avg Time</span>
                            <span className="text-primary">
                              {Math.round(getTasksByStatus(status)
                                .filter(t => t.completedAt)
                                .reduce((acc, t) => acc + (new Date(t.completedAt) - new Date(t.createdAt)), 0) /
                                (getTasksByStatus(status).filter(t => t.completedAt).length || 1) /
                                (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                          <div className="bg-muted/30 rounded-md p-1.5 flex items-center justify-between">
                            <span className="text-muted-foreground">Due Soon</span>
                            <span className={getTasksByStatus(status).filter(t =>
                              t.deadline && new Date(t.deadline) > new Date() &&
                              new Date(t.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                            ).length > 0 ? 'text-warning' : 'text-primary'}>
                              {getTasksByStatus(status).filter(t =>
                                t.deadline && new Date(t.deadline) > new Date() &&
                                new Date(t.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                              ).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Container */}
                    <div
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDrop={(e) => handleDrop(e, status)}
                      className={`flex-1 p-2 rounded-lg bg-background/50 min-h-[calc(100vh-16rem)] transition-all border border-border backdrop-blur-sm
                        ${dragOverStatus === status ? 'bg-primary/5 ring-2 ring-primary/20 border-primary/20' : ''}`}
                    >
                      {getTasksByStatus(status)
                        .filter(task => task && task.id) // Add additional filter for safety
                        .map((task) => (
                          <motion.div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            className={`mb-3 cursor-move ${draggingTask?.id === task.id ? 'opacity-50' : ''}`}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div
                              className={`group relative bg-card/80 rounded-lg border border-border p-3 shadow-lg hover:shadow-xl transition-all backdrop-blur-sm
                                ${task.priority === 'high' ? 'ring-2 ring-destructive/20' :
                                  task.priority === 'medium' ? 'ring-2 ring-warning/20' : ''}`}
                            >
                              {/* Hover Card */}
                              <div
                                className={`absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 z-[60] p-4 bg-card border border-border rounded-lg shadow-lg w-80 -translate-y-2 transition-all duration-200`}
                                style={{
                                  top: '-0.5rem',
                                  left: '50%',
                                  transform: 'translate(-50%, -100%)',
                                  pointerEvents: 'none',
                                  backgroundColor: 'var(--background)',
                                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.15), 0 2px 8px -2px rgba(0, 0, 0, 0.1)',
                                  opacity: draggingTask?.id === task.id ? 0 : undefined,
                                  visibility: draggingTask?.id === task.id ? 'hidden' : undefined
                                }}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{task.title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <FiClock className="w-3.5 h-3.5" />
                                        <span>Created {formatTimestamp(task.createdAt)}</span>
                                      </div>
                                      {task.lastModified && (
                                        <div className="flex items-center gap-1.5">
                                          <FiFileText className="w-3.5 h-3.5" />
                                          <span>Updated {formatTimestamp(task.lastModified)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {task.deadline && (
                                        <div className="flex items-center gap-1.5">
                                          <FiClock className="w-3.5 h-3.5" />
                                          <span>Due {formatTimestamp(task.deadline)}</span>
                                        </div>
                                      )}
                                      {task.assignedTo && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-[10px] text-primary font-medium">
                                              {task.assignedTo.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <span>{task.assignedTo}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {task.subtasks?.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="text-foreground font-medium">
                                          {Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)}%
                                        </span>
                                      </div>
                                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary transition-all"
                                          style={{
                                            width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                                          }}
                                        />
                                      </div>
                                      <div className="text-xs space-y-1">
                                        {task.subtasks.map(subtask => (
                                          <div key={subtask.id} className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${subtask.completed ? 'bg-primary' : 'bg-muted'}`} />
                                            <span className={subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                                              {subtask.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Existing Task Card Content */}
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-card-foreground">{task.title}</h4>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => togglePinTask(task)}
                                    className={`p-1 rounded hover:bg-muted ${pinnedTasks.some(t => t.id === task.id)
                                      ? 'text-warning'
                                      : 'text-muted-foreground hover:text-warning'
                                      }`}
                                  >
                                    <FiStar className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setShowSubtaskModal(true);
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                                  >
                                    <FiFileText className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Rest of the existing task card content */}
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Due Date Indicator */}
                              {task.deadline && (
                                <div className="mb-2 flex items-center text-xs">
                                  <FiClock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                  <span className={`${new Date(task.deadline) < new Date()
                                    ? 'text-destructive'
                                    : new Date(task.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                                      ? 'text-warning'
                                      : 'text-muted-foreground'
                                    }`}>
                                    Due {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}

                              {/* Task Progress Bar */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-300 rounded-full"
                                      style={{ width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full backdrop-blur-sm ${task.priority === 'high'
                                    ? 'bg-destructive/10 text-destructive'
                                    : task.priority === 'medium'
                                      ? 'bg-warning/10 text-warning'
                                      : 'bg-primary/10 text-primary'
                                    }`}>
                                    {task.priority}
                                  </span>
                                  {task.createdAt && (
                                    <span className="text-muted-foreground flex items-center">
                                      <FiClock className="w-3.5 h-3.5 mr-1" />
                                      {Math.round((Date.now() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24))}d
                                    </span>
                                  )}
                                </div>
                                {task.assignedTo && (
                                  <div className="flex items-center text-muted-foreground">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1 text-xs">
                                      {task.assignedTo.charAt(0).toUpperCase()}
                                    </span>
                                    <span>{task.assignedTo.split('@')[0]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      {dragOverStatus === status && (
                        <div className="h-20 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5 backdrop-blur-sm" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Task Statistics */}
        <div className="p-3 bg-card/50 border-t border-border backdrop-blur-sm">
          <div className="flex justify-between text-sm text-card-foreground">
            <div>Total Tasks: {tasks.length}</div>
            <div>Filtered Tasks: {getFilteredTasks().length} / {tasks.length}</div>
            <div>Last Updated: {formatTimestamp(lastUpdate)}</div>
          </div>
        </div>

        {/* Modals */}
        {showSubtaskModal && (
          <SubtaskModal
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            setShowSubtaskModal={setShowSubtaskModal}
            newSubtask={newSubtask}
            setNewSubtask={setNewSubtask}
            currentUser={currentUser}
          />
        )}
        {isAddingTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
              <div className="bg-background border border-border rounded-lg shadow-lg">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-primary">Create New Task</h2>
                    <button
                      onClick={() => setIsAddingTask(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Add a new task to your board</p>
                </div>
                <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-primary">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-primary">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[100px] resize-none"
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="priority" className="text-sm font-medium text-primary">
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="status" className="text-sm font-medium text-primary">
                        Status
                      </label>
                      <select
                        id="status"
                        value={newTask.status}
                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                        className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        {Object.entries(TASK_STATUSES).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="assignee" className="text-sm font-medium text-primary">
                      Assign To
                    </label>
                    <select
                      id="assignee"
                      value={newTask.assignedTo || ''}
                      onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Assignee</option>
                      {project?.members?.map((member) => {
                        const memberEmail = typeof member === 'object' ? member.email : member;
                        const displayName = typeof member === 'object' ?
                          (member.displayName || member.email?.split('@')[0] || memberEmail) :
                          member?.split('@')[0] || member;

                        return memberEmail ? (
                          <option key={memberEmail} value={memberEmail}>
                            {displayName}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Member Suggestions Dropdown */}
        {showSuggestions && memberSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {memberSuggestions.map(member => {
              const memberEmail = typeof member === 'object' ? member.email : member;
              const displayName = typeof member === 'object' ? member.displayName || member.email : member;

              return memberEmail ? (
                <button
                  key={memberEmail}
                  onClick={() => handleMemberSelect(memberEmail)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 focus:outline-none focus:bg-slate-700"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center mr-2">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{displayName.split('@')[0]}</div>
                      <div className="text-xs text-slate-400">{memberEmail}</div>
                    </div>
                  </div>
                </button>
              ) : null;
            })}
          </div>
        )}

        {/* Custom Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-sm bg-background rounded-xl shadow-xl border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="text-xl font-semibold text-primary">Add Custom Status</h3>
                <p className="text-sm text-muted-foreground mt-1">Create a new status column for your tasks</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Status Name</label>
                  <input
                    type="text"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="Enter status name..."
                    className="w-full px-4 py-3 bg-card text-foreground border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Status Color</label>
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer bg-card border border-border p-1"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomStatus}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Add Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default React.memo(KanbanBoard); 
