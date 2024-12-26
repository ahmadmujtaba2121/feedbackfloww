import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const TaskCard = ({ task, onDragStart, onDragEnd, isOwner }) => {
  const priorityColors = {
    low: 'border-blue-500/50',
    medium: 'border-yellow-500/50',
    high: 'border-red-500/50'
  };

  const handleDragStart = (e) => {
    if (!isOwner) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', task.id);
    if (onDragStart) onDragStart(task);
  };

  return (
    <div
      draggable={isOwner}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        p-2 rounded-lg bg-slate-700/50 border-l-4 
        ${priorityColors[task.priority]} 
        ${isOwner ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        select-none
      `}
    >
      <h3 className="text-sm font-medium text-white truncate">{task.title}</h3>
      <div className="text-xs text-slate-400 truncate">
        {task.status}
      </div>
    </div>
  );
};

const CalendarDay = ({ dateKey, tasks = [], isCurrentMonth, isOwner, onDrop }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-700/50', 'border-violet-500');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-700/50', 'border-violet-500');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-700/50', 'border-violet-500');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDrop) {
      onDrop(taskId, dateKey);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-[120px] p-2 rounded-lg border transition-colors ${isCurrentMonth
        ? 'bg-slate-800/50 border-slate-700'
        : 'bg-slate-800/20 border-slate-700/50'
        }`}
    >
      <div className="text-right mb-2">
        <span className={`text-sm ${isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}`}>
          {format(new Date(dateKey), 'd')}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isOwner={isOwner}
          />
        ))}
      </div>
    </div>
  );
};

const CalendarView = ({ projectId }) => {
  const { tasks, addTask, updateTask, project } = useTask();
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'design',
    priority: 'medium',
    status: 'TODO',
    dueDate: new Date().toISOString()
  });

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group tasks by due date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {});

  const handleDrop = async (taskId, newDateKey) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newDueDate = new Date(newDateKey).toISOString();
      await updateTask(task.id, {
        ...task,
        dueDate: newDueDate
      });

      toast.success('Task moved successfully');
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
        createdBy: currentUser?.email
      });

      setNewTask({
        title: '',
        description: '',
        category: 'design',
        priority: 'medium',
        status: 'TODO',
        dueDate: new Date().toISOString()
      });
      setShowCreateTask(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FiChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FiChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          {project?.owner === currentUser?.email && (
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          )}
        </div>

        {/* Create Task Form */}
        <AnimatePresence>
          {showCreateTask && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateTask}
              className="mt-4 p-4 bg-slate-700 rounded-lg overflow-hidden"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
                    rows="3"
                    placeholder="What needs to be done?"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="design">Design</option>
                      <option value="content">Content</option>
                      <option value="development">Development</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={format(new Date(newTask.dueDate), 'yyyy-MM-dd')}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: new Date(e.target.value).toISOString() }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-slate-400 font-medium py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isOwner = project?.owner === currentUser?.email;

            return (
              <CalendarDay
                key={dateKey}
                dateKey={dateKey}
                tasks={dayTasks}
                isCurrentMonth={isCurrentMonth}
                isOwner={isOwner}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 