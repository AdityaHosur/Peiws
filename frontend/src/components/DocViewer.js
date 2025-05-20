import React, { useState,useRef,useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import AnnotationTools from './AnnotationTools';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './DocViewer.css';

  // Add these near the top, after imports
const saveAnnotations = (annotations) => {
  localStorage.setItem('pdf_annotations', JSON.stringify(annotations));
};

const loadAnnotations = () => {
  const saved = localStorage.getItem('pdf_annotations');
  return saved ? JSON.parse(saved) : {};
};
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
  const [documentId, setDocumentId] = useState(fileUrl);
  const [annotations, setAnnotations] = useState(loadAnnotations());

  
  // Add this useEffect after other useEffects
useEffect(() => {
  saveAnnotations(annotations);
}, [annotations]);

// Add this after your other useEffect hooks
useEffect(() => {
  const reapplyAnnotations = () => {
    const pageElement = document.querySelector('.react-pdf__Page');
    const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');

    if (!textLayer) return;

    // Get annotations for current document and page
    const currentAnnotations = annotations[documentId]?.[pageNumber] || [];

    // Clear existing annotations
    const existingAnnotations = textLayer.querySelectorAll('.pdf-annotation');
    existingAnnotations.forEach(annotation => annotation.remove());

    // Delay applying annotations slightly to ensure PDF is rendered
    setTimeout(() => {
      // Apply annotations
      currentAnnotations.forEach(annotation => {
        annotation.position.forEach(pos => {
          const overlay = document.createElement('div');
          overlay.className = `pdf-annotation ${annotation.type}`;
          overlay.dataset.documentId = documentId;
          overlay.dataset.pageNumber = pageNumber;

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
      });
    }, 100); // Small delay to ensure PDF rendering is complete
  };

  // Use requestAnimationFrame for smoother rendering
  requestAnimationFrame(reapplyAnnotations);

}, [scale, annotations, pageNumber, documentId]);

// Add this new useEffect to handle page changes
useEffect(() => {
  const applyPageAnnotations = () => {
    const pageElement = document.querySelector('.react-pdf__Page');
    const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');

    if (!textLayer) return;

    // Get annotations for current document and page
    const currentAnnotations = annotations[documentId]?.[pageNumber] || [];

    // Clear existing annotations
    const existingAnnotations = textLayer.querySelectorAll('.pdf-annotation');
    existingAnnotations.forEach(annotation => annotation.remove());

    // Apply annotations for the current page
    currentAnnotations.forEach(annotation => {
      annotation.position.forEach(pos => {
        const overlay = document.createElement('div');
        overlay.className = `pdf-annotation ${annotation.type}`;
        overlay.dataset.documentId = documentId;
        overlay.dataset.pageNumber = pageNumber;

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
    });
  };

  // Wait for the page to render before applying annotations
  const timeoutId = setTimeout(applyPageAnnotations, 100);
  return () => clearTimeout(timeoutId);
}, [pageNumber]); // Only run when page number changes

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

    const newAnnotation = {
      type: selectedTool,
      color: highlightColor,
      content: text,
      position: positions,
      timestamp: Date.now(),
    };

    setAnnotations(prev => {
      const updated = {
        ...prev,
        [documentId]: {
          ...prev[documentId],
          [pageNumber]: [
            ...(prev[documentId]?.[pageNumber] || []),
            newAnnotation
          ]
        }
      };
      saveAnnotations(updated);
      return updated;
    });

    selection.removeAllRanges();
  } catch (error) {
    console.error('Error applying annotation:', error);
  }
};

// Add this useEffect to handle document switching
useEffect(() => {
  setDocumentId(fileUrl);
  // Force annotation reapplication after document change
  const timeoutId = setTimeout(() => {
    const pageElement = document.querySelector('.react-pdf__Page');
    const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');

    if (textLayer) {
      const currentAnnotations = annotations[fileUrl]?.[pageNumber] || [];
      
      // Clear existing annotations
      const existingAnnotations = textLayer.querySelectorAll('.pdf-annotation');
      existingAnnotations.forEach(annotation => annotation.remove());

      // Apply annotations for the new document
      currentAnnotations.forEach(annotation => {
        annotation.position.forEach(pos => {
          const overlay = document.createElement('div');
          overlay.className = `pdf-annotation ${annotation.type}`;
          overlay.dataset.documentId = fileUrl;
          overlay.dataset.pageNumber = pageNumber;

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
      });
    }
  }, 500); // Longer delay for document switching

  return () => clearTimeout(timeoutId);
}, [fileUrl]);

// Update the Document component to include onLoadComplete

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
  setPageNumber(prevPageNumber => {
    const newPageNumber = prevPageNumber + offset;
    // Force annotation reapplication after page change
    requestAnimationFrame(() => {
      const event = new CustomEvent('pagechanged', {
        detail: { pageNumber: newPageNumber, documentId }
      });
      document.dispatchEvent(event);
    });
    return newPageNumber;
  });
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
          onLoadComplete={() => {
          // Force annotation reapplication after document loads
          requestAnimationFrame(() => {
            const event = new Event('documentloaded');
            document.dispatchEvent(event);
          });
        }}
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
                    const event = new CustomEvent('pageloaded', { 
                      detail: { pageNumber, documentId } 
                    });
                    document.dispatchEvent(event);
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