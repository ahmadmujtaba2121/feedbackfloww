import React, { useState } from 'react';
import Button from './Button';
import { 
  FaPencilAlt, 
  FaEraser, 
  FaSquare, 
  FaCircle, 
  FaPalette,
  FaFont,
  FaCommentAlt,
  FaRegularSquare,
  FaRegularCircle,
  FaArrowsAlt,
  FaUndo,
  FaRedo,
  FaSave,
  FaDrawPolygon,
  FaLine,
  FaHandPaper
} from 'react-icons/fa';

export default function ProjectSidebar({ 
  onStartAddProject, 
  projects, 
  onSelectProject,
  selectedProjectId,
  onToolSelect,
  currentTool,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onSave,
  isViewer = false
}) {
  const [selectedColor, setSelectedColor] = useState('#000000');

  const tools = isViewer ? [
    { name: 'text', icon: <FaFont />, tooltip: 'Add Text' },
    { name: 'comment', icon: <FaCommentAlt />, tooltip: 'Add Comment' }
  ] : [
    { name: 'hand', icon: <FaHandPaper />, tooltip: 'Pan Tool' },
    { name: 'draw', icon: <FaPencilAlt />, tooltip: 'Freehand Draw' },
    { name: 'line', icon: <FaLine />, tooltip: 'Line Tool' },
    { name: 'rectangle', icon: <FaSquare />, tooltip: 'Rectangle' },
    { name: 'circle', icon: <FaCircle />, tooltip: 'Circle' },
    { name: 'polygon', icon: <FaDrawPolygon />, tooltip: 'Polygon' },
    { name: 'eraser', icon: <FaEraser />, tooltip: 'Eraser' }
  ];

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
    onColorChange(e.target.value);
  };

  return (
    <aside className="w-1/3 px-8 py-16 bg-stone-900 text-stone-50 md:w-72 rounded-r-xl">
      <h2 className="mb-8 font-bold uppercase md:text-xl text-stone-200">
        {isViewer ? 'Viewer Mode' : 'Your Projects'}
      </h2>
      
      {!isViewer && (
        <div>
          <Button onClick={onStartAddProject}>
            + Add Project
          </Button>
        </div>
      )}

      {/* Drawing Tools */}
      <div className="mt-8 border-t border-stone-700 pt-8">
        <h3 className="mb-4 font-bold text-stone-200">Available Tools</h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.name}
              className={`p-2 rounded-lg flex items-center justify-center ${
                currentTool === tool.name ? 'bg-stone-700' : 'bg-stone-800'
              } hover:bg-stone-700 transition-colors`}
              onClick={() => onToolSelect(tool.name)}
              title={tool.tooltip}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Only show color picker for text tool */}
        {(isViewer && currentTool === 'text') && (
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <FaPalette />
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                className="w-8 h-8 bg-transparent cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Projects List - Only show for non-viewers */}
      {!isViewer && (
        <ul className="mt-8">
          {projects.map((project) => {
            let cssClasses = "w-full text-left px-2 py-1 rounded-sm my-1 hover:text-stone-200 hover:bg-stone-800";
            
            if (project.id === selectedProjectId) {
              cssClasses += ' bg-stone-800 text-stone-200'
            } else {
              cssClasses += ' text-stone-400'
            }
            
            return (
              <li key={project.id}>
                <button
                  className={cssClasses}
                  onClick={() => onSelectProject(project.id)}
                >
                  {project.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
} 