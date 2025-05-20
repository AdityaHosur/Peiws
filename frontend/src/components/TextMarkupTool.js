import React from 'react';
import './TextMarkupTool.css';

const TextMarkupTool = ({ onMarkup }) => {
  return (
    <div className="text-markup-tool">
      <button onClick={() => onMarkup('strikethrough')} className="markup-button">
        Strikethrough
      </button>
      <button onClick={() => onMarkup('underline')} className="markup-button">
        Underline
      </button>
    </div>
  );
};

export default TextMarkupTool;