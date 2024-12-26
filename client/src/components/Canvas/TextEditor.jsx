import React, { useState, useRef, useEffect } from 'react';
import { FiCheck, FiX, FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, FiAlignCenter, FiAlignRight } from 'react-icons/fi';

const TextEditor = ({ position = { x: 0, y: 0 }, onComplete, onCancel, scale = 1 }) => {
  const [text, setText] = useState('');
  const [textStyle, setTextStyle] = useState({
    fontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    listStyle: 'none',
    color: '#FFFFFF'
  });
  const inputRef = useRef(null);

  const fonts = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Monospace', value: 'monospace' }
  ];

  const fontSizes = [
    '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px',
    '36px', '42px', '48px', '56px', '64px', '72px', '84px', '96px'
  ];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const toggleStyle = (property, value) => {
    setTextStyle(prev => ({
      ...prev,
      [property]: prev[property] === value ? 'normal' : value
    }));
  };

  const handleComplete = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (text.trim()) {
      onComplete({
        content: text,
        style: textStyle
      });
    } else {
      handleCancel(e);
    }
  };

  const handleCancel = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComplete(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
        zIndex: 1000
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex flex-col bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-700 min-w-[300px]">
        <h3 className="text-sm font-medium text-white mb-2">Add Text</h3>

        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-slate-900/50 rounded-lg">
          {/* Font Family */}
          <select
            value={textStyle.fontFamily}
            onChange={e => setTextStyle(prev => ({ ...prev, fontFamily: e.target.value }))}
            className="bg-slate-700 text-white text-sm rounded px-2 py-1 outline-none"
          >
            {fonts.map(font => (
              <option key={font.value} value={font.value}>{font.name}</option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={textStyle.fontSize}
            onChange={e => setTextStyle(prev => ({ ...prev, fontSize: e.target.value }))}
            className="bg-slate-700 text-white text-sm rounded px-2 py-1 outline-none"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{parseInt(size)}px</option>
            ))}
          </select>

          {/* Style Buttons */}
          <button
            onClick={() => toggleStyle('fontWeight', 'bold')}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.fontWeight === 'bold' ? 'bg-slate-700' : ''}`}
            title="Bold"
          >
            <FiBold className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => toggleStyle('fontStyle', 'italic')}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.fontStyle === 'italic' ? 'bg-slate-700' : ''}`}
            title="Italic"
          >
            <FiItalic className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => toggleStyle('textDecoration', 'underline')}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.textDecoration === 'underline' ? 'bg-slate-700' : ''}`}
            title="Underline"
          >
            <FiUnderline className="w-4 h-4 text-white" />
          </button>

          {/* Alignment Buttons */}
          <button
            onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'left' }))}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.textAlign === 'left' ? 'bg-slate-700' : ''}`}
            title="Align Left"
          >
            <FiAlignLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'center' }))}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.textAlign === 'center' ? 'bg-slate-700' : ''}`}
            title="Align Center"
          >
            <FiAlignCenter className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setTextStyle(prev => ({ ...prev, textAlign: 'right' }))}
            className={`p-1.5 rounded hover:bg-slate-700 ${textStyle.textAlign === 'right' ? 'bg-slate-700' : ''}`}
            title="Align Right"
          >
            <FiAlignRight className="w-4 h-4 text-white" />
          </button>

          {/* Color Picker */}
          <input
            type="color"
            value={textStyle.color}
            onChange={e => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
            className="w-6 h-6 rounded cursor-pointer bg-transparent"
            title="Text Color"
          />
        </div>

        {/* Text Input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type something..."
          className="min-w-[200px] bg-slate-900/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-violet-500 outline-none resize-none mb-3"
          style={{
            fontFamily: textStyle.fontFamily,
            fontSize: textStyle.fontSize,
            fontWeight: textStyle.fontWeight,
            fontStyle: textStyle.fontStyle,
            textDecoration: textStyle.textDecoration,
            textAlign: textStyle.textAlign,
            color: textStyle.color
          }}
          rows={3}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors text-sm"
          >
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor; 