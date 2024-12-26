import React from 'react';
import CanvasEditor from './CanvasEditor';
import ToolPanel from './Tools/ToolPanel';
import LayerPanel from './Layers/LayerPanel';
import VersionPanel from './VersionControl/VersionPanel';

const CanvasWorkspace = ({ projectId }) => {
  const [layers, setLayers] = React.useState([]);
  const [selectedTool, setSelectedTool] = React.useState('select');
  const [selectedLayer, setSelectedLayer] = React.useState(null);

  return (
    <div className="flex h-screen bg-slate-900">
      <ToolPanel selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      
      <div className="flex-1 relative">
        <CanvasEditor
          layers={layers}
          setLayers={setLayers}
          selectedTool={selectedTool}
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
        />
      </div>

      <LayerPanel
        layers={layers}
        setLayers={setLayers}
        selectedLayer={selectedLayer}
        setSelectedLayer={setSelectedLayer}
      />

      <VersionPanel
        projectId={projectId}
        layers={layers}
        setLayers={setLayers}
      />
    </div>
  );
};

export default CanvasWorkspace; 