import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { TOOLS } from '../constants';

export const handleLayerEvents = async ({
  e,
  layers,
  selectedId,
  setSelectedId,
  setLayers,
  projectId,
  tool
}) => {
  if (tool !== TOOLS.SELECT) return;

  const clickedEmpty = e.target === e.target.getStage();
  
  if (clickedEmpty) {
    setSelectedId(null);
    return;
  }

  const clickedOnLayer = e.target;
  const layerId = clickedOnLayer.id();

  if (selectedId === layerId) {
    return;
  }

  setSelectedId(layerId);

  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      lastModified: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating layer selection:', error);
    toast.error('Failed to update selection');
  }
}; 