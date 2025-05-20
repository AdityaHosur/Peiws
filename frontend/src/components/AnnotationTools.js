import React from 'react';
import './AnnotationTools.css';

const AnnotationTools = ({ onToolSelect, selectedTool, highlightColor, onColorChange }) => {
  const tools = [
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
    { id: 'strikethrough', label: 'Strikethrough', icon: '🚫' },
    { id: 'underline', label: 'Underline', icon: '_' },
    { id: 'draw', label: 'Draw', icon: '✏️' },
  ];

  return (
    <div className="annotation-toolbar">
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
      {selectedTool === 'highlight' && (
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="color-picker"
        />
      )}
    </div>
  );
};

export default AnnotationTools;