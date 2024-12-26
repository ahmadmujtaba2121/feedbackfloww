import { useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const useTaskSync = (projectId, onTaskUpdate) => {
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to tasks collection changes
    const tasksRef = collection(db, 'projects', projectId, 'tasks');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const changes = snapshot.docChanges();
      
      changes.forEach((change) => {
        const taskData = {
          id: change.doc.id,
          ...change.doc.data()
        };

        if (change.type === 'modified') {
          // Call the callback with the updated task
          onTaskUpdate(taskData);
          
          // Show a toast notification for status changes
          const oldStatus = change.oldIndex !== -1 ? change.doc.data().status : null;
          if (oldStatus && oldStatus !== taskData.status) {
            toast.success(`Task status updated to ${taskData.status}`);
          }
        }
      });
    }, (error) => {
      console.error('Error syncing tasks:', error);
      toast.error('Failed to sync task updates');
    });

    return () => unsubscribe();
  }, [projectId, onTaskUpdate]);
}; 