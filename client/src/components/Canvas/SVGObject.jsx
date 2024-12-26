import React, { useState, useRef, useEffect } from 'react';
import { FiCornerRightDown } from 'react-icons/fi';
import { HiColorSwatch } from 'react-icons/hi';
import { ChromePicker } from 'react-color';

const SVGObject = ({ file, onUpdate, scale = 1 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
    const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [svgColor, setSvgColor] = useState(file.fillColor || '#000000');
    const elementRef = useRef(null);

    const getScaledMousePosition = (e) => {
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return {
            x: (e.clientX - centerX) / scale,
            y: (e.clientY - centerY) / scale
        };
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();
        e.stopPropagation();

        const rect = elementRef.current.getBoundingClientRect();
        const mouseX = e.clientX / scale;
        const mouseY = e.clientY / scale;
        const elementCenterX = (rect.left + rect.width / 2) / scale;
        const elementCenterY = (rect.top + rect.height / 2) / scale;

        setIsDragging(true);
        setDragOffset({
            x: elementCenterX - mouseX,
            y: elementCenterY - mouseY
        });

        document.body.style.cursor = 'move';
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        setInitialSize({
            width: file.size?.width || 300,
            height: file.size?.height || 300
        });
        setInitialMousePos(getScaledMousePosition(e));

        document.body.style.cursor = 'nwse-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;

            if (isDragging) {
                const mouseX = e.clientX / scale;
                const mouseY = e.clientY / scale;

                onUpdate({
                    ...file,
                    position: {
                        x: mouseX + dragOffset.x,
                        y: mouseY + dragOffset.y
                    }
                });
            }

            if (isResizing) {
                const currentPos = getScaledMousePosition(e);
                const deltaX = currentPos.x - initialMousePos.x;
                const deltaY = currentPos.y - initialMousePos.y;

                // Calculate new dimensions while maintaining aspect ratio
                const aspectRatio = initialSize.width / initialSize.height;
                let newWidth = Math.max(100, initialSize.width + deltaX * 2);
                let newHeight = Math.max(100, initialSize.height + deltaY * 2);

                // Maintain aspect ratio if shift is held
                if (e.shiftKey) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newWidth = newHeight * aspectRatio;
                    }
                }

                onUpdate({
                    ...file,
                    size: {
                        width: Math.round(newWidth),
                        height: Math.round(newHeight)
                    }
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, initialSize, initialMousePos]);

    const handleColorChange = (color) => {
        setSvgColor(color.hex);
        onUpdate({
            ...file,
            fillColor: color.hex
        });
    };

    return (
        <div
            ref={elementRef}
            className="absolute group"
            style={{
                position: 'absolute',
                left: file.position.x,
                top: file.position.y,
                width: file.size?.width || 300,
                height: file.size?.height || 300,
                transform: 'translate(-50%, -50%)',
                cursor: isDragging ? 'move' : isResizing ? 'nwse-resize' : 'move',
                touchAction: 'none',
                userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* SVG Content */}
                <div className="relative inline-flex">
                    <img
                        src={file.content}
                        alt={file.name}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                        draggable={false}
                        style={{ userSelect: 'none' }}
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-violet-500 transition-colors rounded-lg" />
                </div>

                {/* Color Controls */}
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-2 bg-slate-800 rounded-bl-lg text-white hover:bg-slate-700"
                        title="Change color"
                    >
                        <HiColorSwatch className="w-4 h-4" />
                    </button>
                </div>

                {/* Color Picker Popover */}
                {showColorPicker && (
                    <div
                        className="absolute top-0 right-12 z-50 bg-slate-800 p-3 rounded-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ChromePicker
                            color={svgColor}
                            onChange={handleColorChange}
                            disableAlpha
                        />
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize flex items-center justify-center z-10"
                    onMouseDown={handleResizeStart}
                >
                    <FiCornerRightDown className="w-4 h-4 text-white" />
                </div>
            </div>
        </div>
    );
};

export default SVGObject;