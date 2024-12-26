import React, { useState, useEffect } from 'react';
import { FiX, FiMaximize2, FiMinimize2, FiGitMerge } from 'react-icons/fi';

const VersionCompare = ({ version1, version2, onClose, onMerge }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [differences, setDifferences] = useState([]);
  const [selectedDiffs, setSelectedDiffs] = useState([]);

  // Calculate differences between versions
  useEffect(() => {
    if (!version1 || !version2) return;

    const diffs = [];
    const layers1 = version1.layers;
    const layers2 = version2.layers;

    // Compare layers
    const allLayerIds = new Set([
      ...layers1.map(l => l.id),
      ...layers2.map(l => l.id)
    ]);

    allLayerIds.forEach(id => {
      const layer1 = layers1.find(l => l.id === id);
      const layer2 = layers2.find(l => l.id === id);

      if (!layer1) {
        diffs.push({
          type: 'added',
          layerId: id,
          layer: layer2,
          description: `Layer "${layer2.name}" was added`
        });
      } else if (!layer2) {
        diffs.push({
          type: 'removed',
          layerId: id,
          layer: layer1,
          description: `Layer "${layer1.name}" was removed`
        });
      } else if (JSON.stringify(layer1) !== JSON.stringify(layer2)) {
        diffs.push({
          type: 'modified',
          layerId: id,
          layer1,
          layer2,
          description: `Layer "${layer1.name}" was modified`
        });
      }
    });

    setDifferences(diffs);
  }, [version1, version2]);

  const handleMerge = () => {
    if (selectedDiffs.length === 0) {
      return;
    }

    const mergedLayers = [...version1.layers];

    selectedDiffs.forEach(diffId => {
      const diff = differences.find(d => d.layerId === diffId);
      if (!diff) return;

      switch (diff.type) {
        case 'added':
          mergedLayers.push(diff.layer);
          break;
        case 'removed':
          const index = mergedLayers.findIndex(l => l.id === diff.layerId);
          if (index !== -1) {
            mergedLayers.splice(index, 1);
          }
          break;
        case 'modified':
          const layerIndex = mergedLayers.findIndex(l => l.id === diff.layerId);
          if (layerIndex !== -1) {
            mergedLayers[layerIndex] = diff.layer2;
          }
          break;
      }
    });

    onMerge(mergedLayers);
  };

  const toggleDiff = (layerId) => {
    setSelectedDiffs(prev => 
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
      isFullscreen ? 'p-0' : 'p-8'
    }`}>
      <div className={`bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-[900px] h-[600px]'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Compare Versions</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-5 h-5" />
              ) : (
                <FiMaximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Versions Info */}
          <div className="w-64 border-r border-slate-700 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Base Version</h4>
              <div className="p-3 bg-slate-700 rounded-lg">
                <div className="text-sm font-medium text-white mb-1">
                  {version1.description}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(version1.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Compare Version</h4>
              <div className="p-3 bg-slate-700 rounded-lg">
                <div className="text-sm font-medium text-white mb-1">
                  {version2.description}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(version2.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Changes List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {differences.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No differences found between these versions</p>
              ) : (
                differences.map(diff => (
                  <div
                    key={diff.layerId}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedDiffs.includes(diff.layerId)
                        ? 'bg-slate-700 border-violet-500'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => toggleDiff(diff.layerId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        diff.type === 'added' ? 'text-green-500'
                        : diff.type === 'removed' ? 'text-red-500'
                        : 'text-blue-500'
                      }`}>
                        {diff.description}
                      </span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDiffs.includes(diff.layerId)}
                          onChange={() => toggleDiff(diff.layerId)}
                          className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                    {diff.type === 'modified' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Position: ({diff.layer1.position?.x}, {diff.layer1.position?.y}) → ({diff.layer2.position?.x}, {diff.layer2.position?.y})</div>
                        <div>Visible: {diff.layer1.visible?.toString()} → {diff.layer2.visible?.toString()}</div>
                        <div>Locked: {diff.layer1.locked?.toString()} → {diff.layer2.locked?.toString()}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            {selectedDiffs.length} changes selected
          </div>
          <button
            onClick={handleMerge}
            disabled={selectedDiffs.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              selectedDiffs.length === 0
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            <FiGitMerge className="w-4 h-4" />
            <span>Merge Selected Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionCompare; 