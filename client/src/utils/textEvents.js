import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';

export const handleTextEvents = async ({
  textProps,
  layers,
  setLayers,
  projectId
}) => {
  try {
    const updatedLayers = layers.map(layer => {
      const textItem = layer.content?.find(item => item.id === textProps.id);
      if (textItem) {
        return {
          ...layer,
          content: layer.content.map(item =>
            item.id === textProps.id ? { ...item, ...textProps } : item
          )
        };
      }
      return layer;
    });

    setLayers(updatedLayers);

    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      layers: updatedLayers,
      lastModified: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating text:', error);
    toast.error('Failed to update text');
    setLayers(layers); // Revert on error
  }
}; 