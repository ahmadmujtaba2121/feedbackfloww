import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const updateProjectStatus = async (projectId, status) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    
    await updateDoc(projectRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });

    // Notify the owner through a notification collection
    const projectDoc = await getDoc(projectRef);
    const ownerId = projectDoc.data()?.ownerId;
    
    if (ownerId) {
      const notificationRef = doc(db, 'notifications', `${projectId}_${status}`);
      await setDoc(notificationRef, {
        userId: ownerId,
        projectId,
        type: status,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating project status:', error);
    return false;
  }
}; 