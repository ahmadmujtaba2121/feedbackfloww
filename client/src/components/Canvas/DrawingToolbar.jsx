import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { FiChevronDown, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

const DrawingToolbar = ({ settings, setSettings, activeTool }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't show toolbar for select/move tool
  if (activeTool === 'select' || activeTool === 'move') {
    return null;
  }

  return (
    <div className={`bg-slate-800 border-l border-slate-700 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && <h3 className="text-lg font-semibold text-white">Settings</h3>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          {isCollapsed ? (
            <FiChevronLeft className="w-5 h-5 text-slate-400" />
          ) : (
            <FiChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Color Section */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Color</span>
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-600"
                    style={{ backgroundColor: settings.color }}
                  />
                  <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showColorPicker ? 'transform rotate-180' : ''}`} />
                </div>
              </label>

              {showColorPicker && (
                <div className="relative">
                  <div className="absolute right-0 z-10 bg-slate-900 rounded-lg p-3 shadow-xl border border-slate-700">
                    <HexColorPicker
                      color={settings.color}
                      onChange={(color) => setSettings(prev => ({ ...prev, color }))}
                      className="mb-2"
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-slate-400">#</span>
                      <input
                        type="text"
                        value={settings.color.replace('#', '')}
                        onChange={(e) => {
                          const color = `#${e.target.value}`;
                          if (/^#[0-9A-F]{6}$/i.test(color)) {
                            setSettings(prev => ({ ...prev, color }));
                          }
                        }}
                        className="w-full bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Line Width Section */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Line Width</span>
                <span className="text-sm text-slate-400">{settings.width}px</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.width}
                onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Opacity Section */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Opacity</span>
                <span className="text-sm text-slate-400">{Math.round(settings.opacity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.opacity}
                onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingToolbar; 