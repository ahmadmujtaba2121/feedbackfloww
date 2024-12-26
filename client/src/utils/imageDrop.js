import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';

export const handleImageDrop = async ({
  e,
  point,
  layers,
  setLayers,
  projectId,
  scale
}) => {
  const files = Array.from(e.dataTransfer.files);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type not supported: ${file.type}`);
      continue;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageLayer = {
          id: `image-${Date.now()}`,
          type: 'Image',
          src: event.target.result,
          x: point.x / scale,
          y: point.y / scale,
          width: 200,
          height: 200,
          draggable: true
        };

        const updatedLayers = [...layers, imageLayer];
        setLayers(updatedLayers);

        try {
          const projectRef = doc(db, 'projects', projectId);
          await updateDoc(projectRef, {
            layers: updatedLayers,
            lastModified: serverTimestamp()
          });
          toast.success('Image added successfully');
        } catch (error) {
          console.error('Error saving image:', error);
          toast.error('Failed to save image');
          setLayers(layers); // Revert on error
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
    }
  }
}; 