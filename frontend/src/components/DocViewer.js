import React, { useState,useRef,useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import AnnotationTools from './AnnotationTools';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './DocViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const DocViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
   const [selectedTool, setSelectedTool] = useState(null);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState([]);

  // Add a new useEffect to handle annotation scaling
// Add this after your other useEffect hooks
useEffect(() => {
  const reapplyAnnotations = () => {
    const pageElement = document.querySelector('.react-pdf__Page');
    const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');

    if (!textLayer || annotations.length === 0) return;

    // Clear existing annotations
    const existingAnnotations = textLayer.querySelectorAll('.pdf-annotation');
    existingAnnotations.forEach(annotation => annotation.remove());

    // Apply annotations with debouncing
    const applyAnnotations = () => {
      annotations.forEach(annotation => {
        if (annotation.pageNumber === pageNumber) {
          annotation.position.forEach(pos => {
            const overlay = document.createElement('div');
            overlay.className = `pdf-annotation ${annotation.type}`;

            const scaledPos = {
              left: pos.left * scale,
              top: pos.top * scale,
              width: pos.width * scale,
              height: pos.height * scale
            };

            if (annotation.type === 'highlight') {
              Object.assign(overlay.style, {
                position: 'absolute',
                left: `${scaledPos.left}px`,
                top: `${scaledPos.top}px`,
                width: `${scaledPos.width}px`,
                height: `${scaledPos.height}px`,
                backgroundColor: annotation.color,
                opacity: 0.4,
                pointerEvents: 'none'
              });
            } else {
              Object.assign(overlay.style, {
                position: 'absolute',
                left: `${scaledPos.left}px`,
                top: annotation.type === 'strikethrough' 
                  ? `${scaledPos.top + (scaledPos.height / 2)}px` 
                  : `${scaledPos.top + scaledPos.height - 2}px`,
                width: `${scaledPos.width}px`,
                height: '2px',
                backgroundColor: '#000',
                pointerEvents: 'none'
              });
            }

            textLayer.appendChild(overlay);
          });
        }
      });
    };

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(applyAnnotations);
  };

  // Add a small delay to ensure PDF is rendered
  const timeoutId = setTimeout(reapplyAnnotations, 100);
  return () => clearTimeout(timeoutId);
}, [scale, annotations, pageNumber]);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
  };

  const handleMouseDown = (e) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (selectedTool === 'draw' && isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

const handleTextSelection = () => {
  if (!selectedTool || selectedTool === 'draw') return;

  const selection = window.getSelection();
  const text = selection.toString().trim();
  if (!text) return;

  try {
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const pageElement = document.querySelector('.react-pdf__Page');
    const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
    const textLayerRect = textLayer.getBoundingClientRect();

    const positions = Array.from(rects).map(rect => ({
      left: (rect.left - textLayerRect.left) / scale,
      top: (rect.top - textLayerRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    }));

    // Save annotation with unscaled positions
    setAnnotations(prev => [
      ...prev,
      {
        type: selectedTool,
        color: highlightColor,
        pageNumber,
        content: text,
        position: positions,
      },
    ]);

    selection.removeAllRanges();
  } catch (error) {
    console.error('Error applying annotation:', error);
  }
};

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      changePage(-1);
    }
  };

  const nextPage = () => {
    if (pageNumber < numPages) {
      changePage(1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(2, prevScale + 0.1));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(0.5, prevScale - 0.1));
  };

  return (
    <div className="doc-viewer" ref={containerRef}>
      <AnnotationTools
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
        highlightColor={highlightColor}
        onColorChange={setHighlightColor}
      />
      <div className="pdf-controls">
        <button onClick={previousPage} disabled={pageNumber <= 1}>
          Previous
        </button>
        <span>
          Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
        </span>
        <button onClick={nextPage} disabled={pageNumber >= numPages}>
          Next
        </button>
        <button onClick={zoomOut}>-</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn}>+</button>
      </div>

      <div className="pdf-container">
          <canvas
          ref={canvasRef}
          className="annotation-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: selectedTool === 'draw' ? 'auto' : 'none',
            zIndex: 3
          }}
        />
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF...</div>}
          error={<div>Error loading PDF!</div>}
        >
          <div onMouseUp={handleTextSelection}
            style={{position: 'relative'}}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onLoadSuccess={(page) => {
                requestAnimationFrame(() => {
                  const textLayer = document.querySelector('.react-pdf__Page__textContent');
                  if (textLayer) {
                    textLayer.style.transform = 'none';
                  }
                });
              }}
            />
          </div>
        </Document>
      </div>
    </div>
  );
};

export default DocViewer;