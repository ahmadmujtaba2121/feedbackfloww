import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { TASK_STATUSES } from '../utils/taskStatus';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children, projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Memoize the project reference
  const projectRef = useMemo(() => {
    if (!projectId) {
      console.warn('No projectId provided to TaskProvider');
      return null;
    }
    return doc(db, 'projects', projectId);
  }, [projectId]);

  // Helper function to normalize task data
  const normalizeTaskData = useCallback((data) => {
    if (!data) return { tasks: [], reviews: [] };

    const normalizeStatus = (status) => {
      if (!status || typeof status !== 'string') return 'TODO';
      const normalizedStatus = status.toUpperCase().replace(/ /g, '_');
      return normalizedStatus in TASK_STATUSES ? normalizedStatus : 'TODO';
    };

    const projectTasks = Array.isArray(data.tasks) ? data.tasks
      .filter(task => task && typeof task === 'object')
      .map(task => ({
        ...task,
        id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: normalizeStatus(task.status),
        isTask: true,
        type: 'task'
      })) : [];

    return { tasks: projectTasks };
  }, []);

  // Update task status function
  const updateTaskStatus = async (taskId, newStatus) => {
    if (!projectRef || !taskId || !newStatus) {
      console.error('Missing required parameters in updateTaskStatus');
      return;
    }

    try {
      // Get current project data
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      const tasks = projectData.tasks || [];

      // Find task index
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found in project');
      }

      // Create updated task with new status and history
      const updatedTask = {
        ...tasks[taskIndex],
        status: newStatus,
        lastModified: new Date().toISOString(),
        statusHistory: [
          ...(tasks[taskIndex].statusHistory || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            updatedBy: auth?.currentUser?.email || 'unknown'
          }
        ]
      };

      // Update tasks array
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = updatedTask;

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );

      // Update in Firestore
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      // Update project data in state
      setProject(prev => ({
        ...prev,
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      }));

      // Broadcast the status change
      const event = new CustomEvent('taskStatusUpdate', {
        detail: {
          taskId,
          newStatus,
          task: updatedTask,
          source: 'taskContext'
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      throw error;
    }
  };

  // Update task function
  const updateTask = useCallback(async (taskId, updatedData) => {
    if (!projectRef || !taskId) {
      throw new Error('Missing projectRef or taskId in updateTask');
    }

    try {
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      const timestamp = new Date().toISOString();

      // Find and update the task
      const tasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];
      const taskIndex = tasks.findIndex(task => task.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      // Create updated task
      const updatedTask = {
        ...tasks[taskIndex],
        ...updatedData,
        lastModified: timestamp,
        subtasks: Array.isArray(updatedData.subtasks) ? updatedData.subtasks : (tasks[taskIndex].subtasks || [])
      };

      // Update tasks array
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = updatedTask;

      // Update in Firestore
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [projectRef]);

  // Add task function
  const addTask = useCallback(async (taskData) => {
    if (!projectRef) {
      throw new Error('No project reference available');
    }

    try {
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      const timestamp = new Date().toISOString();

      const newTask = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: timestamp,
        lastModified: timestamp,
        statusHistory: [{
          status: taskData.status || 'TODO',
          timestamp: timestamp,
          updatedBy: auth?.currentUser?.email || 'unknown'
        }]
      };

      // Add to Firestore
      await updateDoc(projectRef, {
        tasks: arrayUnion(newTask),
        lastModified: serverTimestamp()
      });

      // Optimistic update
      setTasks(prevTasks => [...prevTasks, { ...newTask, type: 'task', isTask: true }]);

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [projectRef]);

  // Add real-time sync for tasks
  useEffect(() => {
    if (!projectRef) return;

    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const normalized = normalizeTaskData(data);
        setTasks(normalized.tasks || []);
        setProject(data);
        setLastUpdate(data.lastModified);
        setLoading(false);
      } else {
        console.warn('Project document does not exist');
        setTasks([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading tasks:', error);
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectRef, normalizeTaskData]);

  const value = useMemo(() => ({
    tasks,
    loading,
    error,
    project,
    lastUpdate,
    updateTask,
    updateTaskStatus,
    addTask,
    getTasksByStatus: (status) => {
      const normalizedStatus = status.toUpperCase().replace(/ /g, '_');
      return tasks.filter(task => task?.status === normalizedStatus);
    }
  }), [tasks, loading, error, project, lastUpdate, updateTask, updateTaskStatus, addTask]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext; 