import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  FiMousePointer,
  FiEdit2,
  FiSquare,
  FiCircle,
  FiArrowRight,
  FiType,
  FiMessageCircle,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiSave,
  FiChevronLeft,
  FiChevronRight,
  FiCode
} from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { PremiumFeature } from '../PremiumFeature';

const ToolBar = ({
  activeTool,
  setActiveTool,
  scale,
  setScale,
  projectId,
  layers,
  userRole = 'viewer'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  console.log('ToolBar rendering with activeTool:', activeTool); // Debug log

  // Keyboard shortcuts
  useHotkeys('v', () => setActiveTool('select'), { preventDefault: true });
  useHotkeys('p', () => setActiveTool('pen'), { preventDefault: true });
  useHotkeys('r', () => setActiveTool('rectangle'), { preventDefault: true });
  useHotkeys('c', () => setActiveTool('circle'), { preventDefault: true });
  useHotkeys('a', () => setActiveTool('arrow'), { preventDefault: true });
  useHotkeys('t', () => setActiveTool('text'), { preventDefault: true });
  useHotkeys('m', () => setActiveTool('comment'), { preventDefault: true });
  useHotkeys('mod+s', () => handleSave(), { preventDefault: true });

  const tools = [
    { id: 'select', icon: FiMousePointer, name: 'Select (V)' },
    { id: 'pen', icon: FiEdit2, name: 'Pen (P)' },
    { id: 'rectangle', icon: FiSquare, name: 'Rectangle (R)' },
    { id: 'circle', icon: FiCircle, name: 'Circle (C)' },
    { id: 'arrow', icon: FiArrowRight, name: 'Arrow (A)' },
    { id: 'text', icon: FiType, name: 'Text (T)' },
    { id: 'comment', icon: FiMessageCircle, name: 'Comment (M)' },
    { id: 'code', icon: FiCode, name: 'Code Block (D)' }
  ];

  const handleSave = async () => {
    if (!projectId || userRole === 'viewer') {
      toast.error('Only project owners and editors can save changes');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        layers: layers.map(layer => ({
          ...layer,
          content: Array.isArray(layer.content) ? layer.content : []
        })),
        lastModified: serverTimestamp()
      });
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    }
  };

  return (
    <div className={`relative bg-slate-800 border-r border-slate-700 flex flex-col justify-between py-3 transition-all duration-300 ${isCollapsed ? 'w-2' : 'w-12'}`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-50"
      >
        {isCollapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}
      </button>

      {!isCollapsed && (
        <>
          {/* Tools */}
          <div className="space-y-1.5 px-1.5">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ${activeTool === tool.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                title={tool.name}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Save and Zoom Controls */}
          <div className="space-y-1.5 px-1.5 mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={handleSave}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
              title="Save Changes (⌘S)"
            >
              <FiSave className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(Math.min(scale * 1.2, 5))}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
              title="Zoom In"
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
            <div className="text-center text-xs text-slate-400 py-1">
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={() => setScale(Math.max(scale / 1.2, 0.1))}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
              title="Zoom Out"
            >
              <FiZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
              title="Reset Zoom"
            >
              <FiMaximize2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ToolBar; 