import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Canvas from './Canvas';
import ToolBar from './ToolBar';
import DrawingToolbar from './DrawingToolbar';
import LayerPanel from './LayerPanel';
import { toast } from 'react-hot-toast';
import ChatPanel from '../Chat/ChatPanel';

const CanvasPage = () => {
  const { projectId } = useParams();
  const [layers, setLayers] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [scale, setScale] = useState(1);
  const [drawingSettings, setDrawingSettings] = useState({
    color: '#FFFFFF',
    width: 2,
    opacity: 1,
    style: 'solid',
    fill: false,
    smoothing: true
  });
  const [userRole, setUserRole] = useState('user');

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLayers(data.layers || []);
          if (data.layers?.length > 0) {
            setActiveLayerId(data.layers[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project');
      }
    };
    loadProject();
  }, [projectId]);

  const handleAddLayer = async () => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      type: 'drawing',
      content: [],
      visible: true,
      locked: false
    };

    try {
      const updatedLayers = [...layers, newLayer];
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      });

      setLayers(updatedLayers);
      setActiveLayerId(newLayer.id);
      toast.success('New layer added');
    } catch (error) {
      console.error('Error adding layer:', error);
      toast.error('Failed to add layer');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddLayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layers]);

  return (
    <div className="fixed inset-0 flex">
      <ToolBar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        scale={scale}
        setScale={setScale}
        projectId={projectId}
        layers={layers}
        userRole={userRole}
      />
      <div className="flex-1 relative">
        <Canvas
          layers={layers}
          setLayers={setLayers}
          activeTool={activeTool}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          scale={scale}
          drawingSettings={drawingSettings}
          projectId={projectId}
          userRole={userRole}
        />
      </div>
      <DrawingToolbar
        settings={drawingSettings}
        setSettings={setDrawingSettings}
        activeTool={activeTool}
      />
      <LayerPanel
        layers={layers}
        setLayers={setLayers}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
        onAddLayer={handleAddLayer}
        userRole={userRole}
        projectId={projectId}
      />
      <ChatPanel projectId={projectId} />
    </div>
  );
};

export default CanvasPage; 