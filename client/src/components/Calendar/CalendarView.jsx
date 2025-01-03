import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { FiChevronLeft, FiChevronRight, FiPlus, FiCalendar, FiList, FiFilter, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import TaskCard from './TaskCard';

const formatTaskDate = (date) => {
  if (!date) return '';
  const taskDate = new Date(date);
  return format(taskDate, 'MMM d, h:mm a');
};

const CalendarDay = ({ dateKey, tasks = [], isCurrentMonth, isOwner, isTodays, isSelected, onSelectDate }) => {
  const { currentTheme } = useTheme();
  const date = new Date(dateKey);
  const hasOverdueTasks = tasks.some(task =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  );
  const hasTasksDueToday = tasks.some(task =>
    task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

  return (
    <Droppable droppableId={String(dateKey)}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={() => onSelectDate(date)}
          className={`
            min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-all duration-200 cursor-pointer
            ${isCurrentMonth ? 'bg-background/50 border-border' : 'bg-background/20 border-border/50'}
            ${isTodays ? 'ring-2 ring-primary/50' : ''}
            ${isSelected ? 'ring-2 ring-primary' : ''}
            ${snapshot.isDraggingOver ? 'bg-accent/50 border-primary ring-2 ring-primary/20' : ''}
            ${hasOverdueTasks ? 'border-destructive/30' : ''}
            hover:border-primary/50 hover:shadow-sm
          `}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className={`
              text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded-full font-medium
              ${isTodays ? 'bg-primary text-primary-foreground' : ''}
              ${isCurrentMonth ? 'text-foreground/90' : 'text-foreground/50'}
              ${hasTasksDueToday ? 'font-semibold' : ''}
            `}>
              {format(date, 'd')}
            </span>
            {hasTasksDueToday && (
              <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="space-y-1 sm:space-y-2 overflow-y-auto max-h-[120px] sm:max-h-[200px] scrollbar-thin scrollbar-thumb-border scrollbar-track-background/50">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

const CalendarView = ({ projectId }) => {
  const { tasks, addTask, updateTask, project } = useTask();
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showOverdueTasks, setShowOverdueTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'design',
    priority: 'medium',
    status: 'TODO',
    dueDate: new Date().toISOString(),
    assignedTo: ''
  });

  // Get calendar days based on view mode
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: viewMode === 'month' ? calStart : startOfWeek(currentDate),
      end: viewMode === 'month' ? calEnd : endOfWeek(currentDate)
    });
  }, [currentDate, viewMode]);

  // Filter and group tasks
  const filteredTasksByDate = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (!showCompletedTasks && task.status === 'COMPLETED') return false;
      if (!showOverdueTasks && task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED') return false;

      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Group tasks by date
    return filtered.reduce((acc, task) => {
      if (!task.dueDate) {
        // If no due date, add to today's date
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        if (!acc[todayKey]) acc[todayKey] = [];
        acc[todayKey].push({
          ...task,
          isUnscheduled: true
        });
      } else {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
      }
      return acc;
    }, {});
  }, [tasks, searchQuery, statusFilter, priorityFilter, showOverdueTasks, showCompletedTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      const task = tasks.find(t => String(t.id) === draggableId);
      if (!task) return;

      const newDueDate = new Date(destination.droppableId);
      const originalDate = new Date(task.dueDate);
      newDueDate.setHours(originalDate.getHours());
      newDueDate.setMinutes(originalDate.getMinutes());

      const updatedTask = {
        ...task,
        dueDate: newDueDate.toISOString()
      };

      toast.promise(
        updateTask(projectId, task.id, updatedTask),
        {
          loading: 'Moving task...',
          success: 'Task moved successfully',
          error: 'Failed to move task'
        }
      );
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await addTask({
        ...newTask,
        createdBy: currentUser?.email,
        dueDate: selectedDate ? new Date(selectedDate).toISOString() : newTask.dueDate
      });

      setNewTask({
        title: '',
        description: '',
        category: 'design',
        priority: 'medium',
        status: 'TODO',
        dueDate: new Date().toISOString(),
        assignedTo: ''
      });
      setShowCreateTask(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleSelectDate = (date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    if (project?.owner === currentUser?.email) {
      setShowCreateTask(true);
      setNewTask(prev => ({
        ...prev,
        dueDate: date.toISOString()
      }));
    }
  };

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
      dueToday: tasks.filter(t => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length,
      unscheduled: tasks.filter(t => !t.dueDate).length
    };
    stats.inProgress = stats.total - stats.completed;
    return stats;
  }, [tasks]);

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <FiChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-xl font-semibold text-foreground/90">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <FiChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Task Statistics */}
            <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background/50">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-semibold text-foreground/90">{taskStats.total}</span>
                <span className="text-xs text-foreground/70">Total</span>
              </div>
              <div className="w-px h-4 bg-border/50" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-semibold text-success/90">{taskStats.completed}</span>
                <span className="text-xs text-foreground/70">Done</span>
              </div>
              <div className="w-px h-4 bg-border/50" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-semibold text-destructive/90">{taskStats.overdue}</span>
                <span className="text-xs text-foreground/70">Overdue</span>
              </div>
              <div className="w-px h-4 bg-border/50" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-semibold text-warning/90">{taskStats.dueToday}</span>
                <span className="text-xs text-foreground/70">Today</span>
              </div>
              <div className="w-px h-4 bg-border/50" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-semibold text-primary/90">{taskStats.unscheduled}</span>
                <span className="text-xs text-foreground/70">Unscheduled</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
                  }`}
              >
                <FiCalendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
                  }`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] lg:min-w-[240px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Task Display Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOverdueTasks(!showOverdueTasks)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${showOverdueTasks
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-muted border-input text-muted-foreground'
                    }`}
                >
                  Overdue
                </button>
                <button
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${showCompletedTasks
                    ? 'bg-success/10 border-success/20 text-success'
                    : 'bg-muted border-input text-muted-foreground'
                    }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {project?.owner === currentUser?.email && (
              <button
                onClick={() => setShowCreateTask(!showCreateTask)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Create Task Form */}
        <AnimatePresence>
          {showCreateTask && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateTask}
              className="mt-4 p-4 bg-card rounded-lg overflow-hidden border border-border shadow-lg"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Task title"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows="3"
                    placeholder="What needs to be done?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="design">Design</option>
                    <option value="content">Content</option>
                    <option value="development">Development</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate.slice(0, 16)}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: new Date(e.target.value).toISOString() }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Assign To
                  </label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map(member => (
                      <option key={member.email} value={member.email}>
                        {member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="min-w-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center">
                  <span className="text-sm font-semibold text-foreground/80 hidden sm:block">{day}</span>
                  <span className="text-sm font-semibold text-foreground/80 sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 auto-rows-fr">
              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = filteredTasksByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isOwner = project?.owner === currentUser?.email;
                const isTodays = isToday(day);
                const isSelected = dateKey === selectedDate;

                return (
                  <CalendarDay
                    key={dateKey}
                    dateKey={dateKey}
                    tasks={dayTasks}
                    isCurrentMonth={isCurrentMonth}
                    isOwner={isOwner}
                    isTodays={isTodays}
                    isSelected={isSelected}
                    onSelectDate={handleSelectDate}
                  />
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default CalendarView;