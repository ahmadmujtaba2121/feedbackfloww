import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../firebase/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
    if (!data) {
      console.warn('Received null or undefined data in normalizeTaskData');
      return { tasks: [], reviews: [] };
    }

    const normalizeStatus = (status) => {
      if (!status || typeof status !== 'string') {
        return 'TODO';
      }
      // Convert to uppercase and replace spaces with underscores
      const normalizedStatus = status.toUpperCase().replace(/ /g, '_');
      // Ensure the status exists in TASK_STATUSES, otherwise default to TODO
      return normalizedStatus in TASK_STATUSES ? normalizedStatus : 'TODO';
    };

    // Handle regular tasks
    const projectTasks = Array.isArray(data.tasks) ? data.tasks.map(task => ({
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: normalizeStatus(task.status),
      isTask: true,
      type: 'task'
    })) : [];

    // Handle reviews
    const projectReviews = Array.isArray(data.reviews) ? data.reviews
      .map(review => {
        const normalizedReview = {
          ...review,
          id: review.id || `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: normalizeStatus(review.status),
          isReview: true,
          type: 'review'
        };
        return normalizedReview;
      }) : [];

    return { tasks: projectTasks, reviews: projectReviews };
  }, []);

  // Update task status
  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    if (!projectRef || !taskId) {
      console.error('Missing projectRef or taskId in updateTaskStatus');
      return;
    }

    try {
      // Get the latest project data first
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }
      const projectData = projectSnap.data();

      // Find the task in both tasks and reviews arrays
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Normalize the new status
      const normalizedStatus = newStatus.toUpperCase().replace(/ /g, '_');
      if (!(normalizedStatus in TASK_STATUSES)) {
        throw new Error(`Invalid status: ${normalizedStatus}`);
      }

      const statusValue = normalizedStatus;
      const timestamp = new Date().toISOString();

      const updatedTask = {
        ...task,
        status: statusValue,
        lastModified: timestamp,
        statusHistory: [
          ...(task.statusHistory || []),
          {
            status: statusValue,
            timestamp: timestamp,
            updatedBy: auth?.currentUser?.email || 'unknown'
          }
        ]
      };

      // Update in the correct array based on type
      let tasksToUpdate = [...(projectData.tasks || [])];
      let reviewsToUpdate = [...(projectData.reviews || [])];

      if (task.type === 'task') {
        tasksToUpdate = tasksToUpdate.map(t =>
          t.id === taskId ? updatedTask : t
        );
      } else if (task.type === 'review') {
        reviewsToUpdate = reviewsToUpdate.map(r =>
          r.id === taskId ? updatedTask : r
        );
      }

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      );

      // Update in Firestore
      await updateDoc(projectRef, {
        tasks: tasksToUpdate,
        reviews: reviewsToUpdate,
        lastModified: serverTimestamp()
      });

      // Notify assignee if exists
      if (task.assignedTo) {
        const notificationRef = doc(db, 'notifications', task.assignedTo);
        await setDoc(notificationRef, {
          notifications: arrayUnion({
            type: 'task_status_change',
            taskId,
            taskTitle: task.title,
            newStatus: statusValue,
            timestamp: timestamp,
            read: false,
            from: auth?.currentUser?.email || 'unknown'
          })
        }, { merge: true });
      }

      toast.success(`${task.type === 'review' ? 'Review' : 'Task'} status updated to ${TASK_STATUSES[statusValue].label}`);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update status');
      throw error;
    }
  }, [projectRef, tasks]);

  // Add updateTask function
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

      // Notify assignee if exists
      if (taskData.assignedTo) {
        const notificationRef = doc(db, 'notifications', taskData.assignedTo);
        await setDoc(notificationRef, {
          notifications: arrayUnion({
            type: 'task_assigned',
            taskId: newTask.id,
            taskTitle: newTask.title,
            timestamp: timestamp,
            read: false,
            from: auth?.currentUser?.email || 'unknown'
          })
        }, { merge: true });
      }

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
        setTasks(normalized.tasks);
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

  // Memoize the context value
  const value = useMemo(() => ({
    tasks,
    loading,
    error,
    project,
    lastUpdate,
    updateTaskStatus,
    updateTask,
    addTask,
    getTasksByStatus: (status) => {
      const normalizedStatus = status.toUpperCase().replace(/ /g, '_');
      return tasks.filter(task => task.status === normalizedStatus);
    }
  }), [tasks, loading, error, project, lastUpdate, updateTaskStatus, updateTask, addTask]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext; 