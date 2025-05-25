import React from 'react';
import './AnnotationTools.css';

const AnnotationTools = ({ 
  onToolSelect, 
  selectedTool, 
  highlightColor, 
  onColorChange, 
  onUndo, 
  onRedo,
  onSave,
  onSubmitReview,
  isSaving,
  isSubmitting,
  canUndo,
  canRedo,
  onOpenScoreCard,
  documentScores,
  documentId,
  isReviewCompleted
}) => {
  const tools = [
    { id: 'sticky', label: 'Sticky Note', icon: '📝' },
    { id: 'underline', label: 'Underline', icon: '＿' },
    { id: 'strikethrough', label: 'Strikethrough', icon: '🚫' },
    { id: 'comment', label: 'Comment', icon: '💬' },
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
  ];

  // Determine if scoring has been done for this document
  const hasScores = documentScores?.[documentId]?.overall > 0;
  return (
    <div className="annotation-toolbar">
      <div className="toolbar-section tools">
        {!isReviewCompleted && tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
            disabled={isReviewCompleted}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
        {selectedTool === 'highlight' && !isReviewCompleted && (
          <div className="toolbar-section">
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="color-picker"
              disabled={isReviewCompleted}
            />
            <span className="color-label">Color</span>
          </div>
        )}
        {isReviewCompleted && <div className="review-completed-notice">Review completed - Read Only</div>}
      </div>
      
      <div className="toolbar-section actions">
        {!isReviewCompleted && (
          <>
            <button 
              className="tool-button undo-button" 
              onClick={onUndo}
              disabled={!canUndo || isReviewCompleted}
            >
              <span className="tool-icon">↩</span>
              <span className="tool-label">Undo</span>
            </button>
            <button 
              className="tool-button redo-button" 
              onClick={onRedo}
              disabled={!canRedo || isReviewCompleted}
            >
              <span className="tool-icon">↪</span>
              <span className="tool-label">Redo</span>
            </button>
            <button 
              className="tool-button save-button" 
              onClick={onSave}
              disabled={isSaving || isReviewCompleted}
            >
              <span className="tool-icon">💾</span>
              <span className="tool-label">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
            <button 
              className="tool-button score-button" 
              onClick={onOpenScoreCard}
              disabled={isReviewCompleted}
            >
              <span className="tool-icon">📊</span>
              <span className="tool-label">Score</span>
            </button>
            <button 
              className="tool-button submit-button" 
              onClick={onSubmitReview}
              disabled={isSubmitting || !hasScores || isReviewCompleted}
              title={!hasScores ? "Please provide scores before submitting" : ""}
            >
              <span className="tool-icon">✓</span>
              <span className="tool-label">{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AnnotationTools;