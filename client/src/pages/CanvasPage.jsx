import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Canvas from '../components/Canvas/Canvas';
import ToolBar from '../components/Canvas/ToolBar';
import LayerPanel from '../components/Canvas/LayerPanel';
import DrawingToolbar from '../components/Canvas/DrawingToolbar';
import VersionPanel from '../components/Canvas/VersionControl/VersionPanel';
import ChatPanel from '../components/Chat/ChatPanel';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const CanvasPage = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [activeTool, setActiveTool] = useState('pen');
  const [scale, setScale] = useState(1);
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [drawingSettings, setDrawingSettings] = useState({
    color: '#000000',
    width: 2,
    opacity: 1,
    fill: false
  });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLayers(data.layers || []);
        // Set user role based on project data
        if (data.owner === currentUser?.email) {
          setUserRole('owner');
        } else if (data.collaborators?.includes(currentUser?.email)) {
          setUserRole('collaborator');
        } else {
          setUserRole('viewer');
        }
      }
    });

    return () => unsubscribe();
  }, [projectId, currentUser]);

  const handleAddLayer = () => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      content: []
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  return (
    <div className="fixed inset-0 flex bg-slate-900">
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
          currentUser={currentUser}
        />
      </div>
      <div className="flex flex-col">
        <LayerPanel
          layers={layers}
          setLayers={setLayers}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          onAddLayer={handleAddLayer}
          userRole={userRole}
          projectId={projectId}
        />
        <DrawingToolbar
          settings={drawingSettings}
          setSettings={setDrawingSettings}
          activeTool={activeTool}
        />
        <VersionPanel
          projectId={projectId}
          layers={layers}
          setLayers={setLayers}
          userRole={userRole}
        />
      </div>
      <ChatPanel projectId={projectId} />
    </div>
  );
};

export default CanvasPage;
