import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { FiMaximize, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFObject = ({ file, onUpdate, scale = 1 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  const elementRef = React.useRef(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const changePage = (offset) => {
    setPageNumber(prev => Math.max(1, Math.min(numPages, prev + offset)));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();

    if (isDragging) {
      const mouseX = e.clientX / scale;
      const mouseY = e.clientY / scale;
      
      onUpdate({
        ...file,
        position: {
          x: (mouseX + dragOffset.x) * scale,
          y: (mouseY + dragOffset.y) * scale
        }
      });
    }

    if (isResizing && initialSize) {
      const dx = (e.clientX - initialSize.mouseX) / scale;
      const dy = (e.clientY - initialSize.mouseY) / scale;
      
      const aspectRatio = initialSize.width / initialSize.height;
      let newWidth = Math.max(200, initialSize.width + dx);
      let newHeight = Math.max(200, initialSize.height + dy);

      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
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
    setInitialSize(null);
    document.body.style.cursor = 'default';
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setInitialSize({
      width: file.size?.width || 600,
      height: file.size?.height || 800,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    document.body.style.cursor = 'nwse-resize';
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  return (
    <div
      ref={elementRef}
      className="absolute select-none"
      style={{
        left: file.position?.x || window.innerWidth / 2,
        top: file.position?.y || window.innerHeight / 2,
        width: file.size?.width || 600,
        height: file.size?.height || 800,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full overflow-hidden bg-white flex flex-col">
        {/* PDF Controls */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              <FiChevronLeft />
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              <FiChevronRight />
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="p-1 rounded hover:bg-slate-100"
            title="Download PDF"
          >
            <FiDownload />
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden">
          <Document
            file={file.url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => setError(error.message)}
            loading={
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading PDF...
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
                <p className="mb-4">{error || 'Failed to load PDF'}</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
                >
                  <FiDownload /> Download PDF
                </button>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={file.size?.width - 32 || 568}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-slate-800 cursor-se-resize rounded-tl"
        onMouseDown={handleResizeStart}
      >
        <FiMaximize className="w-3 h-3 text-white m-0.5" />
      </div>
    </div>
  );
};

export default PDFObject; 