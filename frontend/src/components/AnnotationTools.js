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
  isSaving,
  canUndo,
  canRedo 
}) => {
  const tools = [
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
    { id: 'underline', label: 'Underline', icon: '＿' },
    { id: 'strikethrough', label: 'Strikethrough', icon: '🚫' },
    { id: 'comment', label: 'Comment', icon: '💬' },
    { id: 'sticky', label: 'Sticky Note', icon: '📝' }
  ];

  return (
    <div className="annotation-toolbar">
      <div className="toolbar-section tools">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>
      
      <div className="toolbar-section actions">
        <button 
          className="tool-button undo-button" 
          onClick={onUndo}
          disabled={!canUndo}
        >
          <span className="tool-icon">↩</span>
          <span className="tool-label">Undo</span>
        </button>
        <button 
          className="tool-button redo-button" 
          onClick={onRedo}
          disabled={!canRedo}
        >
          <span className="tool-icon">↪</span>
          <span className="tool-label">Redo</span>
        </button>
        <button 
          className="tool-button save-button" 
          onClick={onSave}
          disabled={isSaving}
        >
          <span className="tool-icon">💾</span>
          <span className="tool-label">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
      
      {selectedTool === 'highlight' && (
        <div className="toolbar-section">
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="color-picker"
          />
          <span className="color-label">Color</span>
        </div>
      )}
    </div>
  );
};

export default AnnotationTools;