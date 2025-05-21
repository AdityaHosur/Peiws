import React from 'react';
import './AnnotationTools.css';

const AnnotationTools = ({ onToolSelect, selectedTool, highlightColor, onColorChange, onUndo, onRedo,onSave,isSaving }) => {
  const tools = [
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
    { id: 'strikethrough', label: 'Strikethrough', icon: '🚫' },
    { id: 'underline', label: 'Underline', icon: '_' },
    { id: 'comment', label: 'Comment', icon: '💬' },
    { id: 'sticky', label: 'Sticky Note', icon: '📝' },
  ];

  return (
    <div className="annotation-toolbar">
      <div className="toolbar-section">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
          >
            <span className="tool-icon">{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>
      <div className="toolbar-section">
        <button className="tool-button" onClick={onUndo}>
          <span className="tool-icon">↺</span> Undo
        </button>
        <button className="tool-button" onClick={onRedo}>
          <span className="tool-icon">↻</span> Redo
        </button>
        <button 
          className="tool-button save-button" 
          onClick={onSave}
          disabled={isSaving}
        >
          <span className="tool-icon">💾</span>
          {isSaving ? 'Saving...' : 'Save'}
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
        </div>
      )}
    </div>
  );
};

export default AnnotationTools;