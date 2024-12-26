import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiUnlock, FiTrash2, FiPlus } from 'react-icons/fi';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';

const LayerPanel = ({ projectId, layers = [], setLayers, activeLayerId, setActiveLayerId, onAddLayer }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState(null);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleLayerNameEdit = async (layerId, newName) => {
    if (!newName.trim()) {
      toast.error('Layer name cannot be empty');
      return;
    }

    try {
      const updatedLayers = layers.map(layer => 
        layer.id === layerId ? { ...layer, name: newName.trim() } : layer
      );

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        layers: updatedLayers,
        lastModified: serverTimestamp()
      });

      setLayers(updatedLayers);
      setEditingLayerId(null);
      setEditingName('');
      toast.success('Layer renamed successfully');
    } catch (error) {
      console.error('Error renaming layer:', error);
      toast.error('Failed to rename layer');
    }
  };

  const confirmDelete = async () => {
    if (!Array.isArray(layers)) {
      toast.error('Invalid layer data');
      return;
    }

    try {
      const newLayers = layers.filter(layer => layer.id !== layerToDelete);
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        layers: newLayers,
        lastModified: serverTimestamp()
      });

      if (activeLayerId === layerToDelete) {
        setActiveLayerId(newLayers[0]?.id || null);
      }

      setLayers(newLayers);
      setDeleteModalOpen(false);
      setLayerToDelete(null);
      toast.success('Layer deleted successfully');
    } catch (error) {
      console.error('Error deleting layer:', error);
      toast.error('Failed to delete layer');
    }
  };

  return (
    <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Layers</h3>
        <button
          onClick={onAddLayer}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          title="Add Layer"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`p-3 flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 transition-colors
              ${layer.id === activeLayerId ? 'bg-slate-700' : ''}`}
            onClick={() => setActiveLayerId(layer.id)}
            onDoubleClick={() => startEditing(layer)}
          >
            {editingLayerId === layer.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, layer.id)}
                onBlur={() => handleLayerNameEdit(layer.id, editingName)}
                className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 focus:border-violet-500 outline-none"
                autoFocus
              />
            ) : (
              <>
                <span className="flex-1 text-white truncate">{layer.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedLayers = layers.map(l =>
                        l.id === layer.id ? { ...l, visible: !l.visible } : l
                      );
                      setLayers(updatedLayers);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {layer.visible ? (
                      <FiEye className="w-4 h-4" />
                    ) : (
                      <FiEyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedLayers = layers.map(l =>
                        l.id === layer.id ? { ...l, locked: !l.locked } : l
                      );
                      setLayers(updatedLayers);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {layer.locked ? (
                      <FiLock className="w-4 h-4" />
                    ) : (
                      <FiUnlock className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayerToDelete(layer.id);
                      setDeleteModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Layer</h3>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this layer? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setLayerToDelete(null);
                }}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;