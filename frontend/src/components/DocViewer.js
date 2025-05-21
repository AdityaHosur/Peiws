import React, { useState,useRef,useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import AnnotationTools from './AnnotationTools';
import CommentMarker from './CommentMarker';
import StickyNote from './StickyNote';
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

const saveStickyNotes = (notes) => {
  localStorage.setItem('pdf_sticky_notes', JSON.stringify(notes));
};

const loadStickyNotes = () => {
  const saved = localStorage.getItem('pdf_sticky_notes');
  return saved ? JSON.parse(saved) : {};
};

const saveComments = (comments) => {
  localStorage.setItem('pdf_comments', JSON.stringify(comments));
};

const loadComments = () => {
  const saved = localStorage.getItem('pdf_comments');
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
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [documentId, setDocumentId] = useState(fileUrl);
  const [annotations, setAnnotations] = useState(loadAnnotations());
  const [comments, setComments] = useState(loadComments());
  const [stickyNotes, setStickyNotes] = useState(loadStickyNotes());
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const handleUndo = () => {
  if (undoStack.length > 0) {
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([...redoStack, lastAction]);

    switch (lastAction.type) {
      case 'add':
        if (lastAction.tool === 'comment') {
          setComments(prev => {
            const updated = {...prev};
            updated[documentId][pageNumber] = updated[documentId][pageNumber]
              .filter(c => c.id !== lastAction.comment.id);
            return updated;
          });
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => {
            const updated = {...prev};
            updated[documentId][pageNumber] = updated[documentId][pageNumber]
              .filter(n => n.id !== lastAction.sticky.id);
            return updated;
          });
        } else if (['highlight', 'underline', 'strikethrough'].includes(lastAction.tool)) {
          setAnnotations(prev => {
            const updated = {...prev};
            if (!updated[documentId]?.[pageNumber]) return prev;
            
            updated[documentId][pageNumber] = updated[documentId][pageNumber]
              .filter(a => a.timestamp !== lastAction.annotation.timestamp);
            return updated;
          });
        }
        break;
      case 'update':
        if (lastAction.tool === 'comment') {
          setComments(prev => {
            const comments = {...prev};
            comments[documentId][pageNumber] = comments[documentId][pageNumber]
              .map(c => c.id === lastAction.prevComment.id ? lastAction.prevComment : c);
            return comments;
          });
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => {
            const notes = {...prev};
            notes[documentId][pageNumber] = notes[documentId][pageNumber]
              .map(n => n.id === lastAction.prevSticky.id ? lastAction.prevSticky : n);
            return notes;
          });
        }
        break;

      case 'delete':
        if (lastAction.tool === 'comment') {
          setComments(prev => ({
            ...prev,
            [documentId]: {
              ...prev[documentId],
              [pageNumber]: [...prev[documentId][pageNumber], lastAction.comment]
            }
          }));
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => ({
            ...prev,
            [documentId]: {
              ...prev[documentId],
              [pageNumber]: [...prev[documentId][pageNumber], lastAction.sticky]
            }
          }));
        }
        break;
    }
  }
};

const handleRedo = () => {
  if (redoStack.length > 0) {
    const lastAction = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, lastAction]);

    switch (lastAction.type) {
      case 'add':
        if (lastAction.tool === 'comment') {
          setComments(prev => ({
            ...prev,
            [documentId]: {
              ...prev[documentId],
              [pageNumber]: [...prev[documentId][pageNumber], lastAction.comment]
            }
          }));
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => ({
            ...prev,
            [documentId]: {
              ...prev[documentId],
              [pageNumber]: [...prev[documentId][pageNumber], lastAction.sticky]
            }
          }));
        } else if (['highlight', 'underline', 'strikethrough'].includes(lastAction.tool)) {
          setAnnotations(prev => ({
            ...prev,
            [documentId]: {
              ...prev[documentId],
              [pageNumber]: [
                ...(prev[documentId]?.[pageNumber] || []),
                lastAction.annotation
              ]
            }
          }));
        }
        break;

      case 'update':
        if (lastAction.tool === 'comment') {
          setComments(prev => {
            const comments = {...prev};
            comments[documentId][pageNumber] = comments[documentId][pageNumber]
              .map(c => c.id === lastAction.newComment.id ? lastAction.newComment : c);
            return comments;
          });
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => {
            const notes = {...prev};
            notes[documentId][pageNumber] = notes[documentId][pageNumber]
              .map(n => n.id === lastAction.newSticky.id ? lastAction.newSticky : n);
            return notes;
          });
        }
        break;

      case 'delete':
        if (lastAction.tool === 'comment') {
          setComments(prev => {
            const updated = {...prev};
            updated[documentId][pageNumber] = updated[documentId][pageNumber]
              .filter(c => c.id !== lastAction.comment.id);
            return updated;
          });
        } else if (lastAction.tool === 'sticky') {
          setStickyNotes(prev => {
            const updated = {...prev};
            updated[documentId][pageNumber] = updated[documentId][pageNumber]
              .filter(n => n.id !== lastAction.sticky.id);
            return updated;
          });
        }
        break;
    }
  }
};

  // Add this useEffect after other useEffects
useEffect(() => {
  saveAnnotations(annotations);
}, [annotations]);

useEffect(() => {
  saveStickyNotes(stickyNotes);
}, [stickyNotes]);

useEffect(() => {
  saveComments(comments);
}, [comments]);

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


const handleTextSelection = () => {
  if (!selectedTool || ['comment', 'sticky'].includes(selectedTool)) return;

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
      pageNumber,
      documentId
    };

    setUndoStack([...undoStack, { type: 'add', tool: selectedTool, annotation: newAnnotation }]);
    setRedoStack([]);

    setAnnotations(prev => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [pageNumber]: [
          ...(prev[documentId]?.[pageNumber] || []),
          newAnnotation
        ]
      }
    }));

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

// Add after your existing useEffects
useEffect(() => {
  if (canvasRef.current && containerRef.current) {
    const pageElement = document.querySelector('.react-pdf__Page');
    if (pageElement) {
      const { width, height } = pageElement.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }
}, [numPages, scale]); // Reinitialize when page count or scale changes
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

const handleAddComment = (position) => {
  const newComment = {
    id: Date.now(),
    text: '',
    position,
    pageNumber,
    documentId,
  };
  
  setUndoStack([...undoStack, { type: 'add', tool: 'comment', comment: newComment }]);
    setRedoStack([]);

    setComments(prev => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [pageNumber]: [
          ...(prev[documentId]?.[pageNumber] || []),
          newComment
        ]
      }
    }));
  };

const handleAddStickyNote = (position) => {
  const newNote = {
    id: Date.now(),
    text: '',
    position,
    pageNumber,
    documentId,
  };
  
  setUndoStack([...undoStack, { type: 'add', tool: 'sticky', sticky: newNote }]);
  setRedoStack([]); // Clear redo stack on new action

  setStickyNotes(prev => ({
    ...prev,
    [documentId]: {
      ...prev[documentId],
      [pageNumber]: [
        ...(prev[documentId]?.[pageNumber] || []),
        newNote
      ]
    }
  }));
};

const handleDocumentClick = (e) => {
  if (selectedTool === 'comment') {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const position = {
      left: (e.clientX - rect.left) / scale,
      top: (e.clientY - rect.top) / scale
    };
    handleAddComment(position);
    setSelectedTool(null); // Reset tool after adding
  }
  else if (selectedTool === 'sticky') {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
    handleAddStickyNote(position);
    setSelectedTool(null);
  }
};

  return (
    <div className="doc-viewer" ref={containerRef}>
      <AnnotationTools
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
        highlightColor={highlightColor}
        onColorChange={setHighlightColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
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

      <div className="pdf-container" onClick={handleDocumentClick} style={{ position: 'relative' }}>
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
        {(comments[documentId]?.[pageNumber] || []).map(comment => (
          <CommentMarker
            key={comment.id}
            comment={comment}
            position={comment.position}
            scale={scale}
            onDelete={(id) => {
              // Store the comment before deleting for undo
              const commentToDelete = comments[documentId][pageNumber].find(c => c.id === id);
              setUndoStack([...undoStack, { 
                type: 'delete', 
                tool: 'comment', 
                comment: commentToDelete 
              }]);
              setRedoStack([]);

              setComments(prev => {
                const updated = {...prev};
                updated[documentId][pageNumber] = updated[documentId][pageNumber]
                  .filter(c => c.id !== id);
                return updated;
              });
            }}
                      onUpdate={(updated) => {
              // Store the previous state for undo
              const prevComment = comments[documentId][pageNumber].find(c => c.id === updated.id);
              setUndoStack([...undoStack, { 
                type: 'update', 
                tool: 'comment', 
                prevComment,
                newComment: updated 
              }]);
              setRedoStack([]);

              setComments(prev => {
                const comments = {...prev};
                comments[documentId][pageNumber] = comments[documentId][pageNumber]
                  .map(c => c.id === updated.id ? updated : c);
                return comments;
              });
            }}
          />
        ))}
        {(stickyNotes[documentId]?.[pageNumber] || []).map(note => (
          <StickyNote
            key={note.id}
            note={note}
            scale={scale}
            onDelete={(id) => {
              // Store the note before deleting for undo
              const noteToDelete = stickyNotes[documentId][pageNumber].find(n => n.id === id);
              setUndoStack([...undoStack, { 
                type: 'delete', 
                tool: 'sticky', 
                sticky: noteToDelete 
              }]);
              setRedoStack([]);

              setStickyNotes(prev => {
                const updated = {...prev};
                updated[documentId][pageNumber] = updated[documentId][pageNumber]
                  .filter(n => n.id !== id);
                return updated;
              });
            }}
                    onUpdate={(updated) => {
              // Store the previous state for undo
              const prevNote = stickyNotes[documentId][pageNumber].find(n => n.id === updated.id);
              setUndoStack([...undoStack, { 
                type: 'update', 
                tool: 'sticky', 
                prevSticky: prevNote,
                newSticky: updated 
              }]);
              setRedoStack([]);

              setStickyNotes(prev => {
                const notes = {...prev};
                notes[documentId][pageNumber] = notes[documentId][pageNumber]
                  .map(n => n.id === updated.id ? updated : n);
                return notes;
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default DocViewer;