import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiClock, FiUser, FiCalendar, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const TimeTracker = () => {
  const { tasks, updateTask } = useTask();
  const { currentUser } = useAuth();
  const [timeRecords, setTimeRecords] = useState({});
  const [activeTimers, setActiveTimers] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load saved time records and active timers
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

      setLastUpdate(Date.now());
    };

    loadTimeRecords();
    const interval = setInterval(loadTimeRecords, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0h 0m 0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getTotalTime = (taskId) => {
    const records = timeRecords[taskId] || [];
    const completedTime = records.reduce((total, record) => total + record.duration, 0);
    const activeTimer = activeTimers[taskId];

    if (activeTimer?.isRunning) {
      const startTime = new Date(activeTimer.startTime);
      const activeTime = Math.floor((new Date() - startTime) / 1000);
      return completedTime + activeTime;
    }

    return completedTime;
  };

  const getUserTotalTime = () => {
    let total = 0;
    Object.entries(timeRecords).forEach(([taskId, records]) => {
      records.forEach(record => {
        if (record.user === currentUser?.email) {
          total += record.duration;
        }
      });
    });

    // Add active times
    Object.entries(activeTimers).forEach(([taskId, timer]) => {
      if (timer.isRunning) {
        const startTime = new Date(timer.startTime);
        const activeTime = Math.floor((new Date() - startTime) / 1000);
        total += activeTime;
      }
    });

    return total;
  };

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    const records = timeRecords[task.id] || [];
    const activeTimer = activeTimers[task.id];

    if (records.length === 0 && !activeTimer?.isRunning) return acc;

    records.forEach(record => {
      const date = new Date(record.startTime).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      if (!acc[date].find(t => t.id === task.id)) {
        acc[date].push(task);
      }
    });

    if (activeTimer?.isRunning) {
      const date = new Date(activeTimer.startTime).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      if (!acc[date].find(t => t.id === task.id)) {
        acc[date].push(task);
      }
    }

    return acc;
  }, {});

  return (
    <div className="bg-background p-6 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Time Tracking Overview</h2>
        <div className="text-lg font-mono text-muted-foreground">
          Total Time: {formatDuration(getUserTotalTime())}
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedTasks)
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .map(([date, dateTasks]) => (
            <div key={date}>
              <h3 className="text-lg font-medium text-foreground mb-4">{date}</h3>
              <div className="space-y-4">
                {dateTasks.map(task => {
                  const records = timeRecords[task.id] || [];
                  const activeTimer = activeTimers[task.id];
                  const totalTime = getTotalTime(task.id);
                  const dateRecords = records.filter(
                    record => new Date(record.startTime).toLocaleDateString() === date
                  );

                  if (activeTimer?.isRunning) {
                    const startTime = new Date(activeTimer.startTime);
                    if (startTime.toLocaleDateString() === date) {
                      dateRecords.push({
                        startTime: activeTimer.startTime,
                        duration: Math.floor((new Date() - startTime) / 1000),
                        user: currentUser?.email,
                        isActive: true
                      });
                    }
                  }

                  return (
                    <div key={task.id} className="bg-card p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-foreground">{task.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${task.status === 'COMPLETED'
                              ? 'bg-success/20 text-success'
                              : 'bg-primary/20 text-primary'
                              }`}>
                              {task.status}
                            </span>
                          </div>

                          {/* Task Details */}
                          <div className="flex flex-wrap gap-3 text-sm mb-4">
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
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <FiClock className="w-4 h-4" />
                              Total: {formatDuration(totalTime)}
                            </span>
                          </div>

                          {/* Time Records */}
                          <div className="space-y-2">
                            {dateRecords.map((record, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {new Date(record.startTime).toLocaleTimeString()}
                                  </span>
                                  {record.isActive && (
                                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono">
                                  {formatDuration(record.duration)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TimeTracker; 