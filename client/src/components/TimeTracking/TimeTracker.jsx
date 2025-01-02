import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiClock, FiUser, FiCalendar, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp } from 'firebase/firestore';

const TimeTracker = ({ projectId }) => {
  const { tasks, updateTask } = useTask();
  const { currentUser } = useAuth();
  const [timeRecords, setTimeRecords] = useState({});
  const [activeTimers, setActiveTimers] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load time records from Firebase
  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Initialize timeRecords for all tasks if they don't exist
        const initializedTimeRecords = {};
        tasks.forEach(task => {
          initializedTimeRecords[task.id] = data.timeRecords?.[task.id] || [];
        });
        setTimeRecords(initializedTimeRecords);

        if (data.activeTimers) {
          const newTimers = {};
          Object.entries(data.activeTimers).forEach(([taskId, timer]) => {
            if (timer && timer.isRunning) {
              const startTime = new Date(timer.startTime);
              const elapsed = Math.floor((new Date() - startTime) / 1000);
              newTimers[taskId] = {
                ...timer,
                elapsed,
                startTime: timer.startTime
              };
            }
          });
          setActiveTimers(newTimers);
        }
      }
    });

    return () => unsubscribe();
  }, [projectId, tasks]);

  // Update active timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 1000);
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
    const completedTime = records.reduce((total, record) => {
      return total + (record.duration || 0);
    }, 0);

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
        total += (record.duration || 0);
      });
    });

    Object.entries(activeTimers).forEach(([taskId, timer]) => {
      if (timer?.isRunning) {
        const startTime = new Date(timer.startTime);
        const activeTime = Math.floor((new Date() - startTime) / 1000);
        total += activeTime;
      }
    });

    return total;
  };

  const startTimer = async (taskId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const newTimer = {
        isRunning: true,
        startTime: new Date().toISOString(),
        user: currentUser.email,
        taskId
      };

      await updateDoc(projectRef, {
        [`activeTimers.${taskId}`]: newTimer,
        lastModified: serverTimestamp()
      });

      toast.success('Timer started');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const stopTimer = async (taskId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const timer = activeTimers[taskId];

      if (timer && timer.isRunning) {
        const startTime = new Date(timer.startTime);
        const duration = Math.floor((new Date() - startTime) / 1000);

        const timeRecord = {
          startTime: timer.startTime,
          endTime: new Date().toISOString(),
          duration,
          user: timer.user,
          taskId
        };

        // Get current time records for the task
        const projectDoc = await getDoc(projectRef);
        const currentRecords = projectDoc.data()?.timeRecords?.[taskId] || [];

        await updateDoc(projectRef, {
          [`timeRecords.${taskId}`]: [...currentRecords, timeRecord],
          [`activeTimers.${taskId}`]: null,
          lastModified: serverTimestamp()
        });

        toast.success('Timer stopped');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    const records = timeRecords[task.id] || [];
    const activeTimer = activeTimers[task.id];

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

    // Add tasks with no records but assigned to current user
    if (task.assignedTo === currentUser?.email && !records.length && !activeTimer) {
      const today = new Date().toLocaleDateString();
      if (!acc[today]) acc[today] = [];
      if (!acc[today].find(t => t.id === task.id)) {
        acc[today].push(task);
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
                        user: activeTimer.user,
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

                          <div className="space-y-2">
                            {dateRecords.map((record, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {new Date(record.startTime).toLocaleTimeString()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    by {record.user}
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

                          {(task.assignedTo === currentUser?.email || task.createdBy === currentUser?.email) && (
                            <div className="mt-4 flex justify-end">
                              {activeTimers[task.id]?.isRunning ? (
                                <button
                                  onClick={() => stopTimer(task.id)}
                                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                >
                                  <FiPause className="w-4 h-4" />
                                  Stop Timer
                                </button>
                              ) : (
                                <button
                                  onClick={() => startTimer(task.id)}
                                  className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                                >
                                  <FiPlay className="w-4 h-4" />
                                  Start Timer
                                </button>
                              )}
                            </div>
                          )}
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