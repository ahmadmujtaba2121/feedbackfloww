import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const WatermarkedPDF = ({ url, watermark }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
    setError(error);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const renderWatermark = () => {
    return (
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Diagonal repeating watermark */}
        <div 
          className="absolute inset-0 flex items-center justify-center transform -rotate-30"
          style={{ 
            background: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.1) 100px,
              rgba(255, 255, 255, 0.1) 200px
            )`
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="text-white/20 text-lg whitespace-nowrap transform -rotate-45"
                style={{
                  position: 'absolute',
                  top: `${(i * 10)}%`,
                  left: `${(i * 10) - 50}%`,
                }}
              >
                {watermark}
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom watermark */}
        <div className="absolute bottom-4 left-4 text-white/50 text-sm">
          {watermark}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-400">
        Failed to load PDF. Please try again later.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-slate-900">
      {/* PDF Controls */}
      <div className="sticky top-0 z-10 w-full flex items-center justify-between p-4 bg-slate-800/90 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-slate-300">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="p-2 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
          >
            -
          </button>
          <span className="text-slate-300 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="relative flex-1 w-full overflow-auto p-4">
        <div className="relative mx-auto" style={{ maxWidth: 'fit-content' }}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onContextMenu={(e) => e.preventDefault()}
            className="select-none"
            loading={
              <div className="flex items-center justify-center p-4 text-slate-400">
                Loading PDF...
              </div>
            }
          >
            <Page
              key={`page_${pageNumber}`}
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center p-4 text-slate-400">
                  Loading page...
                </div>
              }
            />
            {renderWatermark()}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default WatermarkedPDF; 