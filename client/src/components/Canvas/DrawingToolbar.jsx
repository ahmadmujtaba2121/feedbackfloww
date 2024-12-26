import React, { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
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
                <span className="text-sm font-medium text-secondary-foreground">Color</span>
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: settings.color }}
                  />
                  <FiChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showColorPicker ? 'transform rotate-180' : ''}`} />
                </div>
              </label>

              {showColorPicker && (
                <div className="relative">
                  <div className="absolute right-0 z-10 bg-background rounded-lg p-3 shadow-xl border border-border">
                    <HexColorPicker
                      color={settings.color}
                      onChange={(color) => setSettings(prev => ({ ...prev, color }))}
                      className="mb-2"
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-muted-foreground">#</span>
                      <HexColorInput
                        color={settings.color}
                        onChange={(color) => setSettings(prev => ({ ...prev, color }))}
                        className="w-full bg-foreground text-secondary-foreground text-sm px-2 py-1 rounded border border-border"
                        prefixed={false}
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
              <div className="relative group">
                <div className="absolute -top-2 left-0 w-full">
                  <div className="relative">
                    <div
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${(settings.width - 1) * 100 / 19}%` }}
                    >
                      {settings.width}px
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={settings.width}
                  onChange={(e) => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  className="w-full appearance-none bg-slate-700 h-2 rounded-full outline-none 
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:hover:bg-violet-400 [&::-webkit-slider-thumb]:transition-colors"
                />
              </div>
            </div>

            {/* Opacity Section */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Opacity</span>
                <span className="text-sm text-slate-400">{Math.round(settings.opacity * 100)}%</span>
              </label>
              <div className="relative group">
                <div className="absolute -top-2 left-0 w-full">
                  <div className="relative">
                    <div
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${settings.opacity * 100}%` }}
                    >
                      {Math.round(settings.opacity * 100)}%
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.opacity}
                  onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                  className="w-full appearance-none bg-slate-700 h-2 rounded-full outline-none 
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:hover:bg-violet-400 [&::-webkit-slider-thumb]:transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingToolbar; 