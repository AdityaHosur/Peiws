import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import AnnotationTools from './AnnotationTools';
import CommentMarker from './CommentMarker';
import StickyNote from './StickyNote';
import ScoreCard from './ScoreCard';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { saveReviewDetails, getReviewDetails, updateReviewStatus,getReviewStatus } from '../services/api';
import './DocViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Helper function to clear annotations from the DOM
const clearAllAnnotations = () => {
  const textLayer = document.querySelector('.react-pdf__Page__textContent');
  if (textLayer) {
    const existingAnnotations = textLayer.querySelectorAll('.pdf-annotation');
    existingAnnotations.forEach(annotation => annotation.remove());
  }
};

const DocViewer = ({ fileUrl, reviewId, readOnly=false }) => {
  // State for PDF viewer
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [selectedTool, setSelectedTool] = useState(null);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  const [documentId, setDocumentId] = useState(fileUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReviews, setCompletedReviews] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(readOnly);
  const isCurrentReviewCompleted = completedReviews[documentId] || false;
  
  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const annotationTimerRef = useRef(null);
  
  // Annotation states
  const [annotations, setAnnotations] = useState({});
  const [comments, setComments] = useState({});
  const [stickyNotes, setStickyNotes] = useState({});
  
  // Undo/redo states - document specific
  const [undoStacks, setUndoStacks] = useState({});
  const [redoStacks, setRedoStacks] = useState({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Score card state
  const [isScoreCardOpen, setIsScoreCardOpen] = useState(false);
  const [documentScores, setDocumentScores] = useState({});

  useEffect(() => {
  // Update readOnly state when prop changes or review is completed
  setIsReadOnly(readOnly || isCurrentReviewCompleted);
}, [readOnly, isCurrentReviewCompleted]);

  // Update undo/redo availability based on stack state
  useEffect(() => {
    setCanUndo((undoStacks[documentId]?.length || 0) > 0);
  }, [undoStacks, documentId]);

  useEffect(() => {
    setCanRedo((redoStacks[documentId]?.length || 0) > 0);
  }, [redoStacks, documentId]);

  // Initialize stacks for new documents
  useEffect(() => {
    if (!undoStacks[documentId]) {
      setUndoStacks(prev => ({
        ...prev,
        [documentId]: []
      }));
    }
    
    if (!redoStacks[documentId]) {
      setRedoStacks(prev => ({
        ...prev,
        [documentId]: []
      }));
    }
  }, [documentId, undoStacks, redoStacks]);

  // Document switching logic
  useEffect(() => {
    // Cancel any pending annotation rendering
    if (annotationTimerRef.current) {
      clearTimeout(annotationTimerRef.current);
    }
    
    // Clear annotations immediately
    clearAllAnnotations();
    
    // Update documentId and reset page
    setDocumentId(fileUrl);
    setPageNumber(1);
  }, [fileUrl]);

  // Undo handler
  const handleUndo = async () => {
    const docUndoStack = undoStacks[documentId] || [];
    
    if (docUndoStack.length > 0) {
      const lastAction = docUndoStack[docUndoStack.length - 1];
      
      // Update undo stack
      setUndoStacks(prev => ({
        ...prev,
        [documentId]: prev[documentId].slice(0, -1)
      }));
      
      // Update redo stack
      setRedoStacks(prev => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), lastAction]
      }));

      switch (lastAction.type) {
        case 'add':
          if (lastAction.tool === 'comment') {
            setComments(prev => {
              const updated = {...prev};
              if (!updated[documentId]?.[pageNumber]) return prev;
              updated[documentId][pageNumber] = updated[documentId][pageNumber]
                .filter(c => c.id !== lastAction.comment.id);
              return updated;
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const updated = {...prev};
              if (!updated[documentId]?.[pageNumber]) return prev;
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
              if (!comments[documentId]?.[pageNumber]) return prev;
              comments[documentId][pageNumber] = comments[documentId][pageNumber]
                .map(c => c.id === lastAction.prevComment.id ? lastAction.prevComment : c);
              return comments;
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const notes = {...prev};
              if (!notes[documentId]?.[pageNumber]) return prev;
              notes[documentId][pageNumber] = notes[documentId][pageNumber]
                .map(n => n.id === lastAction.prevSticky.id ? lastAction.prevSticky : n);
              return notes;
            });
          }
          break;
        case 'delete':
          if (lastAction.tool === 'comment') {
            setComments(prev => {
              const updated = {...prev};
              if (!updated[documentId]) updated[documentId] = {};
              if (!updated[documentId][pageNumber]) updated[documentId][pageNumber] = [];
              return {
                ...prev,
                [documentId]: {
                  ...prev[documentId],
                  [pageNumber]: [...updated[documentId][pageNumber], lastAction.comment]
                }
              };
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const updated = {...prev};
              if (!updated[documentId]) updated[documentId] = {};
              if (!updated[documentId][pageNumber]) updated[documentId][pageNumber] = [];
              return {
                ...prev,
                [documentId]: {
                  ...prev[documentId],
                  [pageNumber]: [...updated[documentId][pageNumber], lastAction.sticky]
                }
              };
            });
          }
          break;
        default:
          break;
      }
      
      // Auto-save changes after undo
      setTimeout(() => saveChangesToBackend(), 500);
    }
  };

  // Redo handler
  const handleRedo = async () => {
    const docRedoStack = redoStacks[documentId] || [];
    
    if (docRedoStack.length > 0) {
      const lastAction = docRedoStack[docRedoStack.length - 1];
      
      // Update redo stack
      setRedoStacks(prev => ({
        ...prev,
        [documentId]: prev[documentId].slice(0, -1)
      }));
      
      // Update undo stack
      setUndoStacks(prev => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), lastAction]
      }));

      switch (lastAction.type) {
        case 'add':
          if (lastAction.tool === 'comment') {
            setComments(prev => {
              const updated = {...prev};
              if (!updated[documentId]) updated[documentId] = {};
              if (!updated[documentId][pageNumber]) updated[documentId][pageNumber] = [];
              return {
                ...prev,
                [documentId]: {
                  ...prev[documentId],
                  [pageNumber]: [...updated[documentId][pageNumber], lastAction.comment]
                }
              };
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const updated = {...prev};
              if (!updated[documentId]) updated[documentId] = {};
              if (!updated[documentId][pageNumber]) updated[documentId][pageNumber] = [];
              return {
                ...prev,
                [documentId]: {
                  ...prev[documentId],
                  [pageNumber]: [...updated[documentId][pageNumber], lastAction.sticky]
                }
              };
            });
          } else if (['highlight', 'underline', 'strikethrough'].includes(lastAction.tool)) {
            setAnnotations(prev => {
              const updated = {...prev};
              if (!updated[documentId]) updated[documentId] = {};
              if (!updated[documentId][pageNumber]) updated[documentId][pageNumber] = [];
              return {
                ...prev,
                [documentId]: {
                  ...prev[documentId],
                  [pageNumber]: [...updated[documentId][pageNumber], lastAction.annotation]
                }
              };
            });
          }
          break;
        case 'update':
          if (lastAction.tool === 'comment') {
            setComments(prev => {
              const comments = {...prev};
              if (!comments[documentId]?.[pageNumber]) return prev;
              comments[documentId][pageNumber] = comments[documentId][pageNumber]
                .map(c => c.id === lastAction.newComment.id ? lastAction.newComment : c);
              return comments;
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const notes = {...prev};
              if (!notes[documentId]?.[pageNumber]) return prev;
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
              if (!updated[documentId]?.[pageNumber]) return prev;
              updated[documentId][pageNumber] = updated[documentId][pageNumber]
                .filter(c => c.id !== lastAction.comment.id);
              return updated;
            });
          } else if (lastAction.tool === 'sticky') {
            setStickyNotes(prev => {
              const updated = {...prev};
              if (!updated[documentId]?.[pageNumber]) return prev;
              updated[documentId][pageNumber] = updated[documentId][pageNumber]
                .filter(n => n.id !== lastAction.sticky.id);
              return updated;
            });
          }
          break;
        default:
          break;
      }
      
      // Auto-save changes after redo
      setTimeout(() => saveChangesToBackend(), 500);
    }
  };

  const handleSubmitReview = async () => {
  // Check if scores exist
  if (!documentScores[documentId] || 
      !documentScores[documentId].overall || 
      documentScores[documentId].overall <= 0) {
    alert('Please provide scores before submitting your review.');
    return;
  }

  // Confirm submission
  if (!window.confirm('Are you sure you want to submit this review? You will not be able to make further changes.')) {
    return;
  }

  setIsSubmitting(true);
  try {
    const token = localStorage.getItem('token');
    
    // First, save all current annotations and scores
    await saveChangesToBackend();
    
    // Then, update the review status to completed
    const response = await updateReviewStatus(token, reviewId, 'completed');
    
    setCompletedReviews(prev => ({
      ...prev,
      [documentId]: true
    }));
    alert('Review submitted successfully!');
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Failed to submit review. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // Load review details from backend
  useEffect(() => {
    const loadReviewDetails = async () => {
      if (!reviewId || !documentId) return;

      setIsLoading(true);
      clearAllAnnotations();
      
      try {
        const token = localStorage.getItem('token');
        const details = await getReviewDetails(token, reviewId);

        if (details.status === 'completed') {
            setCompletedReviews(prev => ({
                ...prev,
                [documentId]: true
            }));
        } else {
            // Make sure to reset if a document is no longer completed
            setCompletedReviews(prev => {
                const updated = {...prev};
                delete updated[documentId];
                return updated;
            });
        }
        
        // Group annotations by page number
        const annotationsByPage = {};
        const commentsByPage = {};
        const stickyNotesByPage = {};

        // Process annotations with validation
        details.annotations?.forEach(annotation => {
          // Skip invalid annotations
          if (!annotation || typeof annotation !== 'object') {
            console.error("Invalid annotation object:", annotation);
            return;
          }
          
          // Handle missing pageNumber
          if (annotation.pageNumber === undefined || annotation.pageNumber === null) {
            console.warn("Annotation missing pageNumber, defaulting to current page:", annotation);
            annotation.pageNumber = pageNumber;
          }
          
          const pageNum = annotation.pageNumber.toString();
          if (!annotationsByPage[pageNum]) {
            annotationsByPage[pageNum] = [];
          }

          // Validate position data
          let validPositions = annotation.position;
          
          if (!Array.isArray(validPositions)) {
            try {
              if (typeof annotation.position === 'string') {
                validPositions = JSON.parse(annotation.position);
              } else {
                validPositions = [annotation.position];
              }
            } catch (e) {
              console.error("Failed to parse position data:", e);
              return;
            }
          }

          // Ensure position objects have required properties
          const validatedPositions = validPositions.filter(pos => 
            pos && typeof pos === 'object' && 
            pos.left != null && 
            pos.top != null && 
            pos.width != null && 
            pos.height != null
          );

          if (validatedPositions.length === 0) {
            console.error("No valid positions found for annotation:", annotation);
            return;
          }
          
          // Create validated annotation object
          const processedAnnotation = {
            ...annotation,
            type: annotation.type || 'highlight',
            color: annotation.color || highlightColor,
            content: annotation.content || '',
            position: validatedPositions,
            timestamp: annotation.timestamp || Date.now(),
            pageNumber: parseInt(pageNum),
            documentId: documentId
          };
          
          annotationsByPage[pageNum].push(processedAnnotation);
        });

        // Process comments with validation
        details.comments?.forEach(comment => {
          if (comment.pageNumber === undefined || comment.pageNumber === null) {
            console.warn("Comment missing pageNumber, defaulting to current page:", comment);
            comment.pageNumber = pageNumber;
          }
          
          const pageNum = comment.pageNumber.toString();
          if (!commentsByPage[pageNum]) {
            commentsByPage[pageNum] = [];
          }
          
          commentsByPage[pageNum].push({
            ...comment,
            id: comment.id || Date.now(),
            pageNumber: parseInt(pageNum),
            documentId: documentId
          });
        });

        // Process sticky notes with validation
        details.stickyNotes?.forEach(note => {
          if (note.pageNumber === undefined || note.pageNumber === null) {
            console.warn("Sticky note missing pageNumber, defaulting to current page:", note);
            note.pageNumber = pageNumber;
          }
          
          const pageNum = note.pageNumber.toString();
          if (!stickyNotesByPage[pageNum]) {
            stickyNotesByPage[pageNum] = [];
          }
          
          stickyNotesByPage[pageNum].push({
            ...note,
            id: note.id || Date.now(),
            pageNumber: parseInt(pageNum),
            documentId: documentId
          });
        });

        // Load scores if they exist
        if (details.status === 'completed') {
          setCompletedReviews(prev => ({
            ...prev,
            [documentId]: true
          }));
        }

        // Update annotation states
        setAnnotations(prev => ({
          ...prev,
          [documentId]: annotationsByPage
        }));

        setComments(prev => ({
          ...prev,
          [documentId]: commentsByPage
        }));

        setStickyNotes(prev => ({
          ...prev,
          [documentId]: stickyNotesByPage
        }));

      } catch (error) {
        console.error('Error loading review details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewDetails();
  }, [documentId, reviewId, pageNumber]);

  // Save changes to backend
  const saveChangesToBackend = async () => {
    if (!reviewId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Collect annotations from all pages
      const allAnnotations = [];
      const allComments = [];
      const allStickies = [];

      Object.entries(annotations[documentId] || {}).forEach(([pageNum, pageAnnotations]) => {
        allAnnotations.push(...pageAnnotations.map(a => ({
          ...a,
          pageNumber: parseInt(pageNum),
          documentId
        })));
      });

      Object.entries(comments[documentId] || {}).forEach(([pageNum, pageComments]) => {
        allComments.push(...pageComments.map(c => ({
          ...c,
          pageNumber: parseInt(pageNum),
          documentId
        })));
      });

      Object.entries(stickyNotes[documentId] || {}).forEach(([pageNum, pageStickies]) => {
        allStickies.push(...pageStickies.map(s => ({
          ...s,
          pageNumber: parseInt(pageNum),
          documentId
        })));
      });

      const details = {
        annotations: allAnnotations,
        comments: allComments,
        stickyNotes: allStickies,
        scores: documentScores[documentId] || {}
      };
      
      await saveReviewDetails(token, reviewId, details);
    } catch (error) {
      console.error('Error saving review details:', error);
    }
  };

  // User-triggered save
  const saveReview = async () => {
    if (!reviewId) return;
    
    setIsSaving(true);
    try {
      await saveChangesToBackend();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving review details:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle score submission
const handleScoreSubmit = async (scoreData) => {
  setIsSaving(true);
  try {
    const token = localStorage.getItem('token');
    
    // Validate scores - ensure they're integers
    const validatedScores = {
      structure: Number(scoreData.structure),
      grammar: Number(scoreData.grammar),
      clarity: Number(scoreData.clarity),
      content: Number(scoreData.content),
      overall: Number(scoreData.overall),
      feedback: scoreData.feedback,
      summary: scoreData.summary,
      timestamp: Date.now()
    };
    
    console.log("Validated scores to submit:", validatedScores);
    
    // Prepare the data for backend
    const details = {
      annotations: annotations[documentId] ? Object.values(annotations[documentId]).flat() : [],
      comments: comments[documentId] ? Object.values(comments[documentId]).flat() : [],
      stickyNotes: stickyNotes[documentId] ? Object.values(stickyNotes[documentId]).flat() : [],
      scores: validatedScores // Use the validated scores
    };
    
    // Log the data being sent to the backend
    console.log("Sending data to backend:", JSON.stringify(details.scores));
    
    // Update local state with the validated scores
    setDocumentScores(prev => {
      const updated = {
        ...prev,
        [documentId]: validatedScores
      };
      console.log("Updated documentScores:", updated);
      return updated;
    });
    const response = await saveReviewDetails(token, reviewId, details);
    console.log("Backend response:", response);
    
    alert('Evaluation submitted successfully!');
  } catch (error) {
    console.error('Error saving evaluation:', error);
    alert('Failed to save evaluation. Please try again.');
  } finally {
    setIsSaving(false);
  }
};

  useEffect(() => {
  const checkReviewStatus = async () => {
    if (!reviewId) return;
    
    try {
      const token = localStorage.getItem('token');
      const reviewData = await getReviewStatus(token, reviewId);
      
      if (reviewData.status === 'completed') {
        setCompletedReviews(prev => ({
          ...prev,
          [documentId]: true
        }));
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };
  checkReviewStatus();
}, [reviewId, documentId]);

  // Apply annotations to the document
  useEffect(() => {
    const renderAnnotations = () => {
      const pageElement = document.querySelector('.react-pdf__Page');
      const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');

      if (!textLayer || !documentId) return;
      
      // Clear existing annotations first
      clearAllAnnotations();

      // Get annotations for current document and page
      const currentAnnotations = annotations[documentId]?.[pageNumber] || [];
      if (currentAnnotations.length === 0) return;

      // Apply annotations after a small delay
      if (annotationTimerRef.current) {
        clearTimeout(annotationTimerRef.current);
      }
      
      annotationTimerRef.current = setTimeout(() => {
        currentAnnotations.forEach(annotation => {
          // Skip annotations that don't belong to this document/page
          if (annotation.documentId !== documentId || 
              parseInt(annotation.pageNumber) !== parseInt(pageNumber)) {
            return;
          }
          
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
                opacity: 0.9,
                pointerEvents: 'none',
                zIndex: 2
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
                pointerEvents: 'none',
                zIndex: 2
              });
            }

            textLayer.appendChild(overlay);
          });
        });
      }, 200);
      
      return () => {
        if (annotationTimerRef.current) {
          clearTimeout(annotationTimerRef.current);
        }
      };
    };

    renderAnnotations();
  }, [documentId, pageNumber, scale, annotations]);

  // Ensure annotations are reapplied when the score card is closed
  useEffect(() => {
    if (!isScoreCardOpen) {
      setAnnotations(prev => ({...prev}));
    }
  }, [isScoreCardOpen]);

  // Handle text selection for annotations
  const handleTextSelection = () => {
    if (isReadOnly||isCurrentReviewCompleted) return;
    if (!selectedTool || ['comment', 'sticky'].includes(selectedTool) || !documentId) return;

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

      // Update undo/redo stacks
      setUndoStacks(prev => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), { 
          type: 'add', 
          tool: selectedTool, 
          annotation: newAnnotation 
        }]
      }));
      
      setRedoStacks(prev => ({
        ...prev,
        [documentId]: []
      }));

      // Add the annotation
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
      
      // Auto-save after a short delay
      setTimeout(() => saveChangesToBackend(), 1000);
    } catch (error) {
      console.error('Error applying annotation:', error);
    }
  };

  // Handle tool selection
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
  };

  // PDF navigation and zoom
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    clearAllAnnotations();
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
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

  // Comment and sticky note handlers
  const handleAddComment = (position) => {
    const newComment = {
      id: Date.now(),
      text: '',
      position,
      pageNumber,
      documentId,
    };
    
    // Add to document's undo stack
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'add', 
        tool: 'comment', 
        comment: newComment 
      }]
    }));
    
    // Clear document's redo stack
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setComments(prev => {
      const docComments = prev[documentId] || {};
      const pageComments = docComments[pageNumber] || [];
      
      return {
        ...prev,
        [documentId]: {
          ...docComments,
          [pageNumber]: [...pageComments, newComment]
        }
      };
    });
    
    // Auto-save after a short delay
    setTimeout(() => saveChangesToBackend(), 1000);
  };

  const handleAddStickyNote = (position) => {
    const newNote = {
      id: Date.now(),
      text: '',
      position,
      pageNumber,
      documentId,
    };
    
    // Update undo/redo stacks
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'add', 
        tool: 'sticky', 
        sticky: newNote 
      }]
    }));
    
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setStickyNotes(prev => {
      const docNotes = prev[documentId] || {};
      const pageNotes = docNotes[pageNumber] || [];
      
      return {
        ...prev,
        [documentId]: {
          ...docNotes,
          [pageNumber]: [...pageNotes, newNote]
        }
      };
    });
    
    // Auto-save after a short delay
    setTimeout(() => saveChangesToBackend(), 1000);
  };

  const handleDocumentClick = (e) => {
    if (isReadOnly||isCurrentReviewCompleted) return;
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

  // Handle comment and sticky note updates
  const handleCommentDelete = (id) => {
    // Store the comment before deleting for undo
    const commentToDelete = comments[documentId]?.[pageNumber]?.find(c => c.id === id);
    if (!commentToDelete) return;
    
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'delete', 
        tool: 'comment', 
        comment: commentToDelete 
      }]
    }));
    
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setComments(prev => {
      const updated = {...prev};
      if (!updated[documentId]?.[pageNumber]) return prev;
      
      updated[documentId][pageNumber] = updated[documentId][pageNumber]
        .filter(c => c.id !== id);
      
      return updated;
    });
    
    // Auto-save after delete
    setTimeout(() => saveChangesToBackend(), 500);
  };

  const handleCommentUpdate = (updated) => {
    // Store the previous state for undo
    const prevComment = comments[documentId]?.[pageNumber]?.find(c => c.id === updated.id);
    if (!prevComment) return;
    
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'update', 
        tool: 'comment', 
        prevComment,
        newComment: updated 
      }]
    }));
    
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setComments(prev => {
      const docComments = {...prev};
      if (!docComments[documentId]?.[pageNumber]) return prev;
      
      docComments[documentId][pageNumber] = docComments[documentId][pageNumber]
        .map(c => c.id === updated.id ? updated : c);
      
      return docComments;
    });
    
    // Auto-save after update
    setTimeout(() => saveChangesToBackend(), 1000);
  };

  const handleStickyDelete = (id) => {
    // Store the note before deleting for undo
    const noteToDelete = stickyNotes[documentId]?.[pageNumber]?.find(n => n.id === id);
    if (!noteToDelete) return;
    
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'delete', 
        tool: 'sticky', 
        sticky: noteToDelete 
      }]
    }));
    
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setStickyNotes(prev => {
      const updated = {...prev};
      if (!updated[documentId]?.[pageNumber]) return prev;
      
      updated[documentId][pageNumber] = updated[documentId][pageNumber]
        .filter(n => n.id !== id);
      
      return updated;
    });
    
    // Auto-save after delete
    setTimeout(() => saveChangesToBackend(), 500);
  };

  const handleStickyUpdate = (updated) => {
    // Store the previous state for undo
    const prevNote = stickyNotes[documentId]?.[pageNumber]?.find(n => n.id === updated.id);
    if (!prevNote) return;
    
    setUndoStacks(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), { 
        type: 'update', 
        tool: 'sticky', 
        prevSticky: prevNote,
        newSticky: updated 
      }]
    }));
    
    setRedoStacks(prev => ({
      ...prev,
      [documentId]: []
    }));

    setStickyNotes(prev => {
      const docNotes = {...prev};
      if (!docNotes[documentId]?.[pageNumber]) return prev;
      
      docNotes[documentId][pageNumber] = docNotes[documentId][pageNumber]
        .map(n => n.id === updated.id ? updated : n);
      
      return docNotes;
    });
    
    // Auto-save after update
    setTimeout(() => saveChangesToBackend(), 1000);
  };

  return (
    <div className="doc-viewer" ref={containerRef}>
      {!isReadOnly && (
      <AnnotationTools
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
        highlightColor={highlightColor}
        onColorChange={setHighlightColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={saveReview}
        onSubmitReview={handleSubmitReview}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenScoreCard={() => setIsScoreCardOpen(true)}
        documentScores={documentScores}
        documentId={documentId}
        isReviewCompleted={isCurrentReviewCompleted}
      />
      )}
      <ScoreCard
        isOpen={isScoreCardOpen}
        onClose={() => setIsScoreCardOpen(false)}
        onSubmit={handleScoreSubmit}
        documentId={documentId}
        reviewId={reviewId}
        existingScores={documentScores?.[documentId]}
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

      {isLoading && <div className="loading-overlay">Loading annotations...</div>}
      
      <div className="pdf-container" onClick={handleDocumentClick} style={{ position: 'relative' }}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF...</div>}
          error={<div>Error loading PDF!</div>}
        >
          <div 
            onMouseUp={handleTextSelection}
            style={{position: 'relative'}}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onLoadSuccess={(page) => {
                // Reset text layer transform and reapply annotations
                requestAnimationFrame(() => {
                  const textLayer = document.querySelector('.react-pdf__Page__textContent');
                  if (textLayer) {
                    textLayer.style.transform = 'none';
                    
                    // Trigger annotation reapplication
                    setAnnotations(prev => ({...prev}));
                  }
                });
              }}
            />
          </div>
        </Document>
        
        {/* Render comments */}
        {(comments[documentId]?.[pageNumber] || []).map(comment => (
          <CommentMarker
            key={comment.id}
            comment={comment}
            position={comment.position}
            scale={scale}
            onDelete={handleCommentDelete}
            onUpdate={handleCommentUpdate}
            readOnly={isReadOnly || isCurrentReviewCompleted}
          />
        ))}
        
        {/* Render sticky notes */}
        {(stickyNotes[documentId]?.[pageNumber] || []).map(note => (
          <StickyNote
            key={note.id}
            note={note}
            scale={scale}
            onDelete={handleStickyDelete}
            onUpdate={handleStickyUpdate}
            readOnly={isReadOnly || isCurrentReviewCompleted}
          />
        ))}
      </div>
    </div>
  );
};

export default DocViewer;